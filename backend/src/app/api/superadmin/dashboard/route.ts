import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getAuthSession();
        if (!session?.user) {
            throw new ApiError("Please log in first to view the superadmin dashboard.", 401);
        }
        if (session.user.role !== "SUPERADMIN") {
            throw new ApiError("Access denied. Superadmin privileges required.", 403);
        }

        const now = new Date();

        const totalAgents = await db.user.count({ 
            where: { 
                role: { in: ["AGENT", "SUPPORT", "REEL_MANAGER"] },
                deletedAt: null,
                isPermanentlyDeleted: false
            } 
        });

        const totalSellers = await db.sellerProfile.count({
            where: {
                deletedAt: null,
                user: {
                    deletedAt: null,
                    isPermanentlyDeleted: false
                }
            }
        });

        const activeSellers = await db.sellerProfile.count({
            where: {
                verificationStatus: "APPROVED",
                deletedAt: null,
                user: {
                    isActive: true,
                    deletedAt: null,
                    isPermanentlyDeleted: false
                }
            }
        });

        const onlineSellers = await db.sellerProfile.count({
            where: {
                verificationStatus: "APPROVED",
                isOnline: true,
                deletedAt: null,
                user: {
                    isActive: true,
                    deletedAt: null,
                    isPermanentlyDeleted: false
                }
            }
        });

        const pendingSellers = await db.sellerProfile.count({
            where: {
                verificationStatus: "PENDING",
                deletedAt: null,
                user: {
                    deletedAt: null,
                    isPermanentlyDeleted: false
                }
            }
        });

        const totalSubscriptions = await db.subscription.count({
            where: {
                status: "ACTIVE",
                validUntil: { gte: now }
            }
        });

        return successResponse({
            totalAgents,
            totalSellers,
            activeSellers,
            onlineSellers,
            pendingSellers,
            totalSubscriptions
        });
    } catch (error: any) {
        const statusCode = error?.statusCode || (error instanceof ApiError ? error.statusCode : 500);
        console.error("Superadmin overview stats error:", error);
        return errorResponse(error?.message || "Internal server error", statusCode);
    }
}
