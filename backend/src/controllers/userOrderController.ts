import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import Razorpay from "razorpay";
import crypto from "crypto";
import { emitOrderCreated, emitOrderCancelled, emitOrderUpdated } from "@/lib/realtime-events";

export const initiateOrderPayment = async (req: Request) => {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== "USER") {
        throw new ApiError("Unauthorized", 401);
    }

    const { totalAmount, sellerId } = await req.json();
    if (!totalAmount || Number(totalAmount) <= 0) {
        throw new ApiError("Invalid total amount", 400);
    }

    const key_id = process.env.RAZORPAY_KEY_ID || "";
    const key_secret = process.env.RAZORPAY_KEY_SECRET || "";

    if (!key_id || !key_secret) {
        throw new ApiError("Payment gateway configuration missing", 500);
    }

    const razorpay = new Razorpay({ key_id, key_secret });

    try {
        const rzpOrder = await razorpay.orders.create({
            amount: Math.round(Number(totalAmount) * 100), // in paise
            currency: "INR",
            receipt: `rcpt_${Date.now().toString().slice(-10)}`,
            notes: {
                userId: session.user.id,
                sellerId: sellerId || ""
            }
        });

        return {
            razorpayOrderId: rzpOrder.id,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency,
            keyId: key_id
        };
    } catch (error: any) {
        console.error("Razorpay order creation error:", error);
        throw new ApiError("Failed to initiate online payment: " + (error?.message || ""), 500);
    }
};

export const createOrder = async (req: Request) => {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== "USER") {
        throw new ApiError("Unauthorized", 401);
    }

    const {
        sellerId,
        items,
        totalAmount,
        deliveryAddress,
        customerPhone,
        paymentMethod,
        appliedCouponId,
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature
    } = await req.json();

    if (!sellerId || !items || items.length === 0 || totalAmount === undefined) {
        throw new ApiError("Missing required fields", 400);
    }

    // For online payments: validate Razorpay transaction signature BEFORE creating order in DB
    const isOnlinePayment = paymentMethod === "ONLINE";
    if (isOnlinePayment) {
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            throw new ApiError("Missing online payment verification details", 400);
        }

        const secret = process.env.RAZORPAY_KEY_SECRET || "";
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            throw new ApiError("Payment verification failed: Invalid transaction signature", 400);
        }
    }

    const dbUser = await db.user.findUnique({ where: { id: session.user.id } });
    if (!dbUser) throw new ApiError("User not found", 404);

    let sellerProfile = await db.sellerProfile.findFirst({
        where: {
            OR: [
                { id: sellerId },
                { trackingId: sellerId },
                { userId: sellerId }
            ]
        },
        include: {
            subscriptions: {
                where: { status: "ACTIVE" },
                include: { plan: true }
            }
        }
    });

    if (!sellerProfile) {
        sellerProfile = await db.sellerProfile.findFirst({
            where: { verificationStatus: "APPROVED" },
            include: {
                subscriptions: {
                    where: { status: "ACTIVE" },
                    include: { plan: true }
                }
            }
        }) || await db.sellerProfile.findFirst({
            include: {
                subscriptions: {
                    where: { status: "ACTIVE" },
                    include: { plan: true }
                }
            }
        });
    }

    if (!sellerProfile) throw new ApiError("Seller not found", 404);
    if (sellerProfile.isOnline === false) {
        throw new ApiError("This store is currently offline. Orders cannot be placed.", 400);
    }

    const now = new Date();
    const hasActiveFoodSub = sellerProfile.subscriptions?.some((sub: any) => 
        sub.status === "ACTIVE" && 
        (sub.validUntil === null || new Date(sub.validUntil) > now) &&
        (sub.plan?.category === "FOOD" || sub.plan?.category === "BOTH")
    );

    if (!hasActiveFoodSub && sellerProfile.verificationStatus !== "APPROVED") {
        throw new ApiError("This store is currently not accepting orders (No active subscription).", 400);
    }

    // --- Coupon Validation Logic ---
    if (appliedCouponId) {
        const coupon = await db.coupon.findUnique({ where: { id: appliedCouponId } });
        if (!coupon) throw new ApiError("Invalid coupon selected", 400);
        if (!coupon.isActive) throw new ApiError("This coupon is no longer active", 400);

        // Expiry check
        if (!coupon.noExpiry && coupon.validUntil && new Date(coupon.validUntil) < new Date()) {
            throw new ApiError("This coupon has expired", 400);
        }

        // Seller match check
        if (coupon.appliesToSellerId && coupon.appliesToSellerId !== sellerProfile.id) {
            throw new ApiError("This coupon is not valid for this store", 400);
        }

        // Specific Item check
        if (coupon.appliesToProductId) {
            const hasProduct = items.some((it: any) => it.id === coupon.appliesToProductId || it.foodItemId === coupon.appliesToProductId);
            if (!hasProduct) {
                throw new ApiError("This coupon is only valid on specific items not found in your cart", 400);
            }
        }

        // Customer Eligibility check (NEW_ONLY)
        if (coupon.customerEligibility === "NEW_ONLY") {
            const previousOrdersCount = await db.order.count({
                where: {
                    userId: session.user.id,
                    status: { not: "CANCELLED" }
                }
            });
            if (previousOrdersCount > 0) {
                throw new ApiError("This coupon is exclusively for first-time customers", 400);
            }
        }

        // 1. Minimum Cart Value check
        const minCart = coupon.minimumCartValue || (coupon as any).minOrderAmount;
        if (minCart) {
            let baseTotal = 0;
            for (const item of items) {
                baseTotal += (item.price || 0) * (item.quantity || 1);
            }
            if (baseTotal < minCart) {
                throw new ApiError(`This coupon requires a minimum cart value of ₹${minCart}`, 400);
            }
        }

        // 2. Max Usages Per User check
        const userLimit = coupon.perUserLimit || coupon.maxUsagesPerUser;
        if (userLimit) {
            const usageCount = await db.order.count({
                where: {
                    userId: session.user.id,
                    appliedCouponId: appliedCouponId,
                    status: { not: "CANCELLED" }
                }
            });
            if (usageCount >= userLimit) {
                throw new ApiError(`You've reached the maximum usage limit (${userLimit}) for this coupon.`, 400);
            }
        }

        // 3. Max Users check
        const totalLimit = coupon.usageLimit || coupon.maxUsers;
        if (totalLimit) {
            if (coupon.currentUsersCount >= totalLimit) {
                throw new ApiError(`This coupon has reached its maximum users limit across the platform.`, 400);
            }
        }

        // 4. Category check
        if (coupon.category && coupon.category !== "BOTH" && coupon.category !== sellerProfile.businessCategory) {
            throw new ApiError(`This coupon is only valid for stores in the ${coupon.category} category.`, 400);
        }
    }
    // --- End Coupon Validation Logic ---

    // --- Pincode Validation ---
    const defaultAddress = await db.address.findFirst({
        where: { userId: session.user.id, isDefault: true }
    });
    let userPincode = defaultAddress?.pincode ? defaultAddress.pincode.trim() : (dbUser.pincode ? dbUser.pincode.trim() : null);

    if (!userPincode && deliveryAddress) {
        const pinMatch = deliveryAddress.match(/\b\d{6}\b/);
        if (pinMatch) {
            userPincode = pinMatch[0];
        }
    }

    if (!userPincode) {
        userPincode = "411038";
    }

    const itemUpdates = [];
    for (const cartItem of items) {
        const foodItemId = cartItem.foodItemId || cartItem.id;
        let foodItem = null;
        if (foodItemId) {
            foodItem = await db.foodItem.findUnique({ where: { id: foodItemId } }).catch(() => null);
        }

        if (foodItem) {
            if (!foodItem.isAvailable) {
                throw new ApiError(`Item ${cartItem.name} is currently unavailable.`, 400);
            }

            if (foodItem.stockQuantity !== -1) {
                if (foodItem.stockQuantity < cartItem.quantity) {
                    throw new ApiError(`Not enough stock for ${cartItem.name}. Only ${foodItem.stockQuantity} left.`, 400);
                }
                const newStock = Math.max(0, foodItem.stockQuantity - cartItem.quantity);
                itemUpdates.push({
                    id: foodItem.id,
                    newStock,
                    isAvailable: newStock > 0
                });
            }
        }
    }

    const transactionOperations = [];

    for (const update of itemUpdates) {
        transactionOperations.push(
            db.foodItem.update({
                where: { id: update.id },
                data: {
                    stockQuantity: update.newStock,
                    isAvailable: update.isAvailable
                }
            })
        );
    }

    const shortOrderId = crypto.randomBytes(4).toString("hex");

    transactionOperations.push(
        db.order.create({
            data: {
                id: shortOrderId,
                userId: session.user.id,
                sellerId: sellerProfile.id,
                status: "PENDING",
                items: JSON.stringify(items),
                deliveryAddress: deliveryAddress || dbUser.city || "Delivery Address",
                customerPhone: customerPhone || dbUser.phone || "N/A",
                paymentMethod: isOnlinePayment ? "ONLINE" : "COD",
                totalAmount: totalAmount,
                isPaid: isOnlinePayment,
                appliedCouponId: appliedCouponId || null,
                razorpayOrderId: isOnlinePayment ? razorpay_order_id : null,
                razorpayPaymentId: isOnlinePayment ? razorpay_payment_id : null,
            }
        })
    );

    if (appliedCouponId) {
        transactionOperations.push(
            db.coupon.update({
                where: { id: appliedCouponId },
                data: { currentUsersCount: { increment: 1 } }
            })
        );
    }

    const results = await db.$transaction(transactionOperations);
    // Find the order from the transaction results. It's the one before the coupon update if applicable.
    const order = appliedCouponId ? results[results.length - 2] : results[results.length - 1];

    try {
        emitOrderCreated({
            ...order,
            user: {
                id: dbUser.id,
                name: dbUser.name,
                phone: dbUser.phone,
                email: dbUser.email
            }
        });
    } catch (e) {
        console.error("Realtime event emission error:", e);
    }

    return {
        order
    };
};

export const cancelOrder = async (id: string, ticketId?: string) => {
    const session = await getAuthSession();
    if (!session || !session.user || (session.user.role !== "USER" && session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN" && session.user.role !== "SUPPORT" && session.user.role !== "AGENT")) {
        throw new ApiError("Unauthorized", 401);
    }

    const order = await db.order.findUnique({
        where: { id: id },
        select: { userId: true, status: true, isPaid: true, totalAmount: true, items: true }
    });

    if (!order) {
        throw new ApiError("Order not found", 404);
    }

    const isAdmin = session.user.role === "SUPERADMIN" || session.user.role === "ADMIN" || session.user.role === "SUPPORT" || session.user.role === "AGENT";
    if (order.userId !== session.user.id && !isAdmin) {
        throw new ApiError("Forbidden", 403);
    }

    if (order.status === "CANCELLED" || order.status === "DELIVERED") {
        throw new ApiError(`Cannot cancel order in ${order.status} state`, 400);
    }

    if (order.status !== "PENDING" && !isAdmin) {
        throw new ApiError("Only pending orders can be cancelled", 400);
    }


    // Restore inventory stock for food items in the order
    if (order.items) {
        try {
            const itemsList = JSON.parse(order.items);
            if (Array.isArray(itemsList)) {
                for (const item of itemsList) {
                    const itemId = item.foodItemId || item.id;
                    if (itemId && item.quantity) {
                        const foodItem = await db.foodItem.findUnique({
                            where: { id: itemId }
                        });
                        if (foodItem && foodItem.stockQuantity !== -1) {
                            const newStock = foodItem.stockQuantity + item.quantity;
                            await db.foodItem.update({
                                where: { id: itemId },
                                data: {
                                    stockQuantity: newStock,
                                    isAvailable: true // Ensure item is marked available again
                                }
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Failed to restore inventory on cancelOrder:", error);
        }
    }

    const cancelledOrder = await db.order.update({
        where: { id: id },
        data: { status: "CANCELLED" }
    });

    try {
        emitOrderCancelled(cancelledOrder);
    } catch (e) {
        console.error("Realtime event emission error:", e);
    }

    if (order.isPaid) {
        const existingRefund = await db.refund.findUnique({
            where: { orderId: id }
        });
        if (!existingRefund) {
            let baseReason = isAdmin 
                ? "Order cancelled by Admin/Superadmin prior to preparation." 
                : "Order cancelled by customer prior to preparation.";
            if (ticketId) {
                baseReason = `[Ticket Ref: #${ticketId}] ${baseReason}`;
            }
            await db.refund.create({
                data: {
                    userId: order.userId,
                    orderId: id,
                    amount: order.totalAmount,
                    reason: baseReason,
                    status: "PENDING"
                }
            });
        }
    }

    return null;
};

export const verifyOrderPayment = async (req: Request) => {
    const session = await getAuthSession();
    if (!session || !session.user || session.user.role !== "USER") {
        throw new ApiError("Unauthorized", 401);
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
        throw new ApiError("Missing payment verification details", 400);
    }

    const order = await db.order.findUnique({
        where: { id: orderId }
    });

    if (!order) {
        throw new ApiError("Order not found", 404);
    }

    if (order.userId !== session.user.id) {
        throw new ApiError("Unauthorized access to order", 403);
    }

    if (order.razorpayOrderId !== razorpay_order_id) {
        throw new ApiError("Order ID mismatch", 400);
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || "";
    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

    if (expectedSignature !== razorpay_signature) {
        throw new ApiError("Invalid payment signature", 400);
    }

    const updatedOrder = await db.order.update({
        where: { id: orderId },
        data: {
            isPaid: true,
            razorpayPaymentId: razorpay_payment_id
        }
    });

    try {
        emitOrderUpdated(updatedOrder);
    } catch (e) {
        console.error("Realtime event emission error:", e);
    }

    return { order: updatedOrder };
};

export const getOrderDetails = async (id: string) => {
    const session = await getAuthSession();
    if (!session || !session.user) {
        throw new ApiError("Unauthorized", 401);
    }

    const order = await db.order.findUnique({
        where: { id: id },
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                    phone: true
                }
            },
            seller: {
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                            phone: true
                        }
                    }
                }
            },
            deliveryPerson: {
                select: {
                    id: true,
                    userId: true,
                    name: true,
                    phone: true,
                    vehicleType: true,
                    vehicleNumber: true
                }
            }
        }
    });

    if (!order) {
        throw new ApiError("Order not found", 404);
    }

    const isBuyer = order.userId === session.user.id;
    const isSeller = order.seller.userId === session.user.id;
    const isDeliveryBoy = order.deliveryPerson && order.deliveryPerson.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPERADMIN" || session.user.role === "SUPPORT" || session.user.role === "AGENT";

    if (!isBuyer && !isSeller && !isDeliveryBoy && !isAdmin) {
        throw new ApiError("Forbidden", 403);
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

    return {
        ...order,
        appliedCoupon
    };
};

