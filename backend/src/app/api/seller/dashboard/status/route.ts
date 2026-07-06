import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";
import { getCategoryExpiries } from "@/lib/subscription";

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

        const activeSubs = await db.subscription.findMany({
            where: {
                sellerId: sellerProfile.id,
                status: "ACTIVE",
                validUntil: {
                    gt: new Date()
                }
            },
            include: {
                plan: true
            },
            orderBy: {
                validUntil: "asc"
            }
        });

        const { foodExpiry, propertyExpiry } = getCategoryExpiries(activeSubs);
        const isFoodActive = (foodExpiry ? foodExpiry > new Date() : false) && sellerProfile.foodVerificationStatus === "APPROVED";
        const isPropertyActive = (propertyExpiry ? propertyExpiry > new Date() : false) && sellerProfile.propertyVerificationStatus === "APPROVED";

        return successResponse({
            sellerProfile,
            hasActiveSub: activeSubs.length > 0,
            activeSubs,
            isFoodActive,
            isPropertyActive
        });
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Dashboard status fetch error:", error);
        return errorResponse("Internal server error", 500);
    }
}
