import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET() {
    try {
        const session = await getAuthSession();
        if (!session?.user) {
            throw new ApiError("Please log in first to view the admin dashboard.", 401);
        }
        if (session.user.role !== "AGENT" && session.user.role !== "SUPERADMIN") {
            throw new ApiError("Access denied. Admin privileges required.", 403);
        }

        const pendingProfiles = await db.sellerProfile.findMany({
            where: { verificationStatus: { in: ["PENDING", "REVISION"] } },
            include: { user: true },
            orderBy: {
                user: { createdAt: "asc" }
            }
        });

        const verifications = pendingProfiles.map(profile => ({
            id: profile.id,
            businessName: profile.businessName || profile.user.name,
            type: profile.type,
            createdAt: profile.user.createdAt.toISOString(),
            status: profile.verificationStatus
        }));

        const totalPending = await db.sellerProfile.count({
            where: { verificationStatus: "PENDING" }
        });

        const totalApproved = await db.sellerProfile.count({
            where: { verificationStatus: "APPROVED" }
        });

        const totalRejected = await db.sellerProfile.count({
            where: { verificationStatus: "REJECTED" }
        });

        const stats = {
            pending: totalPending,
            approved: totalApproved,
            rejected: totalRejected
        };

        return successResponse({
            verifications,
            stats
        });
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Admin dashboard stats fetch error:", error);
        return errorResponse("Internal server error", 500);
    }
}
