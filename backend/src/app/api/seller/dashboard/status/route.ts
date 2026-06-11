import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET() {
    try {
        const session = await getAuthSession();
        if (!session || !session.user || session.user.role !== "SELLER") {
            throw new ApiError("Unauthorized", 401);
        }

        const sellerProfile = await db.sellerProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!sellerProfile) {
            throw new ApiError("Seller profile not found", 404);
        }

        const activeSub = await db.subscription.findFirst({
            where: {
                sellerId: sellerProfile.id,
                status: "ACTIVE",
                validUntil: {
                    gt: new Date()
                }
            }
        });

        return successResponse({
            sellerProfile,
            hasActiveSub: !!activeSub,
            validUntil: activeSub?.validUntil || null
        });
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Dashboard status fetch error:", error);
        return errorResponse("Internal server error", 500);
    }
}
