import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

import bcrypt from "bcryptjs";

async function check() {
    const sellers = await prisma.sellerProfile.findMany({
        include: {
            user: true,
            subscriptions: { include: { plan: true } },
            foodItems: true,
            rooms: true,
            orders: true,
            deliveryPersons: true,
        },
    });

    console.log("Found", sellers.length, "sellers:");
    for (const s of sellers) {
        console.log({
            id: s.id,
            email: s.user.email,
            businessName: s.businessName,
            trackingId: s.trackingId,
            verificationStatus: s.verificationStatus,
            foodVerificationStatus: s.foodVerificationStatus,
            propertyVerificationStatus: s.propertyVerificationStatus,
            foodItemsCount: s.foodItems.length,
            roomsCount: s.rooms.length,
            ordersCount: s.orders.length,
            deliveryPersonsCount: s.deliveryPersons.length,
            subscriptionsCount: s.subscriptions.length,
        });
    }
}

check()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
