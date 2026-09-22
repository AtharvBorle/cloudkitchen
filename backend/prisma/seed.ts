import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Init client directly with standard adapter config
const prisma = new PrismaClient();

async function main() {
    console.log("Starting DB Seed...");

    const hashPassword = await bcrypt.hash("password123", 10);

    // 1. Superadmin
    const admin = await prisma.user.upsert({
        where: { email: "superadmin@admin.com" },
        update: {
            passwordHash: hashPassword,
            role: "SUPERADMIN",
            isActive: true,
        },
        create: {
            email: "superadmin@admin.com",
            passwordHash: hashPassword,
            role: "SUPERADMIN",
            name: "System Admin",
            phone: "1234567890",
            city: "Global",
            pincode: "000000",
            isActive: true,
        },
    });
    console.log("Seeded Superadmin:", admin.email);

    // 2. Agent
    const agentUser = await prisma.user.upsert({
        where: { email: "agent@domain.com" },
        update: {
            passwordHash: hashPassword,
            role: "AGENT",
            isActive: true,
        },
        create: {
            email: "agent@domain.com",
            passwordHash: hashPassword,
            role: "AGENT",
            name: "Operation Agent 1",
            phone: "0987654321",
            city: "Pune",
            pincode: "411001",
            isActive: true,
            agentProfile: {
                create: {}
            }
        },
    });
    console.log("Seeded Agent:", agentUser.email);

    // 3. Seller (Approved)
    const sellerUser = await prisma.user.upsert({
        where: { email: "seller@domain.com" },
        update: {
            passwordHash: hashPassword,
            role: "SELLER",
            isActive: true,
        },
        create: {
            email: "seller@domain.com",
            passwordHash: hashPassword,
            role: "SELLER",
            name: "Radha's Kitchen",
            phone: "1122334455",
            city: "Pune",
            pincode: "411028",
            isActive: true,
            sellerProfile: {
                create: {
                    type: "HOMELY_FOOD",
                    adhaarUrl: "fake-url",
                    trackingId: "TRK-SEED-01",
                    verificationStatus: "APPROVED",
                    businessName: "Radha's Kitchen Base"
                }
            }
        },
    });
    console.log("Seeded Approved Seller:", sellerUser.email);

    // 3.5 Seller (Pending)
    const pendingSellerUser = await prisma.user.upsert({
        where: { email: "pending_seller@domain.com" },
        update: {
            passwordHash: hashPassword,
            role: "SELLER",
            isActive: true,
        },
        create: {
            email: "pending_seller@domain.com",
            passwordHash: hashPassword,
            role: "SELLER",
            name: "Rahul's Bakery",
            phone: "9988776655",
            city: "Mumbai",
            pincode: "400001",
            isActive: true,
            sellerProfile: {
                create: {
                    type: "BAKERY",
                    adhaarUrl: "fake-url-2",
                    trackingId: "TRK-SEED-02",
                    verificationStatus: "PENDING",
                    businessName: "Rahul's Fresh Bakes"
                }
            }
        },
    });
    console.log("Seeded Pending Seller:", pendingSellerUser.email);

    // 4. Customer
    const customerUser = await prisma.user.upsert({
        where: { email: "customer@domain.com" },
        update: {
            passwordHash: hashPassword,
            role: "USER",
            isActive: true,
        },
        create: {
            email: "customer@domain.com",
            passwordHash: hashPassword,
            role: "USER",
            name: "John Customer",
            phone: "5544332211",
            city: "Pune",
            pincode: "411028",
            isActive: true,
        },
    });
    console.log("Seeded Customer:", customerUser.email);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
