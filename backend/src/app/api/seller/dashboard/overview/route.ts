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

        const menuItemsCount = await db.foodItem.count({ where: { sellerId: sellerProfile.id } });
        const roomsCount = await db.room.count({ where: { sellerId: sellerProfile.id } });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayOrdersCount = await db.order.count({
            where: {
                sellerId: sellerProfile.id,
                createdAt: { gte: today }
            }
        });

        const allOrders = await db.order.findMany({
            where: {
                sellerId: sellerProfile.id,
                isPaid: true
            }
        });
        const totalRevenue = allOrders.reduce((sum, order) => sum + order.totalAmount, 0);

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
            }
        });

        const { foodExpiry, propertyExpiry } = getCategoryExpiries(activeSubs);
        const isFoodActive = (foodExpiry ? foodExpiry > new Date() : false) && sellerProfile.foodVerificationStatus === "APPROVED";
        const isPropertyActive = (propertyExpiry ? propertyExpiry > new Date() : false) && sellerProfile.propertyVerificationStatus === "APPROVED";

        const newestActiveSub = activeSubs.sort((a, b) => b.validUntil.getTime() - a.validUntil.getTime())[0];

        return successResponse({
            sellerProfile,
            todayOrdersCount,
            totalRevenue,
            menuItemsCount,
            roomsCount,
            validUntilDate: newestActiveSub?.validUntil || null,
            isFoodActive,
            isPropertyActive
        });
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Dashboard overview stats error:", error);
        return errorResponse("Internal server error", 500);
    }
}
