import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";
import { getCategoryExpiries } from "@/lib/subscription";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getAuthSession();
        if (!session || !session.user || session.user.role !== "SELLER") {
            throw new ApiError("Unauthorized", 401);
        }

        let sellerProfile = await db.sellerProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!sellerProfile) {
            throw new ApiError("Seller profile not found", 404);
        }

        // Auto-heal / sync category verification statuses if seller application is APPROVED
        if (sellerProfile.verificationStatus === "APPROVED") {
            const needsFoodSync =
                (sellerProfile.businessCategory === "FOOD" || sellerProfile.businessCategory === "BOTH") &&
                sellerProfile.foodVerificationStatus !== "APPROVED";
            const needsPropertySync =
                (sellerProfile.businessCategory === "PROPERTY" || sellerProfile.businessCategory === "BOTH") &&
                sellerProfile.propertyVerificationStatus !== "APPROVED";

            if (needsFoodSync || needsPropertySync) {
                const updateData: any = {};
                if (needsFoodSync) updateData.foodVerificationStatus = "APPROVED";
                if (needsPropertySync) updateData.propertyVerificationStatus = "APPROVED";

                sellerProfile = await db.sellerProfile.update({
                    where: { id: sellerProfile.id },
                    data: updateData
                });
            }
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
                createdAt: "asc"
            }
        });

        const isFoodCategoryApproved =
            sellerProfile.verificationStatus === "APPROVED" &&
            (sellerProfile.businessCategory === "FOOD" ||
                sellerProfile.businessCategory === "BOTH" ||
                sellerProfile.foodVerificationStatus === "APPROVED");

        const isPropertyCategoryApproved =
            sellerProfile.verificationStatus === "APPROVED" &&
            (sellerProfile.businessCategory === "PROPERTY" ||
                sellerProfile.businessCategory === "BOTH" ||
                sellerProfile.propertyVerificationStatus === "APPROVED");

        const { foodExpiry, propertyExpiry } = getCategoryExpiries(activeSubs);
        const isFoodActive = (foodExpiry ? foodExpiry > new Date() : false) && isFoodCategoryApproved;
        const isPropertyActive = (propertyExpiry ? propertyExpiry > new Date() : false) && isPropertyCategoryApproved;

        return successResponse({
            sellerProfile,
            hasActiveSub: activeSubs.length > 0,
            activeSubs,
            foodExpiry,
            propertyExpiry,
            isFoodActive,
            isPropertyActive
        });
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Dashboard status fetch error:", error);
        return errorResponse("Internal server error", 500);
    }
}
