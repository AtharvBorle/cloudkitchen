import { db } from "@/lib/db";
import { PrismaClient } from "@prisma/client";
import { unstable_cache } from "next/cache";

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
                    where: { isAvailable: true },
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

            activeSellersList.push({
                id: seller.id,
                name: seller.businessName || seller.user.name,
                trackingId: seller.trackingId,
                type: seller.type,
                city: seller.user.city,
                pincode: seller.user.pincode,
                locality: seller.addressLocality,
                landmark: seller.addressLandmark,
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
            return seller.rooms.map(room => ({
                ...room,
                sellerName: seller.businessName || seller.user.name,
                sellerCity: seller.user.city,
                sellerPincode: seller.user.pincode,
                sellerLocality: seller.addressLocality,
                sellerLandmark: seller.addressLandmark,
                sellerTrackingId: seller.trackingId,
                sellerIsOnline: seller.isOnline
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
        if (!sellerId) {
            throw new Error("sellerId is required");
        }

        let sellerCategory = "BOTH";
        if (sellerId) {
            const seller = await prisma.sellerProfile.findUnique({
                where: { id: sellerId }
            });
            if (seller) {
                sellerCategory = seller.businessCategory;
            }
        }

        const now = new Date();

        const activeCoupons = await prisma.coupon.findMany({
            where: {
                isActive: true,
                OR: [
                    { appliesToSellerId: null },
                    { appliesToSellerId: sellerId }
                ],
                AND: [
                    {
                        validFrom: { lte: now }
                    },
                    {
                        OR: [
                            { validUntil: null },
                            { validUntil: { gt: now } }
                        ]
                    }
                ]
            }
        });

        const filteredCoupons = activeCoupons.filter((c: any) => {
            return c.category === "BOTH" || c.category === sellerCategory;
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
    { revalidate: 60, tags: ["coupons"] }
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
