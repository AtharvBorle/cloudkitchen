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

        // Optional password confirmation
        try {
            const body = await req.json();
            if (body && body.password) {
                const isPasswordValid = await bcrypt.compare(body.password, user.passwordHash);
                if (!isPasswordValid) {
                    return errorResponse("Incorrect password. Please verify your password to confirm deletion.", 400);
                }
            }
        } catch {
            // Confirmation via UI prompt is acceptable
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
