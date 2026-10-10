import { createOrder } from "@/controllers/userOrderController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { autoCancelExpiredOrders } from "@/lib/order-expiry";
import { enrichOrdersWithEta } from "@/lib/order-eta";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
    try {
        const session = await getAuthSession();
        if (!session?.user) {
            throw new ApiError("Please log in first to view your orders.", 401);
        }
        if (session.user.role !== "USER") {
            throw new ApiError("Access denied. User account required.", 403);
        }

        // Auto-cancel any pending orders that exceeded the 5-minute acceptance timer
        await autoCancelExpiredOrders({ userId: session.user.id });

        const orders = await db.order.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
            include: {
                seller: true,
                deliveryPerson: true,
                refund: true,
                review: {
                    include: {
                        itemRatings: true
                    }
                }
            }
        });

        const couponIds = Array.from(new Set(orders.map(o => o.appliedCouponId).filter(Boolean))) as string[];
        const couponsMap: Record<string, any> = {};
        if (couponIds.length > 0) {
            const coupons = await db.coupon.findMany({
                where: { id: { in: couponIds } },
                select: {
                    id: true,
                    code: true,
                    discountPercentage: true,
                    discountAmount: true,
                    discountType: true
                }
            });
            coupons.forEach(c => {
                couponsMap[c.id] = c;
            });
        }

        const enrichedOrders = await enrichOrdersWithEta(
            orders.map(o => ({
                ...o,
                appliedCoupon: o.appliedCouponId ? couponsMap[o.appliedCouponId] || null : null
            }))
        );

        return successResponse(enrichedOrders);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Fetch user orders error:", error);
        return errorResponse("Internal server error", 500);
    }
}

export async function POST(req: Request) {
    try {
        const data = await createOrder(req);
        return successResponse(data, "Order placed successfully", 201);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Checkout internal error:", error);
        return errorResponse("An error occurred during checkout", 500);
    }
}
