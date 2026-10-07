import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";
import { getCategoryExpiries } from "@/lib/subscription";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        const session = await getAuthSession();
        if (!session?.user) {
            throw new ApiError("Please log in first to view dashboard overview.", 401);
        }
        if (session.user.role !== "SELLER") {
            throw new ApiError("Access denied. Seller account required.", 403);
        }

        const sellerProfile = await db.sellerProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!sellerProfile) {
            throw new ApiError("Seller profile could not be found. Please complete your registration.", 404);
        }

        // Support date query param: ?date=YYYY-MM-DD or ?from=ISO&to=ISO
        const { searchParams } = new URL(req.url);
        const dateQuery = searchParams.get("date");
        const fromQuery = searchParams.get("from");
        const toQuery = searchParams.get("to");

        let startDate: Date;
        let endDate: Date;
        let isToday = false;

        if (fromQuery && toQuery) {
            startDate = new Date(fromQuery);
            endDate = new Date(toQuery);
            const now = new Date();
            isToday = (
                startDate.getFullYear() === now.getFullYear() &&
                startDate.getMonth() === now.getMonth() &&
                startDate.getDate() === now.getDate()
            );
        } else if (dateQuery && /^\d{4}-\d{2}-\d{2}$/.test(dateQuery)) {
            const [y, m, d] = dateQuery.split("-").map(Number);
            startDate = new Date(y, m - 1, d, 0, 0, 0, 0);
            endDate = new Date(y, m - 1, d, 23, 59, 59, 999);
            const now = new Date();
            isToday = (
                now.getFullYear() === y &&
                now.getMonth() === m - 1 &&
                now.getDate() === d
            );
        } else {
            const now = new Date();
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            isToday = true;
        }

        const menuItemsCount = await db.foodItem.count({ where: { sellerId: sellerProfile.id } });
        const roomsCount = await db.room.count({ where: { sellerId: sellerProfile.id } });

        // Day's orders (created between startDate and endDate)
        const dayOrders = await db.order.findMany({
            where: {
                sellerId: sellerProfile.id,
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });

        const nonCancelledOrders = dayOrders.filter((o) => o.status !== "CANCELLED");
        const todayOrdersCount = nonCancelledOrders.length;

        // 1. Online paid/delivered revenue for the day (non-COD)
        const onlinePaidOrders = nonCancelledOrders.filter(
            (o) => o.paymentMethod !== "COD" && (o.isPaid || o.status === "DELIVERED")
        );
        const onlineRevenue = onlinePaidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

        // 2. Riders of this seller & active COD wallet balances
        const riders = await db.deliveryPerson.findMany({
            where: { sellerId: sellerProfile.id },
            select: { id: true, outstandingBalance: true }
        });
        const riderIds = riders.map((r) => r.id);
        const riderTotalCodOutstanding = riders.reduce((sum, r) => sum + (r.outstandingBalance || 0), 0);

        // 3. Settlements recorded by seller from delivery riders on this day
        const daySettlements = await db.deliveryTransaction.findMany({
            where: {
                deliveryPersonId: { in: riderIds },
                type: "SETTLEMENT",
                status: "COMPLETED",
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });
        const todaySettledCod = daySettlements.reduce((sum, tx) => sum + (tx.amount || 0), 0);

        // 4. Day's COD orders placed and delivered
        const codOrders = nonCancelledOrders.filter((o) => o.paymentMethod === "COD");
        const todayCodAmount = codOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        const todayCodDelivered = codOrders
            .filter((o) => o.status === "DELIVERED" || o.isPaid)
            .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

        // Realized COD revenue:
        // When seller records settlement, rider wallet decrements and cash is collected by seller -> enters revenue today!
        const realizedCod = todaySettledCod > 0
            ? todaySettledCod
            : Math.max(0, todayCodDelivered - riderTotalCodOutstanding);

        const todayRevenue = onlineRevenue + realizedCod;

        // All time revenue for reference
        const allPaidOrders = await db.order.findMany({
            where: {
                sellerId: sellerProfile.id,
                status: { not: "CANCELLED" },
                OR: [{ isPaid: true }, { status: "DELIVERED" }]
            },
            select: { totalAmount: true }
        });
        const allTimeRevenue = allPaidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

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

        const newestActiveSub = activeSubs.sort((a, b) => b.validUntil.getTime() - a.validUntil.getTime())[0];

        // For today: COD Outstanding is rider wallet balance. When settled, rider wallet balance is 0.
        const codOutstandingVal = isToday
            ? riderTotalCodOutstanding
            : Math.max(0, todayCodAmount - todaySettledCod);

        return successResponse({
            sellerProfile,
            todayOrdersCount,
            todayRevenue,
            totalRevenue: todayRevenue,
            allTimeRevenue,
            todayCodAmount,
            todayCodDelivered,
            todaySettledCod,
            riderTotalCodOutstanding,
            codOutstanding: codOutstandingVal,
            selectedDate: startDate.toISOString().split("T")[0],
            isToday,
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
