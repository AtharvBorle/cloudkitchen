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
            return errorResponse("Please log in to check account deletion status.", 401);
        }

        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                email: true,
                name: true,
                deletedAt: true,
                isPermanentlyDeleted: true
            }
        });

        if (!user) {
            return errorResponse("User account not found.", 404);
        }

        const config = getGracePeriodConfig();
        const isSoftDeleted = !!user.deletedAt && !user.isPermanentlyDeleted;
        const scheduledDate = user.deletedAt ? getScheduledPermanentDeletionDate(user.deletedAt) : null;
        const isExpired = user.deletedAt ? isGracePeriodExpired(user.deletedAt) : false;

        return successResponse({
            isSoftDeleted,
            isPermanentlyDeleted: user.isPermanentlyDeleted,
            deletedAt: user.deletedAt,
            scheduledPermanentDeletionDate: scheduledDate,
            isExpired,
            gracePeriodConfig: config
        }, "Account deletion status retrieved successfully.");
    } catch (error: any) {
        return errorResponse(error.message || "Failed to retrieve account deletion status.", 500);
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getAuthSession();
        if (!session?.user) {
            return errorResponse("Please log in first to delete your account.", 401);
        }

        const user = await db.user.findUnique({
            where: { id: session.user.id }
        });

        if (!user) {
            return errorResponse("User account not found.", 404);
        }

        if (user.isPermanentlyDeleted) {
            return errorResponse("This account has already been permanently deleted.", 400);
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
            // Empty or non-JSON body is acceptable if confirmation is done via UI prompt
        }

        const result = await softDeleteAccount(user.id);

        return successResponse(
            result,
            `Account deletion requested. Your account is scheduled for permanent deletion on ${result.scheduledDeletionDate.toLocaleDateString()}. You can cancel deletion simply by logging back in before then.`
        );
    } catch (error: any) {
        return errorResponse(error.message || "Failed to schedule account deletion.", 500);
    }
}

export async function DELETE(req: NextRequest) {
    return POST(req);
}
