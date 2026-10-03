import { db } from "@/lib/db";
import { emitOrderCancelled, emitOrderUpdated, emitSellerDashboardRefresh } from "@/lib/realtime-events";
import { revalidateTag } from "next/cache";

/**
 * 5-minute order acceptance window in milliseconds.
 * Consistent across all orders and preserved on page refresh.
 */
export const ORDER_ACCEPT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes (300,000 ms)

/**
 * Checks if a pending order has passed the 5-minute acceptance window.
 */
export const isOrderExpired = (createdAt: Date | string): boolean => {
    const createdTime = new Date(createdAt).getTime();
    if (isNaN(createdTime)) return false;
    return Date.now() - createdTime >= ORDER_ACCEPT_WINDOW_MS;
};

/**
 * Calculates remaining milliseconds before the 5-minute acceptance window expires.
 */
export const getOrderRemainingMs = (createdAt: Date | string): number => {
    const createdTime = new Date(createdAt).getTime();
    if (isNaN(createdTime)) return 0;
    return Math.max(0, createdTime + ORDER_ACCEPT_WINDOW_MS - Date.now());
};

/**
 * Automatically cancels an expired order:
 * 1. Updates order status to CANCELLED.
 * 2. Restores inventory stock for food items.
 * 3. Reverts coupon usage count if a coupon was used.
 * 4. Generates a refund record if the order was paid or ₹0 coupon.
 * 5. Emits real-time SSE events so dashboards update instantly.
 */
export const cancelExpiredOrder = async (order: any): Promise<any> => {
    if (!order || order.status === "CANCELLED" || order.status === "DELIVERED") {
        return order;
    }

    try {
        const cancelledOrder = await db.$transaction(async (tx) => {
            // 1. Update status
            const updated = await tx.order.update({
                where: { id: order.id },
                data: { status: "CANCELLED" }
            });

            // 2. Restore stock for food items
            if (order.items) {
                try {
                    const itemsList = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
                    if (Array.isArray(itemsList)) {
                        for (const item of itemsList) {
                            const itemId = item.foodItemId || item.id;
                            const qty = Number(item.quantity) || 1;
                            if (itemId) {
                                const foodItem = await tx.foodItem.findUnique({ where: { id: itemId } });
                                if (foodItem && foodItem.stockQuantity !== -1) {
                                    await tx.foodItem.update({
                                        where: { id: itemId },
                                        data: {
                                            stockQuantity: foodItem.stockQuantity + qty,
                                            isAvailable: true
                                        }
                                    });
                                }
                            }
                        }
                    }
                } catch (stockErr) {
                    console.error(`[OrderExpiry] Stock restoration failed for order #${order.id}:`, stockErr);
                }
            }

            // 3. Decrement coupon usage if applied
            if (order.appliedCouponId) {
                try {
                    await tx.coupon.update({
                        where: { id: order.appliedCouponId },
                        data: { currentUsersCount: { decrement: 1 } }
                    });
                } catch (couponErr) {
                    console.error(`[OrderExpiry] Coupon usage revert failed for order #${order.id}:`, couponErr);
                }
            }

            // 4. Auto-submit refund if paid or ₹0 coupon order
            if (order.isPaid || order.totalAmount === 0) {
                const existingRefund = await tx.refund.findUnique({ where: { orderId: order.id } });
                if (!existingRefund) {
                    const refundAmount = Number(order.totalAmount ?? 0);
                    let reason = `Order #${order.id} was automatically cancelled: Kitchen partner did not accept within the 5-minute window.`;
                    if (refundAmount === 0) {
                        reason += ` 100% discount coupon applied (₹0 paid by customer). No refund required.`;
                    } else {
                        reason += ` Auto-submitted for refund processing.`;
                    }
                    await tx.refund.create({
                        data: {
                            userId: order.userId,
                            orderId: order.id,
                            amount: refundAmount,
                            reason,
                            status: refundAmount === 0 ? "PROCESSED" : "PENDING"
                        }
                    });
                }
            }

            return updated;
        });

        // 5. Emit real-time updates
        try {
            emitOrderCancelled(cancelledOrder);
            emitOrderUpdated(cancelledOrder);
            if (order.sellerId) {
                emitSellerDashboardRefresh(order.sellerId);
            }
        } catch (eventErr) {
            console.error(`[OrderExpiry] Event emission error for order #${order.id}:`, eventErr);
        }

        try {
            revalidateTag("explore", {});
            revalidateTag("public-explore-data", {});
        } catch {}

        return cancelledOrder;
    } catch (error) {
        console.error(`[OrderExpiry] Failed to auto-cancel order #${order.id}:`, error);
        return order;
    }
};

/**
 * Searches for all PENDING orders older than 5 minutes and auto-cancels them.
 * Can be filtered by sellerId, userId, or orderId.
 */
export const autoCancelExpiredOrders = async (filter?: {
    sellerId?: string;
    userId?: string;
    orderId?: string;
}): Promise<number> => {
    try {
        const cutoffTime = new Date(Date.now() - ORDER_ACCEPT_WINDOW_MS);

        const whereClause: any = {
            status: "PENDING",
            createdAt: { lte: cutoffTime }
        };

        if (filter?.sellerId) whereClause.sellerId = filter.sellerId;
        if (filter?.userId) whereClause.userId = filter.userId;
        if (filter?.orderId) whereClause.id = filter.orderId;

        const expiredOrders = await db.order.findMany({
            where: whereClause
        });

        if (expiredOrders.length === 0) return 0;

        for (const order of expiredOrders) {
            await cancelExpiredOrder(order);
        }

        return expiredOrders.length;
    } catch (err) {
        console.error("[OrderExpiry] Error in autoCancelExpiredOrders:", err);
        return 0;
    }
};
