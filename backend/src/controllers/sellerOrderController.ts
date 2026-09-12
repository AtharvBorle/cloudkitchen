import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { handleCodOrderDelivered } from "@/lib/delivery-wallet";

export const getSellerOrders = async () => {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== "SELLER") {
        throw new ApiError("Unauthorized", 401);
    }

    const sellerProfile = await db.sellerProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!sellerProfile) {
        throw new ApiError("Seller profile not found", 404);
    }

    const orders = await db.order.findMany({
        where: { sellerId: sellerProfile.id },
        include: {
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
                    isActive: true,
                    outstandingBalance: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return { orders };
};

export const getSellerOrderById = async (orderId: string) => {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== "SELLER") {
        throw new ApiError("Unauthorized", 401);
    }

    const sellerProfile = await db.sellerProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!sellerProfile) {
        throw new ApiError("Seller profile not found", 404);
    }

    const order = await db.order.findFirst({
        where: {
            id: orderId,
            sellerId: sellerProfile.id
        },
        include: {
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
                    isActive: true
                }
            }
        }
    });

    if (!order) {
        throw new ApiError("Order not found", 404);
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
    if (!session?.user || session.user.role !== "SELLER") {
        throw new ApiError("Unauthorized", 401);
    }

    const sellerProfile = await db.sellerProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!sellerProfile) {
        throw new ApiError("Seller profile not found", 404);
    }

    const { status, isPaid, deliveryPersonId } = await req.json();

    const existingOrder = await db.order.findFirst({
        where: {
            id: orderId,
            sellerId: sellerProfile.id
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

    // Restore inventory if cancelling
    if (status === "CANCELLED" && existingOrder.status !== "CANCELLED" && existingOrder.items) {
        try {
            const itemsList = typeof existingOrder.items === "string" ? JSON.parse(existingOrder.items) : existingOrder.items;
            if (Array.isArray(itemsList)) {
                for (const item of itemsList) {
                    if (item.id && item.quantity) {
                        const foodItem = await db.foodItem.findUnique({ where: { id: item.id } });
                        if (foodItem && foodItem.stockQuantity !== -1) {
                            await db.foodItem.update({
                                where: { id: item.id },
                                data: {
                                    stockQuantity: foodItem.stockQuantity + item.quantity,
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
    }

    const updatedOrder = await db.$transaction(async (tx) => {
        const uo = await tx.order.update({
            where: { id: orderId },
            data: {
                status: status || existingOrder.status,
                isPaid: typeof isPaid === 'boolean' ? isPaid : existingOrder.isPaid,
                deliveryPersonId: deliveryPersonId !== undefined ? deliveryPersonId : existingOrder.deliveryPersonId
            },
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
                        phone: true
                    }
                }
            }
        });

        if (status === "DELIVERED" && existingOrder.status !== "DELIVERED") {
            await handleCodOrderDelivered(tx, orderId);
        }

        if (status === "CANCELLED" && existingOrder.isPaid) {
            const existingRefund = await tx.refund.findUnique({ where: { orderId } });
            if (!existingRefund) {
                await tx.refund.create({
                    data: {
                        userId: existingOrder.userId,
                        orderId,
                        amount: existingOrder.totalAmount,
                        reason: "Order cancelled / rejected by Kitchen Seller.",
                        status: "PENDING"
                    }
                });
            }
        }

        return uo;
    });

    return { order: updatedOrder };
};
