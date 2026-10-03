import { db } from "@/lib/db";
import { unstable_cache } from "next/cache";
import { getPincodeCoordinates } from "@/lib/geo-distance";
import { ApiError } from "@/lib/api-error";
import { getAuthSession } from "@/lib/auth";

export const getPublicCategories = unstable_cache(
    async () => {
        const categories = await db.category.findMany({
            orderBy: { name: 'asc' }
        });
        const foodCategories = await db.foodCategory.findMany({
            include: {
                categories: true,
                subCategories: {
                    orderBy: { name: 'asc' }
                }
            },
            orderBy: { name: 'asc' }
        });

        return { categories, foodCategories };
    },
    ["public-categories"],
    { revalidate: 60, tags: ["categories"] }
);

export const getPublicExploreData = unstable_cache(
    async () => {
        const sellers = await db.sellerProfile.findMany({
            where: {
                verificationStatus: "APPROVED",
                user: { isActive: true }
            },
            include: {
                user: {
                    select: { name: true, city: true, pincode: true, phone: true }
                },
                servedPincodes: true,
                reviews: {
                    select: { rating: true, comment: true }
                },
                foodItems: {
                    include: {
                        category: true,
                        foodCategory: true,
                        itemRatings: true
                    }
                },
                rooms: {
                    where: { isAvailable: true }
                },
                subscriptions: {
                    where: { status: "ACTIVE" },
                    include: { plan: true }
                }
            }
        });

        const foodCategories = await db.foodCategory.findMany({
            orderBy: { name: 'asc' }
        });

        const now = new Date();

        const activeSellersList: any[] = [];

        const foodItems = sellers.flatMap(seller => {
            const hasActiveFoodSub = seller.verificationStatus === "APPROVED" || seller.subscriptions.some(sub => 
                sub.status === "ACTIVE" && 
                (sub.validUntil === null || new Date(sub.validUntil) > now) &&
                (sub.plan?.category === "FOOD" || sub.plan?.category === "BOTH")
            );
            if (!hasActiveFoodSub) return [];

            const reviewsCount = seller.reviews.length;
            const avgRating = reviewsCount > 0
                ? Number((seller.reviews.reduce((acc, r) => acc + r.rating, 0) / reviewsCount).toFixed(1))
                : 0;

            let parsedKitchenImages: string[] = [];
            try {
                parsedKitchenImages = typeof seller.kitchenImages === "string" ? JSON.parse(seller.kitchenImages) : seller.kitchenImages;
            } catch {
                parsedKitchenImages = [];
            }

            const defaultCoords = getPincodeCoordinates(seller.user.pincode);
            const resolvedLat = seller.latitude ?? defaultCoords?.lat ?? null;
            const resolvedLng = seller.longitude ?? defaultCoords?.lng ?? null;

            activeSellersList.push({
                id: seller.id,
                name: seller.businessName || seller.user.name,
                trackingId: seller.trackingId,
                type: seller.type,
                city: seller.user.city,
                pincode: seller.user.pincode,
                locality: seller.addressLocality,
                landmark: seller.addressLandmark,
                latitude: resolvedLat,
                longitude: resolvedLng,
                isLocationPinned: seller.isLocationPinned,
                rating: avgRating,
                averageRating: avgRating,
                reviewsCount,
                totalReviews: reviewsCount,
                imageUrl: parsedKitchenImages[0] || seller.bannerImageUrl || "/images/places/place-pizza.png",
                isOnline: seller.isOnline,
                foodType: seller.foodType,
                deliveryRadiusKm: seller.deliveryRadiusKm ?? 5.0,
                servedPincodes: seller.servedPincodes.map(p => p.pincode),
            });

            return seller.foodItems.map(item => {
                const itemRatingsList = item.itemRatings || [];
                const itemRatingCount = itemRatingsList.length;
                const itemAvgRating = itemRatingCount > 0
                    ? Number((itemRatingsList.reduce((acc: number, r: any) => acc + r.rating, 0) / itemRatingCount).toFixed(1))
                    : (avgRating > 0 ? avgRating : 0);

                return {
                    ...item,
                    rating: itemAvgRating,
                    averageRating: itemAvgRating,
                    totalRatings: itemRatingCount,
                    reviewsCount: itemRatingCount > 0 ? itemRatingCount : reviewsCount,
                    sellerName: seller.businessName || seller.user.name,
                    sellerCity: seller.user.city,
                    sellerPincode: seller.user.pincode,
                    sellerLocality: seller.addressLocality,
                    sellerLandmark: seller.addressLandmark,
                    sellerTrackingId: seller.trackingId,
                    sellerIsOnline: seller.isOnline,
                    sellerFoodType: seller.foodType,
                    sellerLatitude: resolvedLat,
                    sellerLongitude: resolvedLng,
                    sellerIsLocationPinned: seller.isLocationPinned,
                    sellerDeliveryRadiusKm: seller.deliveryRadiusKm ?? 5.0,
                    servedPincodes: seller.servedPincodes.map(p => p.pincode),
                };
            });
        });

        const availableRooms = sellers.flatMap(seller => {
            const hasActivePropertySub = seller.verificationStatus === "APPROVED" || seller.subscriptions.some(sub => 
                sub.status === "ACTIVE" && 
                (sub.validUntil === null || new Date(sub.validUntil) > now) &&
                (sub.plan?.category === "PROPERTY" || sub.plan?.category === "BOTH")
            );
            if (!hasActivePropertySub) return [];
            const defaultCoords = getPincodeCoordinates(seller.user.pincode);
            const resolvedLat = seller.latitude ?? defaultCoords?.lat ?? null;
            const resolvedLng = seller.longitude ?? defaultCoords?.lng ?? null;

            return seller.rooms.map(room => ({
                ...room,
                sellerName: seller.businessName || seller.user.name,
                sellerCity: seller.user.city,
                sellerPincode: seller.user.pincode,
                sellerLocality: seller.addressLocality,
                sellerLandmark: seller.addressLandmark,
                sellerTrackingId: seller.trackingId,
                sellerIsOnline: seller.isOnline,
                sellerLatitude: resolvedLat,
                sellerLongitude: resolvedLng,
                sellerIsLocationPinned: seller.isLocationPinned,
                sellerDeliveryRadiusKm: seller.deliveryRadiusKm ?? 5.0,
            }));
        });

        return { foodItems, availableRooms, foodCategories, kitchens: activeSellersList };
    },
    ["public-explore-data"],
    { revalidate: 30, tags: ["explore"] }
);

export const getPublicRoomAvailability = (id: string) => unstable_cache(
    async () => {
        if (!id) {
            throw new Error("Room ID is required");
        }

        const bookings = await db.booking.findMany({
            where: {
                roomId: id,
                status: { in: ["CONFIRMED", "PENDING"] },
                endDate: { gte: new Date() }
            },
            select: {
                startDate: true,
                endDate: true
            },
            orderBy: {
                startDate: 'asc'
            }
        });

        return bookings;
    },
    [`room-availability-${id}`],
    { revalidate: 10, tags: ["bookings", `room-${id}`] }
)();

export const getPublicCoupons = async (sellerId: string | null, userId?: string | null) => {
    try {
        const cleanSellerId = (sellerId && sellerId !== "none" && sellerId !== "all" && sellerId !== "null" && sellerId !== "undefined" && sellerId.trim() !== "") ? sellerId.trim() : null;
        let resolvedSellerId = cleanSellerId;
        let sellerCategory = "BOTH";
        let matchedSeller: any = null;
        if (cleanSellerId) {
            try {
                matchedSeller = await db.sellerProfile.findFirst({
                    where: {
                        OR: [
                            { id: cleanSellerId },
                            { trackingId: cleanSellerId },
                            { userId: cleanSellerId }
                        ]
                    }
                });
                if (matchedSeller) {
                    resolvedSellerId = matchedSeller.id;
                    sellerCategory = matchedSeller.businessCategory || "BOTH";
                }
            } catch (err) {
                console.error("Error finding matched seller in getPublicCoupons:", err);
            }
        }

        const activeCoupons = await db.coupon.findMany({
            where: {
                isActive: true,
                NOT: {
                    approvalStatus: { in: ["DRAFT", "REJECTED", "PENDING_APPROVAL", "Draft", "Rejected"] }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        const now = new Date();

        const filteredCoupons = activeCoupons.filter((c: any) => {
            // 1. Seller match
            const cSid = c.appliesToSellerId;
            if (cSid && cSid !== "GLOBAL" && cSid !== "ALL" && cSid !== "null" && cSid !== "undefined" && String(cSid).trim() !== "") {
                if (cleanSellerId || resolvedSellerId) {
                    const targetKeys = [
                        cleanSellerId,
                        resolvedSellerId,
                        matchedSeller?.id,
                        matchedSeller?.trackingId,
                        matchedSeller?.userId,
                        matchedSeller?.businessName,
                        matchedSeller?.user?.name
                    ].filter(Boolean).map((s: string) => String(s).toLowerCase().trim());

                    if (!targetKeys.includes(String(cSid).toLowerCase().trim())) {
                        return false;
                    }
                }
            }

            // 2. Date validity (with 24h timezone tolerance for validFrom)
            if (!c.noExpiry) {
                if (c.validFrom) {
                    const fromDate = new Date(c.validFrom);
                    if (fromDate.getTime() > now.getTime() + 24 * 60 * 60 * 1000) {
                        return false;
                    }
                }
                if (c.validUntil) {
                    const untilDate = new Date(c.validUntil);
                    const endOfDay = new Date(untilDate.getFullYear(), untilDate.getMonth(), untilDate.getDate(), 23, 59, 59, 999);
                    if (endOfDay.getTime() < now.getTime()) {
                        return false;
                    }
                }
            }

            // 3. Category match
            const cat = String(c.category || "BOTH").toUpperCase().trim();
            if (cat && cat !== "BOTH" && cat !== "FOOD" && cat !== "ALL") {
                if (sellerCategory && cat !== sellerCategory.toUpperCase().trim() && sellerCategory !== "BOTH") {
                    return false;
                }
            }

            return true;
        });

        // Resolve effective user context for eligibility checks
        const cleanUserId = (userId && userId !== "none" && userId !== "all" && userId !== "null" && userId !== "undefined" && userId.trim() !== "") ? userId.trim() : null;
        let effectiveUserId: string | null = cleanUserId;
        if (!effectiveUserId) {
            try {
                const session = await getAuthSession();
                effectiveUserId = session?.user?.id || null;
            } catch {
                effectiveUserId = null;
            }
        }

        let userOrderCount = 0;
        const userCouponUsageCounts = new Map<string, number>();

        if (effectiveUserId) {
            try {
                const userOrders = await db.order.findMany({
                    where: {
                        userId: effectiveUserId,
                        status: { not: "CANCELLED" }
                    },
                    select: { appliedCouponId: true }
                });
                userOrderCount = userOrders.length;
                userOrders.forEach((o: any) => {
                    if (o.appliedCouponId) {
                        const key = String(o.appliedCouponId).trim().toUpperCase();
                        userCouponUsageCounts.set(key, (userCouponUsageCounts.get(key) || 0) + 1);
                    }
                });
            } catch (err) {
                console.error("Error checking user coupon history:", err);
            }
        }

        const safeCoupons = filteredCoupons.map((c: any) => {
            let isEligible = true;
            let ineligibilityReason: string | null = null;

            if (effectiveUserId) {
                if (c.customerEligibility === "NEW_ONLY" && userOrderCount > 0) {
                    isEligible = false;
                    ineligibilityReason = "Exclusively for new users on their first order.";
                }

                const perUserLimit = c.perUserLimit || c.maxUsagesPerUser;
                if (perUserLimit && isEligible) {
                    const idKey = String(c.id).trim().toUpperCase();
                    const codeKey = String(c.code).trim().toUpperCase();
                    const usedCount = (userCouponUsageCounts.get(idKey) || 0) + (userCouponUsageCounts.get(codeKey) || 0);
                    if (usedCount >= perUserLimit) {
                        isEligible = false;
                        ineligibilityReason = "You have already used this coupon.";
                    }
                }
            }

            return {
                id: c.id,
                code: c.code,
                description: c.description,
                discountType: c.discountType || (c.discountPercentage ? "PERCENTAGE" : "FLAT"),
                discountPercentage: c.discountPercentage,
                discountAmount: c.discountAmount,
                minimumCartValue: c.minimumCartValue,
                maxDiscountAmount: c.maxDiscountAmount,
                customerEligibility: c.customerEligibility || "ALL",
                appliesTo: c.appliesTo || "ALL",
                appliesToSellerId: c.appliesToSellerId || null,
                appliesToProductId: c.appliesToProductId || null,
                maxUsagesPerUser: c.maxUsagesPerUser || c.perUserLimit || 1,
                maxUsers: c.maxUsers || c.usageLimit || null,
                currentUsersCount: c.currentUsersCount,
                noExpiry: c.noExpiry,
                validUntil: c.validUntil,
                isAutoApply: Boolean(c.isAutoApply),
                isEligible,
                ineligibilityReason
            };
        });

        return safeCoupons;
    } catch (err) {
        console.error("Error fetching public coupons:", err);
        return [];
    }
};

export const getPublicPopupBanners = (sellerId: string | null) => unstable_cache(
    async () => {
        const banners = await db.popupBanner.findMany({
            where: {
                isActive: true,
                OR: [
                    { appliesToSellerId: null },
                    ...(sellerId ? [{ appliesToSellerId: sellerId }] : [])
                ]
            },
            orderBy: { createdAt: 'desc' },
        });

        return { banners };
    },
    [`public-popup-banners-${sellerId || 'global'}`],
    { revalidate: 60, tags: ["popup-banners"] }
)();

export const validateCouponForCart = async (req: Request) => {
    const body = await req.json();
    const { code, sellerId, subtotal = 0, items = [], userId } = body;

    if (!code || typeof code !== "string" || !code.trim()) {
        throw new ApiError("Please enter a valid coupon code.", 400);
    }

    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length > 20) {
        throw new ApiError("Coupon code cannot exceed 20 characters.", 400);
    }
    if (!/^[A-Z0-9_-]+$/.test(cleanCode)) {
        throw new ApiError("Coupon code can only contain letters, numbers, hyphens, and underscores.", 400);
    }

    const now = new Date();

    const coupon = await db.coupon.findFirst({
        where: {
            code: { equals: cleanCode, mode: "insensitive" },
            isActive: true,
            NOT: {
                approvalStatus: { in: ["DRAFT", "REJECTED", "PENDING_APPROVAL", "Draft", "Rejected"] }
            }
        }
    });

    if (!coupon) {
        throw new ApiError(`Coupon "${cleanCode}" is invalid or does not exist.`, 404);
    }

    // Check validity dates (with 24h timezone leeway for validFrom)
    if (coupon.validFrom) {
        const fromDate = new Date(coupon.validFrom);
        if (fromDate.getTime() > now.getTime() + 24 * 60 * 60 * 1000) {
            throw new ApiError(`Coupon "${coupon.code}" is not active yet.`, 400);
        }
    }
    if (!coupon.noExpiry && coupon.validUntil) {
        const untilDate = new Date(coupon.validUntil);
        const endOfDay = new Date(untilDate.getFullYear(), untilDate.getMonth(), untilDate.getDate(), 23, 59, 59, 999);
        if (endOfDay.getTime() < now.getTime()) {
            throw new ApiError(`Coupon "${coupon.code}" has expired.`, 400);
        }
    }

    // Check usage limits
    const totalLimit = coupon.usageLimit || coupon.maxUsers;
    if (totalLimit && coupon.currentUsersCount >= totalLimit) {
        throw new ApiError(`Coupon "${coupon.code}" has reached its maximum usage limit.`, 400);
    }

    // Check seller store restriction
    const cSid = coupon.appliesToSellerId;
    if (cSid && cSid !== "GLOBAL" && cSid !== "ALL" && cSid !== "null" && cSid !== "undefined" && String(cSid).trim() !== "") {
        const couponSeller = await db.sellerProfile.findFirst({
            where: {
                OR: [
                    { id: cSid },
                    { trackingId: cSid },
                    { userId: cSid }
                ]
            },
            select: { id: true, businessName: true, trackingId: true, userId: true }
        });

        // Resolve cart's seller
        let cartSeller: { id: string; businessName: string; trackingId?: string | null; userId?: string | null } | null = null;
        if (sellerId && sellerId !== "seller" && sellerId !== "k-1") {
            cartSeller = await db.sellerProfile.findFirst({
                where: {
                    OR: [
                        { id: sellerId },
                        { trackingId: sellerId },
                        { userId: sellerId }
                    ]
                },
                select: { id: true, businessName: true, trackingId: true, userId: true }
            });
        }

        // If cartSeller not found yet, check from cart items
        if (!cartSeller && Array.isArray(items) && items.length > 0) {
            const firstItemId = items[0].foodItemId || items[0].id;
            if (firstItemId) {
                const fi = await db.foodItem.findUnique({
                    where: { id: firstItemId },
                    include: { seller: { select: { id: true, businessName: true, trackingId: true } } }
                });
                if (fi?.seller) cartSeller = fi.seller;
            }
        }

        const couponKitchenName = couponSeller?.businessName ? `"${couponSeller.businessName}"` : "its specific kitchen";
        const cartKitchenName = cartSeller?.businessName ? `"${cartSeller.businessName}"` : "another kitchen";

        if (cartSeller && couponSeller && cartSeller.id !== couponSeller.id) {
            throw new ApiError(`Coupon "${coupon.code}" is exclusive to ${couponKitchenName} and cannot be applied to orders from ${cartKitchenName}.`, 400);
        }

        if (!cartSeller && sellerId && sellerId !== "seller" && couponSeller && sellerId !== couponSeller.id && sellerId !== couponSeller.trackingId) {
            throw new ApiError(`Coupon "${coupon.code}" is exclusive to ${couponKitchenName} and cannot be applied to orders from ${cartKitchenName}.`, 400);
        }
    }

    // Check minimum cart value
    const minCart = coupon.minimumCartValue ?? 0;
    const numSubtotal = Number(subtotal) || 0;
    if (minCart > 0 && numSubtotal < minCart) {
        throw new ApiError(`Coupon "${coupon.code}" requires a minimum order of ₹${minCart}. (Your cart is ₹${numSubtotal})`, 400);
    }

    // Check specific item or category restrictions
    let matchingProductSubtotal = 0;
    let applicableCategoryName: string | null = null;
    let matchingItemIdsList: string[] = [];

    if (coupon.appliesToProductId) {
        if (!Array.isArray(items) || items.length === 0) {
            throw new ApiError(`Coupon "${coupon.code}" is only valid on specific items not present in your cart.`, 400);
        }
        const allowedKeys = coupon.appliesToProductId.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean);
        if (allowedKeys.length > 0) {
            if (coupon.appliesTo === "CATEGORY") {
                const itemIds = items.map((it: any) => {
                    const rawId = String(it.foodItemId || it.id || "");
                    return rawId.includes("_") ? rawId.split("_")[0] : rawId;
                }).filter(Boolean);

                const matchingFoodItems = await db.foodItem.findMany({
                    where: {
                        id: { in: itemIds },
                        OR: [
                            { foodCategoryId: { in: allowedKeys } },
                            { categoryId: { in: allowedKeys } },
                            { foodCategory: { name: { in: allowedKeys, mode: "insensitive" } } },
                            { category: { name: { in: allowedKeys, mode: "insensitive" } } }
                        ]
                    },
                    include: {
                        foodCategory: true,
                        category: true
                    }
                });

                // Find human-readable category name
                const matchedCategories = await db.foodCategory.findMany({
                    where: {
                        OR: [
                            { id: { in: allowedKeys } },
                            { name: { in: allowedKeys, mode: "insensitive" } }
                        ]
                    }
                });
                const matchedGeneralCategories = await db.category.findMany({
                    where: {
                        OR: [
                            { id: { in: allowedKeys } },
                            { name: { in: allowedKeys, mode: "insensitive" } }
                        ]
                    }
                });

                applicableCategoryName = matchedCategories[0]?.name || matchedGeneralCategories[0]?.name || allowedKeys[0];

                const matchingItemIds = new Set(matchingFoodItems.map(f => f.id.toLowerCase()));

                items.forEach((it: any) => {
                    const itemId = String(it.id || "").toLowerCase();
                    const foodItemId = String(it.foodItemId || "").toLowerCase();
                    const baseId = itemId.includes("_") ? itemId.split("_")[0] : itemId;
                    const catId = String(it.foodCategoryId || it.categoryId || "").toLowerCase();
                    const catName = String(it.categoryName || it.foodCategory?.name || it.category?.name || it.foodCategory || it.category || "").toLowerCase().trim();
                    const itemName = String(it.name || "").toLowerCase().trim();

                    if (allowedKeys.some(k => k === catId || k === catName || (catName && catName.includes(k)) || (k && catName && k.includes(catName)) || (itemName && itemName.includes(k)))) {
                        if (itemId) matchingItemIds.add(itemId);
                        if (foodItemId) matchingItemIds.add(foodItemId);
                        if (baseId) matchingItemIds.add(baseId);
                    }
                });

                if (matchingItemIds.size === 0) {
                    throw new ApiError(`Coupon "${coupon.code}" is only valid for items in "${applicableCategoryName || "specific"}" category not present in your cart.`, 400);
                }

                matchingProductSubtotal = items.reduce((sum: number, it: any) => {
                    const itemId = String(it.id || "").toLowerCase();
                    const foodItemId = String(it.foodItemId || "").toLowerCase();
                    const baseId = itemId.includes("_") ? itemId.split("_")[0] : itemId;
                    if (matchingItemIds.has(itemId) || matchingItemIds.has(foodItemId) || matchingItemIds.has(baseId)) {
                        return sum + (Number(it.price) || 0) * (Number(it.quantity || it.qty || 1));
                    }
                    return sum;
                }, 0);

                if (matchingProductSubtotal <= 0) {
                    throw new ApiError(`Coupon "${coupon.code}" is only valid for items in "${applicableCategoryName || "specific"}" category not present in your cart.`, 400);
                }

                matchingItemIdsList = Array.from(matchingItemIds);
            } else {
                const matchingItems = items.filter((it: any) => {
                    const itemId = String(it.id || "").toLowerCase();
                    const foodItemId = String(it.foodItemId || "").toLowerCase();
                    const baseId = itemId.includes("_") ? itemId.split("_")[0] : itemId;
                    const name = String(it.name || "").toLowerCase().trim();
                    return allowedKeys.some(k => k === itemId || k === foodItemId || k === baseId || k === name);
                });
                if (matchingItems.length === 0) {
                    throw new ApiError(`Coupon "${coupon.code}" is only valid on specific items not present in your cart.`, 400);
                }
                matchingProductSubtotal = matchingItems.reduce((sum: number, it: any) => {
                    return sum + (Number(it.price) || 0) * (Number(it.quantity || it.qty || 1));
                }, 0);
                matchingItemIdsList = matchingItems.map((it: any) => String(it.foodItemId || it.id).toLowerCase());
            }
        }
    }

    // Resolve effective user context
    const cleanUserId = (userId && userId !== "none" && userId !== "all" && userId !== "null" && userId !== "undefined" && userId.trim() !== "") ? userId.trim() : null;
    let effectiveUserId: string | null = cleanUserId;
    if (!effectiveUserId) {
        try {
            const session = await getAuthSession();
            effectiveUserId = session?.user?.id || null;
        } catch {
            effectiveUserId = null;
        }
    }

    // Check customer eligibility (NEW_ONLY)
    if (coupon.customerEligibility === "NEW_ONLY" && effectiveUserId) {
        const previousOrdersCount = await db.order.count({
            where: {
                userId: effectiveUserId,
                status: { not: "CANCELLED" }
            }
        });
        if (previousOrdersCount > 0) {
            throw new ApiError(`Coupon "${coupon.code}" is exclusively for new users on their first order.`, 400);
        }
    }

    // Check per-user limit
    const userLimit = coupon.perUserLimit || coupon.maxUsagesPerUser;
    if (userLimit && effectiveUserId) {
        const usageCount = await db.order.count({
            where: {
                userId: effectiveUserId,
                OR: [
                    { appliedCouponId: coupon.id },
                    { appliedCouponId: coupon.code }
                ],
                status: { not: "CANCELLED" }
            }
        });
        if (usageCount >= userLimit) {
            throw new ApiError(`You have already used coupon "${coupon.code}".`, 400);
        }
    }

    // Calculate discount
    const isPercentage = coupon.discountType === "PERCENTAGE" || (coupon.discountPercentage && !coupon.discountAmount);
    let calculatedDiscount = 0;
    let discountLabel = "";
    const baseDiscountSubtotal = (coupon.appliesToProductId && matchingProductSubtotal > 0) ? matchingProductSubtotal : numSubtotal;

    if (isPercentage) {
        const pct = coupon.discountPercentage || 0;
        calculatedDiscount = Math.round((baseDiscountSubtotal * pct) / 100);
        if (coupon.maxDiscountAmount && calculatedDiscount > coupon.maxDiscountAmount) {
            calculatedDiscount = coupon.maxDiscountAmount;
        }
        discountLabel = `${pct}% OFF`;
    } else {
        const flatAmt = coupon.discountAmount || 0;
        if (flatAmt > 0 && numSubtotal < flatAmt) {
            throw new ApiError(`Coupon "${coupon.code}" provides a ₹${flatAmt} discount and requires an order total of at least ₹${flatAmt}. (Your cart is ₹${numSubtotal})`, 400);
        }
        calculatedDiscount = Math.min(flatAmt, baseDiscountSubtotal);
        discountLabel = `₹${flatAmt} OFF`;
    }

    return {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: isPercentage ? "PERCENTAGE" : "FLAT",
        discountPercentage: isPercentage ? (coupon.discountPercentage || 0) : null,
        discountAmount: !isPercentage ? (coupon.discountAmount || 0) : null,
        maxDiscountAmount: coupon.maxDiscountAmount,
        minimumCartValue: coupon.minimumCartValue || 0,
        appliesToProductId: coupon.appliesToProductId || null,
        appliesTo: coupon.appliesTo || (coupon.appliesToProductId ? "ITEMS" : "ALL"),
        appliesToSellerId: coupon.appliesToSellerId || null,
        applicableCategoryName,
        matchingProductSubtotal,
        matchingItemIds: matchingItemIdsList,
        calculatedDiscount,
        discountLabel,
        isAutoApply: Boolean(coupon.isAutoApply),
        message: `Coupon "${coupon.code}" applied! (${discountLabel})`
    };
};
