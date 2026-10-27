import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import {
    sendKitchenSoftDeletedEmail,
    sendKitchenPermanentlyDeletedEmail,
    sendKitchenDeletionRevokedEmail,
    sendUserAccountSoftDeletedEmail,
    sendUserAccountPermanentlyDeletedEmail,
    sendUserAccountDeletionRevokedEmail,
} from "@/lib/emailService";

export interface AccountDeletionConfig {
    days: number;
    hours: number;
    minutes: number;
    cronHour: number;
    cronMinute: number;
    gracePeriodMs: number;
}

/**
 * Returns the current account deletion configuration parsed from environment variables
 * with sensible fallbacks (30 days, cron at 03:00).
 */
export function getGracePeriodConfig(): AccountDeletionConfig {
    const rawDays = process.env.ACCOUNT_DELETION_DAYS;
    const rawHours = process.env.ACCOUNT_DELETION_HOURS;
    const rawMinutes = process.env.ACCOUNT_DELETION_MINUTES;
    const rawCronHour = process.env.ACCOUNT_DELETION_CRON_HOUR;
    const rawCronMinute = process.env.ACCOUNT_DELETION_CRON_MINUTE;

    const days = rawDays !== undefined && !isNaN(Number(rawDays)) ? Number(rawDays) : 30;
    const hours = rawHours !== undefined && !isNaN(Number(rawHours)) ? Number(rawHours) : 0;
    const minutes = rawMinutes !== undefined && !isNaN(Number(rawMinutes)) ? Number(rawMinutes) : 0;
    const cronHour = rawCronHour !== undefined && !isNaN(Number(rawCronHour)) ? Number(rawCronHour) : 3;
    const cronMinute = rawCronMinute !== undefined && !isNaN(Number(rawCronMinute)) ? Number(rawCronMinute) : 0;

    let gracePeriodMs = ((days * 24 + hours) * 60 + minutes) * 60 * 1000;
    // Safety fallback: if configured to <= 0 ms, default to 30 days
    if (gracePeriodMs <= 0) {
        gracePeriodMs = 30 * 24 * 60 * 60 * 1000;
    }

    return {
        days,
        hours,
        minutes,
        cronHour,
        cronMinute,
        gracePeriodMs
    };
}

/**
 * Returns total grace period duration in milliseconds.
 */
export function getAccountDeletionGracePeriodMs(): number {
    return getGracePeriodConfig().gracePeriodMs;
}

/**
 * Calculates the exact scheduled permanent deletion date given the deletion request timestamp.
 */
export function getScheduledPermanentDeletionDate(deletedAt: Date | string): Date {
    const d = new Date(deletedAt);
    return new Date(d.getTime() + getAccountDeletionGracePeriodMs());
}

/**
 * Checks whether the grace period has expired for a soft-deleted account.
 */
export function isGracePeriodExpired(deletedAt: Date | string | null | undefined): boolean {
    if (!deletedAt) return false;
    const scheduled = getScheduledPermanentDeletionDate(deletedAt);
    return Date.now() >= scheduled.getTime();
}

/**
 * Soft deletes an account by marking deletedAt timestamp.
 * If user is a seller, marks deletedAt on the seller profile and sets isOnline = false.
 */
export async function softDeleteAccount(userId: string, isSellerAccount?: boolean) {
    const user = await db.user.findUnique({
        where: { id: userId },
        include: { sellerProfile: true }
    });

    if (!user) {
        throw new Error("User account not found");
    }

    if (user.isPermanentlyDeleted) {
        throw new Error("This account has already been permanently deleted.");
    }

    const isSeller = Boolean(
        isSellerAccount ||
        (user.role && user.role.toUpperCase() === "SELLER") ||
        user.sellerProfile
    );

    const now = new Date();
    const scheduledDeletionDate = getScheduledPermanentDeletionDate(now);

    await db.$transaction(async (tx) => {
        await tx.user.update({
            where: { id: userId },
            data: {
                deletedAt: now,
                isActive: false
            }
        });

        if (user.sellerProfile) {
            await tx.sellerProfile.update({
                where: { userId },
                data: {
                    deletedAt: now,
                    isOnline: false
                }
            });
        }
    });

    try {
        const graceConfig = getGracePeriodConfig();
        const formattedScheduledDate = scheduledDeletionDate.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
        const daysRemaining = Math.max(1, Math.ceil(graceConfig.gracePeriodMs / (1000 * 60 * 60 * 24)));

        if (user.email) {
            if (isSeller) {
                sendKitchenSoftDeletedEmail({
                    sellerName: user.name || undefined,
                    sellerEmail: user.email,
                    businessName: user.sellerProfile?.businessName || "Your Kitchen",
                    scheduledDate: formattedScheduledDate,
                    daysRemaining,
                }).catch((err) => console.error("[EmailService] Failed to send kitchen soft delete email:", err));
            } else {
                sendUserAccountSoftDeletedEmail({
                    userName: user.name || "Customer",
                    userEmail: user.email,
                    scheduledDeletionDate: formattedScheduledDate,
                    daysRemaining,
                }).catch((err) => console.error("[EmailService] Failed to send user account soft delete email:", err));
            }
        }
    } catch (e) {
        console.error("[EmailService] Error dispatching soft delete notification:", e);
    }

    return {
        success: true,
        deletedAt: now,
        scheduledDeletionDate,
        gracePeriod: getGracePeriodConfig()
    };
}

/**
 * Restores a soft-deleted account upon login before the grace period expires.
 */
export async function restoreAccountIfWithinGracePeriod(user: { id: string; deletedAt: Date | null; isPermanentlyDeleted?: boolean }) {
    if (!user.deletedAt || user.isPermanentlyDeleted) {
        return false;
    }

    if (isGracePeriodExpired(user.deletedAt)) {
        // Expired! Permanently anonymize now
        await anonymizeUserAccount(user.id);
        return false;
    }

    // Cancel deletion and reactivate
    let fullUser: any = null;

    await db.$transaction(async (tx) => {
        fullUser = await tx.user.update({
            where: { id: user.id },
            data: {
                deletedAt: null,
                isActive: true
            },
            include: {
                sellerProfile: true
            }
        });

        // Also restore seller profile deletedAt if exists
        const sellerProfile = await tx.sellerProfile.findUnique({
            where: { userId: user.id }
        });

        if (sellerProfile && sellerProfile.deletedAt) {
            await tx.sellerProfile.update({
                where: { userId: user.id },
                data: {
                    deletedAt: null
                }
            });
        }
    });

    console.log(`[Account Deletion] Soft-deleted account ${user.id} has been restored upon successful login.`);

    // Dispatch welcome-back & revocation confirmation email
    try {
        if (fullUser?.email) {
            if (fullUser.role === "SELLER" || fullUser.sellerProfile) {
                const businessName = fullUser.sellerProfile?.businessName || "Your Kitchen";
                sendKitchenDeletionRevokedEmail({
                    sellerName: fullUser.name || undefined,
                    sellerEmail: fullUser.email,
                    businessName
                }).catch((err) => console.error("[EmailService] Failed to send kitchen deletion revoked email:", err));
            } else {
                sendUserAccountDeletionRevokedEmail({
                    userName: fullUser.name || "Customer",
                    userEmail: fullUser.email
                }).catch((err) => console.error("[EmailService] Failed to send user account deletion revoked email:", err));
            }
        }
    } catch (emailErr) {
        console.error("[EmailService] Error dispatching account deletion revoked notification:", emailErr);
    }

    return true;
}

/**
 * Anonymizes personal details (PII) of a user/seller without removing records from the database.
 * This preserves foreign key relational integrity (orders, reviews, transactions, bookings).
 */
export async function anonymizeUserAccount(userId: string) {
    const user = await db.user.findUnique({
        where: { id: userId },
        include: { sellerProfile: true, addresses: true }
    });

    if (!user) return null;
    if (user.isPermanentlyDeleted) return user;

    const shortId = user.id.replace(/-/g, "").slice(0, 8);
    const anonymizedEmail = `deleted_${shortId}_${Date.now()}@deleted.local`;
    const anonymizedPhone = `deleted_${shortId}`;
    const isSeller = Boolean((user.role && user.role.toUpperCase() === "SELLER") || user.sellerProfile);
    const anonymizedName = isSeller ? "Deleted Seller" : "Deleted User";
    const unreachablePasswordHash = await bcrypt.hash(crypto.randomUUID() + "-deleted-" + Date.now(), 10);

    try {
        if (user.email) {
            if (isSeller) {
                sendKitchenPermanentlyDeletedEmail({
                    sellerName: user.name || undefined,
                    sellerEmail: user.email,
                    businessName: user.sellerProfile?.businessName || "Your Kitchen",
                }).catch((err) => console.error("[EmailService] Failed to send kitchen permanent delete email:", err));
            } else {
                sendUserAccountPermanentlyDeletedEmail({
                    userName: user.name || "Customer",
                    userEmail: user.email,
                }).catch((err) => console.error("[EmailService] Failed to send user permanent delete email:", err));
            }
        }
    } catch (e) {
        console.error("[EmailService] Error dispatching permanent delete notification:", e);
    }

    return await db.$transaction(async (tx) => {
        // 1. Anonymize user details
        const updatedUser = await tx.user.update({
            where: { id: userId },
            data: {
                name: anonymizedName,
                email: anonymizedEmail,
                phone: anonymizedPhone,
                passwordHash: unreachablePasswordHash,
                city: "",
                pincode: "",
                isActive: false,
                isPermanentlyDeleted: true,
                deletedAt: user.deletedAt || new Date()
            }
        });

        // 2. Anonymize saved addresses
        if (user.addresses && user.addresses.length > 0) {
            await tx.address.updateMany({
                where: { userId },
                data: {
                    houseNumber: "N/A",
                    street: "Deleted Address",
                    landmark: null,
                    pincode: "000000"
                }
            });
        }

        // 3. If seller profile exists, anonymize seller details
        if (user.sellerProfile) {
            await tx.sellerProfile.update({
                where: { userId },
                data: {
                    businessName: "Deleted Kitchen",
                    addressFlat: "",
                    addressLocality: "",
                    addressLandmark: null,
                    upiId: null,
                    isOnline: false,
                    kitchenImages: "[]",
                    cuisineImages: "[]",
                    bannerImageUrl: null,
                    roomImages: "[]",
                    adhaarUrl: "deleted",
                    fssaiUrl: null,
                    lightBillUrl: null,
                    passbookUrl: null,
                    deletedAt: user.sellerProfile.deletedAt || new Date()
                }
            });
        }

        console.log(`[Account Deletion] User ${userId} successfully anonymized and marked permanently deleted.`);
        return updatedUser;
    });
}

/**
 * Finds all accounts pending deletion whose grace period has expired, and anonymizes them.
 */
export async function processExpiredAccountDeletions() {
    const expiredCandidates = await db.user.findMany({
        where: {
            deletedAt: { not: null },
            isPermanentlyDeleted: false
        },
        select: {
            id: true,
            email: true,
            role: true,
            deletedAt: true
        }
    });

    const processed: string[] = [];

    for (const candidate of expiredCandidates) {
        if (isGracePeriodExpired(candidate.deletedAt)) {
            try {
                await anonymizeUserAccount(candidate.id);
                processed.push(candidate.id);
            } catch (err) {
                console.error(`[Account Deletion Cron] Failed to anonymize user ${candidate.id}:`, err);
            }
        }
    }

    return {
        scanned: expiredCandidates.length,
        processedCount: processed.length,
        processedUserIds: processed,
        timestamp: new Date().toISOString()
    };
}
