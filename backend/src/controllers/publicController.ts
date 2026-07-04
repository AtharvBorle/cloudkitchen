import { db } from "@/lib/db";
import { PrismaClient } from "@prisma/client";
import { unstable_cache } from "next/cache";

const prisma = new PrismaClient();

export const getPublicCategories = unstable_cache(
    async () => {
        const categories = await db.category.findMany({
            orderBy: { name: 'asc' }
        });

        return { categories };
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
                foodItems: {
                    where: { isAvailable: true },
                    include: {
                        category: true,
                        foodCategory: true
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

        const foodItems = sellers.flatMap(seller => {
            const hasActiveFoodSub = seller.subscriptions.some(sub => 
                sub.status === "ACTIVE" && 
                (sub.validUntil === null || new Date(sub.validUntil) > now) &&
                (sub.plan?.category === "FOOD" || sub.plan?.category === "BOTH")
            );
            if (!hasActiveFoodSub) return [];
            return seller.foodItems.map(item => ({
                ...item,
                sellerName: seller.businessName || seller.user.name,
                sellerCity: seller.user.city,
                sellerPincode: seller.user.pincode,
                sellerLocality: seller.addressLocality,
                sellerLandmark: seller.addressLandmark,
                sellerTrackingId: seller.trackingId,
                sellerIsOnline: seller.isOnline,
                sellerFoodType: seller.foodType
            }));
        });

        const availableRooms = sellers.flatMap(seller => {
            const hasActivePropertySub = seller.subscriptions.some(sub => 
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

        return { foodItems, availableRooms, foodCategories };
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
            return c.category === sellerCategory;
        });

        const safeCoupons = filteredCoupons.map((c: any) => ({
            id: c.id,
            code: c.code,
            description: c.description,
            discountPercentage: c.discountPercentage,
            discountAmount: c.discountAmount,
            minimumCartValue: c.minimumCartValue,
            maxUsagesPerUser: c.maxUsagesPerUser,
            maxUsers: c.maxUsers,
            currentUsersCount: c.currentUsersCount
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
