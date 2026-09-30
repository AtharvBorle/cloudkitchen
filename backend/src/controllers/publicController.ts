import { db } from "@/lib/db";
import { PrismaClient } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { getPincodeCoordinates } from "@/lib/geo-distance";
import { ApiError } from "@/lib/api-error";

const prisma = new PrismaClient();

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
                : 4.8;

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
                reviewsCount,
                imageUrl: parsedKitchenImages[0] || seller.bannerImageUrl || "/images/places/place-pizza.png",
                isOnline: seller.isOnline,
                foodType: seller.foodType,
                servedPincodes: seller.servedPincodes.map(p => p.pincode),
            });

            return seller.foodItems.map(item => {
                const itemRatingCount = item.itemRatings?.length || 0;
                const itemAvgRating = itemRatingCount > 0
                    ? Number((item.itemRatings.reduce((acc: number, r: any) => acc + r.rating, 0) / itemRatingCount).toFixed(1))
                    : avgRating;

                return {
                    ...item,
                    rating: itemAvgRating,
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

export const getPublicCoupons = (sellerId: string | null) => unstable_cache(
    async () => {
        const cleanSellerId = (sellerId && sellerId !== "none" && sellerId !== "all" && sellerId !== "null" && sellerId !== "undefined") ? sellerId : null;
        let resolvedSellerId = cleanSellerId;
        let sellerCategory = "BOTH";
        if (cleanSellerId) {
            const seller = await prisma.sellerProfile.findFirst({
                where: {
                    OR: [
                        { id: cleanSellerId },
                        { trackingId: cleanSellerId },
                        { userId: cleanSellerId }
                    ]
                }
            });
            if (seller) {
                resolvedSellerId = seller.id;
                sellerCategory = seller.businessCategory || "BOTH";
            }
        }

        const now = new Date();

        const activeCoupons = await prisma.coupon.findMany({
            where: {
                isActive: true,
                approvalStatus: "APPROVED",
                ...(resolvedSellerId
                    ? {
                        OR: [
                            { appliesToSellerId: null },
                            { appliesToSellerId: resolvedSellerId },
                            ...(cleanSellerId && cleanSellerId !== resolvedSellerId ? [{ appliesToSellerId: cleanSellerId }] : [])
                        ]
                    }
                    : {}
                ),
                AND: [
                    {
                        OR: [
                            { validFrom: null },
                            { validFrom: { lte: now } }
                        ]
                    },
                    {
                        OR: [
                            { validUntil: null },
                            { validUntil: { gt: now } },
                            { noExpiry: true }
                        ]
                    }
                ]
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        const filteredCoupons = activeCoupons.filter((c: any) => {
            const cat = (c.category || "BOTH").toUpperCase();
            if (cat === "BOTH" || cat === "FOOD") return true;
            if (sellerCategory && (cat === sellerCategory || sellerCategory === "BOTH")) return true;
            return false;
        });

        const safeCoupons = filteredCoupons.map((c: any) => ({
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
            validUntil: c.validUntil
        }));

        return safeCoupons;
    },
    [`public-coupons-${sellerId || 'global'}`],
    { revalidate: 30, tags: ["coupons"] }
)();

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
    const now = new Date();

    const coupon = await prisma.coupon.findFirst({
        where: {
            code: { equals: cleanCode, mode: "insensitive" },
            isActive: true,
            approvalStatus: "APPROVED"
        }
    });

    if (!coupon) {
        throw new ApiError(`Coupon "${cleanCode}" is invalid or does not exist.`, 404);
    }

    // Check validity dates
    if (coupon.validFrom && new Date(coupon.validFrom) > now) {
        throw new ApiError(`Coupon "${coupon.code}" is not active yet.`, 400);
    }
    if (!coupon.noExpiry && coupon.validUntil && new Date(coupon.validUntil) < now) {
        throw new ApiError(`Coupon "${coupon.code}" has expired.`, 400);
    }

    // Check usage limits
    const totalLimit = coupon.usageLimit || coupon.maxUsers;
    if (totalLimit && coupon.currentUsersCount >= totalLimit) {
        throw new ApiError(`Coupon "${coupon.code}" has reached its maximum usage limit.`, 400);
    }

    // Check seller store restriction
    if (coupon.appliesToSellerId) {
        const couponSeller = await prisma.sellerProfile.findFirst({
            where: {
                OR: [
                    { id: coupon.appliesToSellerId },
                    { trackingId: coupon.appliesToSellerId }
                ]
            },
            select: { id: true, businessName: true }
        });

        // Resolve cart's seller
        let cartSeller: { id: string; businessName: string } | null = null;
        if (sellerId && sellerId !== "seller" && sellerId !== "k-1") {
            cartSeller = await prisma.sellerProfile.findFirst({
                where: {
                    OR: [
                        { id: sellerId },
                        { trackingId: sellerId }
                    ]
                },
                select: { id: true, businessName: true }
            });
        }

        // If cartSeller not found yet, check from cart items
        if (!cartSeller && Array.isArray(items) && items.length > 0) {
            const firstItemId = items[0].foodItemId || items[0].id;
            if (firstItemId) {
                const fi = await prisma.foodItem.findUnique({
                    where: { id: firstItemId },
                    include: { seller: { select: { id: true, businessName: true } } }
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

    // Check specific product appliesToProductId
    if (coupon.appliesToProductId && Array.isArray(items) && items.length > 0) {
        const hasMatchingProduct = items.some((it: any) => 
            it.id === coupon.appliesToProductId || 
            it.foodItemId === coupon.appliesToProductId
        );
        if (!hasMatchingProduct) {
            throw new ApiError(`Coupon "${coupon.code}" is only valid on specific items not present in your cart.`, 400);
        }
    }

    // Check customer eligibility
    if (coupon.customerEligibility === "NEW_ONLY" && userId) {
        const previousOrdersCount = await prisma.order.count({
            where: {
                userId: userId,
                status: { not: "CANCELLED" }
            }
        });
        if (previousOrdersCount > 0) {
            throw new ApiError(`Coupon "${coupon.code}" is exclusively for first-time customers.`, 400);
        }
    }

    // Calculate discount
    const isPercentage = coupon.discountType === "PERCENTAGE" || (coupon.discountPercentage && !coupon.discountAmount);
    let calculatedDiscount = 0;
    let discountLabel = "";

    if (isPercentage) {
        const pct = coupon.discountPercentage || 0;
        calculatedDiscount = Math.round((numSubtotal * pct) / 100);
        if (coupon.maxDiscountAmount && calculatedDiscount > coupon.maxDiscountAmount) {
            calculatedDiscount = coupon.maxDiscountAmount;
        }
        discountLabel = `${pct}% OFF`;
    } else {
        const flatAmt = coupon.discountAmount || 0;
        if (flatAmt > 0 && numSubtotal < flatAmt) {
            throw new ApiError(`Coupon "${coupon.code}" provides a ₹${flatAmt} discount and requires an order total of at least ₹${flatAmt}. (Your cart is ₹${numSubtotal})`, 400);
        }
        calculatedDiscount = Math.min(flatAmt, numSubtotal);
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
        calculatedDiscount,
        discountLabel,
        message: `Coupon "${coupon.code}" applied! (${discountLabel})`
    };
};
