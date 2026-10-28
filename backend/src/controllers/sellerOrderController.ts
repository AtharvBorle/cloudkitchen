import { restoreOrderAddonsStock } from "@/lib/addon-inventory";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { handleCodOrderDelivered } from "@/lib/delivery-wallet";
import { emitOrderUpdated, emitSellerDashboardRefresh } from "@/lib/realtime-events";
import { autoCancelExpiredOrders, cancelExpiredOrder, isOrderExpired, revertCouponUsageFloorZero } from "@/lib/order-expiry";
import { enrichOrderWithEta, getOrInitOrderTimer } from "@/lib/order-eta";
import { revalidateTag } from "next/cache";
import { sendOrderStatusNotification } from "@/lib/emailService";

export const getSellerOrders = async () => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to view kitchen orders.", 401);
    }
    if (session.user.role !== "SELLER") {
        throw new ApiError("Access denied. Seller account required to view kitchen orders.", 403);
    }

    const sellerProfile = await db.sellerProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!sellerProfile) {
        throw new ApiError("Seller profile not found. Please complete seller registration.", 404);
    }

    // Auto-cancel any pending orders that exceeded the 5-minute acceptance timer
    await autoCancelExpiredOrders({ sellerId: sellerProfile.id });

    const orders = await db.order.findMany({
        where: { sellerId: sellerProfile.id },
        include: {
            seller: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    city: true,
                    pincode: true
                }
            },
            deliveryPerson: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    vehicleType: true,
                    vehicleNumber: true,
                    isActive: true,
                    outstandingBalance: true
                }
            },
            refund: true
        },
        orderBy: { createdAt: 'desc' }
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

    const enrichedOrders = orders.map(o => ({
        ...o,
        appliedCoupon: o.appliedCouponId ? couponsMap[o.appliedCouponId] : null
    }));

    return { orders: enrichedOrders };
};

export const getSellerOrderById = async (orderId: string) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to view order details.", 401);
    }
    if (session.user.role !== "SELLER") {
        throw new ApiError("Access denied. Seller account required.", 403);
    }

    const sellerProfile = await db.sellerProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!sellerProfile) {
        throw new ApiError("Seller profile not found. Please complete seller registration.", 404);
    }

    const cleanId = orderId.replace("#NCR-", "").replace("#ncr-", "").replace("#", "").trim();

    const order = await db.order.findFirst({
        where: {
            sellerId: sellerProfile.id,
            OR: [
                { id: orderId },
                { id: cleanId },
                { id: { startsWith: cleanId } },
                { id: { mode: 'insensitive', equals: cleanId } }
            ]
        },
        include: {
            seller: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    city: true,
                    pincode: true
                }
            },
            deliveryPerson: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    vehicleType: true,
                    vehicleNumber: true,
                    isActive: true
                }
            },
            refund: true
        }
    });

    if (!order) {
        throw new ApiError("Order not found", 404);
    }

    // Auto-cancel if pending and 5-minute acceptance window has elapsed
    if (order.status === "PENDING" && isOrderExpired(order.createdAt)) {
        await cancelExpiredOrder(order);
        order.status = "CANCELLED";
    }

    let appliedCoupon = null;
    if (order.appliedCouponId) {
        appliedCoupon = await db.coupon.findUnique({
            where: { id: order.appliedCouponId },
            select: {
                code: true,
                discountPercentage: true,
                discountAmount: true
            }
        });
    }

    return { order: { ...order, appliedCoupon } };
};

export const updateSellerOrder = async (req: Request, orderId: string) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to update order status.", 401);
    }
    if (session.user.role !== "SELLER") {
        throw new ApiError("Access denied. Seller account required.", 403);
    }

    const sellerProfile = await db.sellerProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!sellerProfile) {
        throw new ApiError("Seller profile not found. Please complete seller registration.", 404);
    }

    const { status, isPaid, deliveryPersonId } = await req.json();
    const cleanId = orderId.replace("#NCR-", "").replace("#ncr-", "").replace("#", "").trim();

    const existingOrder = await db.order.findFirst({
        where: {
            sellerId: sellerProfile.id,
            OR: [
                { id: orderId },
                { id: cleanId },
                { id: { startsWith: cleanId } },
                { id: { mode: 'insensitive', equals: cleanId } }
            ]
        }
    });

    if (!existingOrder) {
        throw new ApiError("Order not found", 404);
    }

    // Validate status value if provided
    const validStatuses = ["PENDING", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];
    if (status && !validStatuses.includes(status)) {
        throw new ApiError(`Invalid status '${status}'. Must be one of: ${validStatuses.join(", ")}`, 400);
    }

    // Check 5-minute acceptance window: if seller attempts to accept an expired pending order, auto-cancel and reject
    if (existingOrder.status === "PENDING" && status && status !== "CANCELLED") {
        if (isOrderExpired(existingOrder.createdAt)) {
            await cancelExpiredOrder(existingOrder);
            throw new ApiError("Order acceptance window has expired (5-minute limit exceeded). This order has been automatically cancelled.", 400);
        }
    }

    const targetOrderId = existingOrder.id;

    const updatedOrder = await db.$transaction(async (tx) => {
        let newlyCancelled = false;

        if (status === "CANCELLED") {
            const claim = await tx.order.updateMany({
                where: {
                    id: targetOrderId,
                    status: { notIn: ["CANCELLED", "DELIVERED"] }
                },
                data: {
                    status: "CANCELLED",
                    isPaid: typeof isPaid === "boolean" ? isPaid : existingOrder.isPaid,
                    deliveryPersonId: deliveryPersonId !== undefined ? deliveryPersonId : existingOrder.deliveryPersonId,
                    cancelledBy: "SELLER",
                    cancellationReason: "Rejected / cancelled by kitchen partner"
                }
            });
            newlyCancelled = claim.count > 0;
        } else {
            await tx.order.update({
                where: { id: targetOrderId },
                data: {
                    status: status || existingOrder.status,
                    isPaid: typeof isPaid === "boolean" ? isPaid : existingOrder.isPaid,
                    deliveryPersonId: deliveryPersonId !== undefined ? deliveryPersonId : existingOrder.deliveryPersonId
                }
            });
        }

        if (newlyCancelled) {
            // Restore inventory only on the single winning transition to CANCELLED
            if (existingOrder.items) {
                try {
                    const itemsList = typeof existingOrder.items === "string" ? JSON.parse(existingOrder.items) : existingOrder.items;
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
                } catch (error) {
                    console.error("Failed to restore inventory on seller cancelOrder:", error);
                }
                try {
                    await restoreOrderAddonsStock(tx, existingOrder.id, existingOrder.items, "Cancelled by kitchen");
                } catch (addonErr) {
                    console.error("Failed to restore addon inventory on seller cancelOrder:", addonErr);
                }
            }

            // Revert coupon usage by 1 (floored at 0)
            if (existingOrder.appliedCouponId) {
                try {
                    await revertCouponUsageFloorZero(tx, existingOrder.appliedCouponId);
                } catch (couponErr) {
                    console.error("Failed to revert coupon usage on seller cancelOrder:", couponErr);
                }
            }

            if (existingOrder.isPaid || existingOrder.totalAmount === 0) {
                const existingRefund = await tx.refund.findUnique({ where: { orderId: targetOrderId } });
                if (!existingRefund) {
                    const refundAmount = Number(existingOrder.totalAmount ?? 0);
                    let reason = `Order #${targetOrderId} was rejected / cancelled by the kitchen partner.`;
                    if (refundAmount === 0) {
                        reason += ` 100% discount coupon applied (₹0 paid by customer). No refund required.`;
                    } else {
                        reason += ` Auto-submitted for refund processing.`;
                    }
                    await tx.refund.create({
                        data: {
                            userId: existingOrder.userId,
                            orderId: targetOrderId,
                            amount: refundAmount,
                            reason,
                            status: refundAmount === 0 ? "PROCESSED" : "PENDING"
                        }
                    });
                }
            }
        }

        if (status === "DELIVERED" && existingOrder.status !== "DELIVERED") {
            await handleCodOrderDelivered(tx, targetOrderId);
        }

        const uo = await tx.order.findUnique({
            where: { id: targetOrderId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                deliveryPerson: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        vehicleType: true,
                        vehicleNumber: true
                    }
                }
            }
        });

        return uo!;
    });

    if (status === "PREPARING" || status === "OUT_FOR_DELIVERY") {
        await getOrInitOrderTimer(updatedOrder, true);
    }

    const enrichedUpdatedOrder = await enrichOrderWithEta(updatedOrder);

    try {
        emitOrderUpdated(enrichedUpdatedOrder);
        emitSellerDashboardRefresh(sellerProfile.id);
    } catch (e) {
        console.error("Realtime event emission error in seller update:", e);
    }

    // Send order status update email asynchronously (failsafe)
    if (status && status !== existingOrder.status) {
        sendOrderStatusNotification(
            enrichedUpdatedOrder,
            status,
            enrichedUpdatedOrder.user
        ).catch((err) => {
            console.error("[EmailService] Failed to send status notification:", err);
        });
    }

    try {
        revalidateTag("explore", {});
        revalidateTag("public-explore-data", {});
    } catch (e) {}

    return { order: enrichedUpdatedOrder };
};
