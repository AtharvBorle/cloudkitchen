import { NextRequest } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { successResponse, errorResponse } from "@/lib/api-response";
import {
    softDeleteAccount,
    getGracePeriodConfig,
    getScheduledPermanentDeletionDate,
    isGracePeriodExpired
} from "@/lib/account-deletion";

export async function GET() {
    try {
        const session = await getAuthSession();
        if (!session?.user) {
            return errorResponse("Please log in to check seller account deletion status.", 401);
        }

        const user = await db.user.findUnique({
            where: { id: session.user.id },
            include: { sellerProfile: true }
        });

        if (!user || !user.sellerProfile) {
            return errorResponse("Seller account not found.", 404);
        }

        const config = getGracePeriodConfig();
        const isSoftDeleted = !!user.deletedAt && !user.isPermanentlyDeleted;
        const scheduledDate = user.deletedAt ? getScheduledPermanentDeletionDate(user.deletedAt) : null;
        const isExpired = user.deletedAt ? isGracePeriodExpired(user.deletedAt) : false;

        return successResponse({
            isSoftDeleted,
            isPermanentlyDeleted: user.isPermanentlyDeleted,
            deletedAt: user.deletedAt,
            sellerDeletedAt: user.sellerProfile.deletedAt,
            isOnline: user.sellerProfile.isOnline,
            scheduledPermanentDeletionDate: scheduledDate,
            isExpired,
            gracePeriodConfig: config
        }, "Seller account deletion status retrieved successfully.");
    } catch (error: any) {
        return errorResponse(error.message || "Failed to retrieve seller account deletion status.", 500);
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getAuthSession();
        if (!session?.user) {
            return errorResponse("Please log in first to delete your seller account.", 401);
        }

        const user = await db.user.findUnique({
            where: { id: session.user.id },
            include: { sellerProfile: true }
        });

        if (!user || !user.sellerProfile) {
            return errorResponse("Seller account not found.", 404);
        }

        if (user.isPermanentlyDeleted) {
            return errorResponse("This seller account has already been permanently deleted.", 400);
        }

        // Confirmation verification: requires user to type "DELETE" to confirm kitchen deletion
        let confirmation = "";
        let password = "";
        try {
            const body = await req.json();
            confirmation = typeof body?.confirmation === "string" 
                ? body.confirmation.trim() 
                : typeof body?.confirmText === "string" 
                    ? body.confirmText.trim() 
                    : "";
            password = typeof body?.password === "string" ? body.password.trim() : "";
        } catch {
            confirmation = "";
            password = "";
        }

        const isDeleteConfirmed = confirmation.toUpperCase() === "DELETE";

        if (!isDeleteConfirmed && !password) {
            return errorResponse('Please type "DELETE" in the confirmation field to confirm kitchen deletion.', 400);
        }

        if (!isDeleteConfirmed && password) {
            if (user.passwordHash) {
                const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
                if (!isPasswordValid) {
                    return errorResponse('Incorrect password. Or type "DELETE" to confirm deletion.', 400);
                }
            }
        }

        const result = await softDeleteAccount(user.id);

        return successResponse(
            result,
            `Seller account deletion requested. Your kitchen has been taken offline and your account is scheduled for permanent deletion on ${result.scheduledDeletionDate.toLocaleDateString()}. You can cancel deletion simply by logging back in before then.`
        );
    } catch (error: any) {
        return errorResponse(error.message || "Failed to schedule seller account deletion.", 500);
    }
}

export async function DELETE(req: NextRequest) {
    return POST(req);
}
