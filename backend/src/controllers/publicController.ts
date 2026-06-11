import { db } from "@/lib/db";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getPublicCategories = async () => {
    const categories = await db.category.findMany({
        orderBy: { name: 'asc' }
    });

    return { categories };
};

export const getPublicExploreData = async () => {
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
                where: { isAvailable: true }
            },
            rooms: {
                where: { isAvailable: true }
            }
        }
    });

    const foodItems = sellers.flatMap(seller =>
        seller.foodItems.map(item => ({
            ...item,
            sellerName: seller.businessName || seller.user.name,
            sellerCity: seller.user.city,
            sellerTrackingId: seller.trackingId,
            sellerIsOnline: seller.isOnline
        }))
    );

    const availableRooms = sellers.flatMap(seller =>
        seller.rooms.map(room => ({
            ...room,
            sellerName: seller.businessName || seller.user.name,
            sellerCity: seller.user.city,
            sellerTrackingId: seller.trackingId,
            sellerIsOnline: seller.isOnline
        }))
    );

    return { foodItems, availableRooms };
};

export const getPublicRoomAvailability = async (id: string) => {
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
};

export const getPublicCoupons = async (sellerId: string | null) => {
    if (!sellerId) {
        throw new Error("sellerId is required");
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

    const safeCoupons = activeCoupons.map((c: any) => ({
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
};

export const getPublicPopupBanners = async (sellerId: string | null) => {
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
};
