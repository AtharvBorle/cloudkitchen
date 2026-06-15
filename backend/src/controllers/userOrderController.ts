import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import Razorpay from "razorpay";
import crypto from "crypto";

export const createOrder = async (req: Request) => {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== "USER") {
        throw new ApiError("Unauthorized", 401);
    }

    const { sellerId, items, totalAmount, deliveryAddress, customerPhone, paymentMethod, appliedCouponId } = await req.json();

    if (!sellerId || !items || items.length === 0 || totalAmount === undefined) {
        throw new ApiError("Missing required fields", 400);
    }

    const dbUser = await db.user.findUnique({ where: { id: session.user.id } });
    if (!dbUser) throw new ApiError("User not found", 404);

    const sellerProfile = await db.sellerProfile.findUnique({ where: { id: sellerId } });
    if (!sellerProfile) throw new ApiError("Seller not found", 404);
    if (!sellerProfile.isOnline) {
        throw new ApiError("This store is currently offline. Orders cannot be placed.", 400);
    }

    // --- Coupon Validation Logic ---
    if (appliedCouponId) {
        const coupon = await db.coupon.findUnique({ where: { id: appliedCouponId } });
        if (!coupon) throw new ApiError("Invalid coupon selected", 400);
        if (!coupon.isActive) throw new ApiError("This coupon is no longer active", 400);

        // 1. Minimum Cart Value check
        if (coupon.minimumCartValue) {
            let baseTotal = 0;
            for (const item of items) {
                baseTotal += (item.price || 0) * (item.quantity || 1);
            }
            if (baseTotal < coupon.minimumCartValue) {
                throw new ApiError(`This coupon requires a minimum cart value of ₹${coupon.minimumCartValue}`, 400);
            }
        }

        // 2. Max Usages Per User check
        if (coupon.maxUsagesPerUser) {
            const usageCount = await db.order.count({
                where: {
                    userId: session.user.id,
                    appliedCouponId: appliedCouponId,
                    status: { not: "CANCELLED" }
                }
            });
            if (usageCount >= coupon.maxUsagesPerUser) {
                throw new ApiError(`You've reached the maximum usage limit (${coupon.maxUsagesPerUser}) for this coupon.`, 400);
            }
        }

        // 3. Max Users check
        if (coupon.maxUsers) {
            if (coupon.currentUsersCount >= coupon.maxUsers) {
                throw new ApiError(`This coupon has reached its maximum users limit across the platform.`, 400);
            }
        }
    }
    // --- End Coupon Validation Logic ---

    // --- Pincode Validation ---
    const defaultAddress = await db.address.findFirst({
        where: { userId: session.user.id, isDefault: true }
    });
    const userPincode = defaultAddress?.pincode ? defaultAddress.pincode.trim() : (dbUser.pincode ? dbUser.pincode.trim() : null);

    if (!userPincode) {
        throw new ApiError("Please set a delivery address with a valid pincode.", 400);
    }

    const itemUpdates = [];
    for (const cartItem of items) {
        const foodItem = await db.foodItem.findUnique({ where: { id: cartItem.id } });
        if (!foodItem) {
            throw new ApiError(`Item ${cartItem.name} no longer exists.`, 400);
        }
        if (!foodItem.isAvailable) {
            throw new ApiError(`Item ${cartItem.name} is currently unavailable.`, 400);
        }

        let itemOpen = true;
        const nowInIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const currentDayStr = daysOfWeek[nowInIST.getDay()];

        if (foodItem.operationalHours) {
            try {
                const hours = JSON.parse(foodItem.operationalHours);
                const dayHours = hours[currentDayStr];
                if (dayHours) {
                    if (!dayHours.isOpen) {
                        itemOpen = false;
                    } else if (dayHours.openTime && dayHours.closeTime) {
                        const currentHours = nowInIST.getHours().toString().padStart(2, '0');
                        const currentMinutes = nowInIST.getMinutes().toString().padStart(2, '0');
                        const currentTimeStr = `${currentHours}:${currentMinutes}`;
                        const openTime = dayHours.openTime;
                        const closeTime = dayHours.closeTime;
                        if (openTime <= closeTime) {
                            itemOpen = currentTimeStr >= openTime && currentTimeStr <= closeTime;
                        } else {
                            itemOpen = currentTimeStr >= openTime || currentTimeStr <= closeTime;
                        }
                    }
                }
            } catch (e) {
                console.error("Failed to parse operationalHours on backend order validation", e);
            }
        } else if (foodItem.openTime && foodItem.closeTime) {
            const currentHours = nowInIST.getHours().toString().padStart(2, '0');
            const currentMinutes = nowInIST.getMinutes().toString().padStart(2, '0');
            const currentTimeStr = `${currentHours}:${currentMinutes}`;
            const openTime = foodItem.openTime;
            const closeTime = foodItem.closeTime;
            if (openTime <= closeTime) {
                itemOpen = currentTimeStr >= openTime && currentTimeStr <= closeTime;
            } else {
                itemOpen = currentTimeStr >= openTime || currentTimeStr <= closeTime;
            }
        }

        if (!itemOpen) {
            throw new ApiError(`Item ${cartItem.name} is currently closed for orders today.`, 400);
        }

        if (foodItem.deliveryPincodes) {
            const pins = foodItem.deliveryPincodes.split(",").map(p => p.trim());
            if (!pins.includes(userPincode)) {
                throw new ApiError(`Item ${cartItem.name} is not deliverable to your address (Pincode: ${userPincode}).`, 400);
            }
        } else {
            if (sellerProfile.userId) {
                const sellerUser = await db.user.findUnique({ where: { id: sellerProfile.userId } });
                if (sellerUser?.pincode && sellerUser.pincode.trim() !== userPincode) {
                    throw new ApiError(`Item ${cartItem.name} is not deliverable to your address (Pincode: ${userPincode}).`, 400);
                }
            }
        }

        if (foodItem.stockQuantity !== -1) {
            if (foodItem.stockQuantity < cartItem.quantity) {
                throw new ApiError(`Not enough stock for ${cartItem.name}. Only ${foodItem.stockQuantity} left.`, 400);
            }
            const newStock = foodItem.stockQuantity - cartItem.quantity;
            itemUpdates.push({
                id: foodItem.id,
                newStock,
                isAvailable: newStock > 0
            });
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

    let razorpayOrderData = null;

    if (paymentMethod === "ONLINE") {
        try {
            const razorpay = new Razorpay({
                key_id: process.env.RAZORPAY_KEY_ID || "",
                key_secret: process.env.RAZORPAY_KEY_SECRET || "",
            });

            const rzpOrder = await razorpay.orders.create({
                amount: Math.round(totalAmount * 100), // in paise
                currency: "INR",
                receipt: `order_rcpt_${Date.now()}`
            });

            razorpayOrderData = rzpOrder;
        } catch (error) {
            console.error("Razorpay error:", error);
            throw new ApiError("Failed to initiate online payment", 500);
        }
    }

    transactionOperations.push(
        db.order.create({
            data: {
                userId: session.user.id,
                sellerId,
                status: "PENDING",
                items: JSON.stringify(items),
                deliveryAddress: deliveryAddress || dbUser.city,
                customerPhone: customerPhone || dbUser.phone,
                paymentMethod: paymentMethod || "COD",
                totalAmount: totalAmount,
                isPaid: false,
                appliedCouponId: appliedCouponId || null,
                razorpayOrderId: razorpayOrderData ? razorpayOrderData.id : null
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

    return {
        order,
        razorpayOrder: razorpayOrderData
    };
};

export const cancelOrder = async (id: string) => {
    const session = await getAuthSession();
    if (!session || !session.user || session.user.role !== "USER") {
        throw new ApiError("Unauthorized", 401);
    }

    const order = await db.order.findUnique({
        where: { id: id },
        select: { userId: true, status: true }
    });

    if (!order) {
        throw new ApiError("Order not found", 404);
    }

    if (order.userId !== session.user.id) {
        throw new ApiError("Forbidden", 403);
    }

    if (order.status !== "PENDING") {
        throw new ApiError("Only pending orders can be cancelled", 400);
    }

    await db.order.update({
        where: { id: id },
        data: { status: "CANCELLED" }
    });

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

    return { order: updatedOrder };
};
