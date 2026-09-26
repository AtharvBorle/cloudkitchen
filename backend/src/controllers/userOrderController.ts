import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import Razorpay from "razorpay";
import crypto from "crypto";
import { emitOrderCreated, emitOrderCancelled, emitOrderUpdated } from "@/lib/realtime-events";
import { calculateDistanceKm, getPincodeCoordinates, MAX_DELIVERY_RADIUS_KM } from "@/lib/geo-distance";

export const initiateOrderPayment = async (req: Request) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to proceed with payment.", 401);
    }
    if (session.user.role !== "USER") {
        throw new ApiError("Access denied. Customer account required to place orders.", 403);
    }

    const { totalAmount, sellerId } = await req.json();
    if (!totalAmount || Number(totalAmount) <= 0) {
        throw new ApiError("Invalid total amount", 400);
    }

    if (sellerId) {
        const seller = await db.sellerProfile.findFirst({
            where: {
                OR: [
                    { id: sellerId },
                    { trackingId: sellerId },
                    { userId: sellerId }
                ]
            }
        });
        if (seller && seller.isOnline === false) {
            throw new ApiError("This store is currently offline and not accepting orders.", 400);
        }
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
    if (!session?.user) {
        throw new ApiError("Please log in first to place your order.", 401);
    }
    if (session.user.role !== "USER") {
        throw new ApiError("Access denied. Customer account required to place orders.", 403);
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
            user: true,
            servedPincodes: true,
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
                user: true,
                servedPincodes: true,
                subscriptions: {
                    where: { status: "ACTIVE" },
                    include: { plan: true }
                }
            }
        }) || await db.sellerProfile.findFirst({
            include: {
                user: true,
                servedPincodes: true,
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

    // --- Delivery Coverage & Distance Validation ---
    const sellerLat = sellerProfile.latitude ?? getPincodeCoordinates(sellerProfile.user?.pincode)?.lat ?? null;
    const sellerLng = sellerProfile.longitude ?? getPincodeCoordinates(sellerProfile.user?.pincode)?.lng ?? null;

    let customerLat: number | null = null;
    let customerLng: number | null = null;

    if (defaultAddress?.latitude && defaultAddress?.longitude) {
        customerLat = Number(defaultAddress.latitude);
        customerLng = Number(defaultAddress.longitude);
    } else {
        const pinCoords = getPincodeCoordinates(userPincode);
        if (pinCoords) {
            customerLat = pinCoords.lat;
            customerLng = pinCoords.lng;
        }
    }

    const maxRadiusKm = MAX_DELIVERY_RADIUS_KM; // 5.0 km default

    if (customerLat !== null && customerLng !== null && sellerLat !== null && sellerLng !== null) {
        const distanceKm = calculateDistanceKm(customerLat, customerLng, sellerLat, sellerLng);
        if (distanceKm > maxRadiusKm) {
            throw new ApiError(
                `Your delivery location is ${distanceKm} km away, which is outside this restaurant's ${maxRadiusKm} km delivery coverage. Please select a valid delivery address within the coverage area.`,
                400
            );
        }
    } else if (userPincode && sellerProfile.user?.pincode) {
        const userPinCoords = getPincodeCoordinates(userPincode);
        const sellerPinCoords = getPincodeCoordinates(sellerProfile.user.pincode);
        if (userPinCoords && sellerPinCoords) {
            const pinDistance = calculateDistanceKm(userPinCoords.lat, userPinCoords.lng, sellerPinCoords.lat, sellerPinCoords.lng);
            if (pinDistance > maxRadiusKm) {
                throw new ApiError(
                    `Your delivery pincode (${userPincode}) is ${pinDistance} km away, which is outside the restaurant's ${maxRadiusKm} km delivery coverage. Please select a valid delivery address within the coverage area.`,
                    400
                );
            }
        }
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
    if (!session?.user) {
        throw new ApiError("Please log in first to cancel an order.", 401);
    }
    if (session.user.role !== "USER" && session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN" && session.user.role !== "SUPPORT" && session.user.role !== "AGENT") {
        throw new ApiError("Access denied. You do not have permission to cancel orders.", 403);
    }

    const order = await db.order.findUnique({
        where: { id: id },
        select: { userId: true, status: true, isPaid: true, totalAmount: true, items: true, appliedCouponId: true }
    });

    if (!order) {
        throw new ApiError("Order not found.", 404);
    }

    const isAdmin = session.user.role === "SUPERADMIN" || session.user.role === "ADMIN" || session.user.role === "SUPPORT" || session.user.role === "AGENT";
    if (order.userId !== session.user.id && !isAdmin) {
        throw new ApiError("Access denied. You can only cancel orders placed from your own account.", 403);
    }

    if (order.status === "CANCELLED" || order.status === "DELIVERED") {
        throw new ApiError(`Cannot cancel order in ${order.status} state`, 400);
    }

    if (order.status !== "PENDING" && order.status !== "PLACED" && !isAdmin) {
        throw new ApiError("Order has already been confirmed or processed by the seller and cannot be cancelled", 400);
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

    // Revert coupon usage count if coupon was applied
    if (order.appliedCouponId) {
        try {
            await db.coupon.update({
                where: { id: order.appliedCouponId },
                data: { currentUsersCount: { decrement: 1 } }
            });
        } catch (err) {
            console.error("Failed to decrement coupon usage on cancelOrder:", err);
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
    if (!session?.user) {
        throw new ApiError("Please log in first to verify your payment.", 401);
    }
    if (session.user.role !== "USER") {
        throw new ApiError("Access denied. Customer account required.", 403);
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
        throw new ApiError("Access denied. You can only verify payments for your own orders.", 403);
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
    if (!session?.user) {
        throw new ApiError("Please log in first to view order details.", 401);
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
        throw new ApiError("Access denied. You do not have permission to view this order.", 403);
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

export const validateReorder = async (orderId: string) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to reorder.", 401);
    }

    if (!orderId) {
        throw new ApiError("Order ID is required", 400);
    }

    const order = await db.order.findUnique({
        where: { id: orderId },
        include: {
            seller: {
                include: {
                    user: {
                        select: {
                            name: true,
                            city: true
                        }
                    }
                }
            }
        }
    });

    if (!order) {
        throw new ApiError("Order not found", 404);
    }

    if (order.userId !== session.user.id && session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") {
        throw new ApiError("You do not have permission to reorder from this order.", 403);
    }

    const seller = order.seller;
    const sellerName = seller?.businessName || seller?.user?.name || "Cloud Kitchen";
    const isSellerOnline = seller ? seller.isOnline !== false : false;

    // Parse order items
    let rawItems: any[] = [];
    try {
        const parsed = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
        if (Array.isArray(parsed)) {
            rawItems = parsed;
        }
    } catch (e) {
        rawItems = [];
    }

    if (rawItems.length === 0) {
        return {
            orderId: order.id,
            sellerId: seller?.id || order.sellerId,
            sellerName,
            sellerOnline: isSellerOnline,
            canReorderFull: false,
            canReorderPartial: false,
            totalItemsCount: 0,
            availableItemsCount: 0,
            unavailableItemsCount: 0,
            availableItems: [],
            unavailableItems: [],
            allItems: [],
            message: "This order contains no items to reorder."
        };
    }

    if (!isSellerOnline) {
        return {
            orderId: order.id,
            sellerId: seller?.id || order.sellerId,
            sellerName,
            sellerOnline: false,
            canReorderFull: false,
            canReorderPartial: false,
            totalItemsCount: rawItems.length,
            availableItemsCount: 0,
            unavailableItemsCount: rawItems.length,
            availableItems: [],
            unavailableItems: rawItems.map((item: any) => ({
                id: item.id || item.foodItemId,
                name: item.name || "Meal Item",
                reason: `The kitchen (${sellerName}) is currently offline.`
            })),
            allItems: [],
            message: `${sellerName} is currently offline and not accepting orders.`
        };
    }

    const availableItems: any[] = [];
    const unavailableItems: any[] = [];
    const allItems: any[] = [];

    for (const item of rawItems) {
        const foodItemId = item.foodItemId || item.id;
        let foodItem = null;

        if (foodItemId) {
            foodItem = await db.foodItem.findUnique({
                where: { id: foodItemId }
            }).catch(() => null);
        }

        if (!foodItem && item.name && order.sellerId) {
            foodItem = await db.foodItem.findFirst({
                where: {
                    sellerId: order.sellerId,
                    name: item.name
                }
            }).catch(() => null);
        }

        const requestedQty = Math.max(1, Number(item.quantity || item.qty || 1));
        const itemImage = foodItem?.imageUrl || item.imageUrl || item.image || "/images/places/place-biryani.png";

        if (!foodItem) {
            const unItem = {
                id: foodItemId || item.id || `unavail-${item.name}`,
                foodItemId: foodItemId || item.id,
                name: item.name || "Food Item",
                quantity: requestedQty,
                price: item.price || 0,
                imageUrl: itemImage,
                isAvailable: false,
                inStock: false,
                stockQuantity: 0,
                reason: "This item is no longer on the kitchen menu."
            };
            unavailableItems.push(unItem);
            allItems.push(unItem);
            continue;
        }

        if (!foodItem.isAvailable) {
            const unItem = {
                id: foodItem.id,
                foodItemId: foodItem.id,
                name: foodItem.name,
                quantity: requestedQty,
                price: foodItem.price !== undefined ? foodItem.price : (item.price || 0),
                imageUrl: itemImage,
                isAvailable: false,
                inStock: foodItem.stockQuantity !== 0,
                stockQuantity: foodItem.stockQuantity,
                reason: "This item is currently unavailable."
            };
            unavailableItems.push(unItem);
            allItems.push(unItem);
            continue;
        }

        if (foodItem.stockQuantity !== -1 && foodItem.stockQuantity <= 0) {
            const unItem = {
                id: foodItem.id,
                foodItemId: foodItem.id,
                name: foodItem.name,
                quantity: requestedQty,
                price: foodItem.price !== undefined ? foodItem.price : (item.price || 0),
                imageUrl: itemImage,
                isAvailable: true,
                inStock: false,
                stockQuantity: 0,
                reason: "This item is currently out of stock."
            };
            unavailableItems.push(unItem);
            allItems.push(unItem);
            continue;
        }

        let finalQty = requestedQty;
        let stockWarning: string | null = null;
        if (foodItem.stockQuantity !== -1 && foodItem.stockQuantity < requestedQty) {
            finalQty = foodItem.stockQuantity;
            stockWarning = `Only ${foodItem.stockQuantity} item(s) available in stock (you previously ordered ${requestedQty}).`;
        }

        const availItem = {
            id: foodItem.id,
            foodItemId: foodItem.id,
            name: foodItem.name,
            price: foodItem.price !== undefined ? foodItem.price : (item.price || 0),
            basePrice: foodItem.price !== undefined ? foodItem.price : (item.basePrice || item.price || 0),
            quantity: finalQty,
            sellerId: seller?.id || order.sellerId,
            sellerName,
            image: itemImage,
            imageUrl: itemImage,
            stockQuantity: foodItem.stockQuantity,
            maxStock: foodItem.stockQuantity,
            itemType: foodItem.itemType || item.itemType || "VEG",
            selectedAddons: item.selectedAddons || [],
            addonsTotal: item.addonsTotal || 0,
            addons: item.addons || [],
            isAvailable: true,
            inStock: true,
            warning: stockWarning
        };

        availableItems.push(availItem);
        allItems.push(availItem);
    }

    const canReorderFull = isSellerOnline && unavailableItems.length === 0 && availableItems.length > 0;
    const canReorderPartial = isSellerOnline && availableItems.length > 0;

    return {
        orderId: order.id,
        sellerId: seller?.id || order.sellerId,
        sellerName,
        sellerOnline: isSellerOnline,
        canReorderFull,
        canReorderPartial,
        totalItemsCount: rawItems.length,
        availableItemsCount: availableItems.length,
        unavailableItemsCount: unavailableItems.length,
        availableItems,
        unavailableItems,
        allItems,
        message: canReorderFull 
            ? "All items from this order are available for reorder."
            : canReorderPartial
            ? `Some items are unavailable (${unavailableItems.length} unavailable).`
            : "None of the items from this order are currently available."
    };
};


