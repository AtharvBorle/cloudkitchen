import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function cleanDatabase() {
    console.log("========================================================");
    console.log("🧹 Starting Neo Cloud Bites Database Cleaning...");
    console.log("   Policy: Only Superadmin and Application Manager remain.");
    console.log("========================================================\n");

    try {
        // ── 1. Identify Superadmin and Application Manager accounts to retain ──
        console.log("🔍 [1/6] Identifying Superadmin and Application Manager accounts...");

        const preservedUsers = await prisma.user.findMany({
            where: {
                OR: [
                    { role: "SUPERADMIN" },
                    { role: "AGENT" },
                    { role: "APPLICATION_MANAGER" },
                    { role: "ADMIN" },
                    { email: "superadmin@admin.com" },
                    { email: "agent@domain.com" },
                ],
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            },
        });

        const preservedUserIds = new Set(preservedUsers.map((u) => u.id));

        console.log(`   Found ${preservedUsers.length} existing admin/manager account(s) to preserve:`);
        for (const u of preservedUsers) {
            console.log(`   - [${u.role}] ${u.name} (${u.email})`);
        }

        // ── 2. Ensure default Superadmin exists if not present ────────────────
        let superadmin = preservedUsers.find(
            (u) => u.role === "SUPERADMIN" || u.email === "superadmin@admin.com"
        );
        if (!superadmin) {
            console.log("   ⚠️ Superadmin account not found. Creating default Superadmin...");
            const defaultHash = await bcrypt.hash("password123", 10);
            const createdSuper = await prisma.user.create({
                data: {
                    email: "superadmin@admin.com",
                    passwordHash: defaultHash,
                    role: "SUPERADMIN",
                    name: "System Admin",
                    phone: "1234567890",
                    city: "Global",
                    pincode: "000000",
                    isActive: true,
                },
            });
            preservedUserIds.add(createdSuper.id);
            console.log(`   ✅ Created Superadmin: ${createdSuper.email}`);
        } else {
            // Ensure superadmin is active and not deleted
            await prisma.user.update({
                where: { id: superadmin.id },
                data: {
                    isActive: true,
                    deletedAt: null,
                    isPermanentlyDeleted: false,
                },
            });
        }

        // ── 3. Ensure default Application Manager exists if not present ───────
        let appManager = preservedUsers.find(
            (u) =>
                u.role === "AGENT" ||
                u.role === "APPLICATION_MANAGER" ||
                u.role === "ADMIN" ||
                u.email === "agent@domain.com"
        );
        if (!appManager) {
            console.log("   ⚠️ Application Manager account not found. Creating default Application Manager...");
            const defaultHash = await bcrypt.hash("password123", 10);
            const createdAgent = await prisma.user.create({
                data: {
                    email: "agent@domain.com",
                    passwordHash: defaultHash,
                    role: "AGENT",
                    name: "Application Manager",
                    phone: "0987654321",
                    city: "Pune",
                    pincode: "411001",
                    isActive: true,
                    agentProfile: {
                        create: {
                            canManageOffers: true,
                            canManageBanners: true,
                        },
                    },
                },
            });
            preservedUserIds.add(createdAgent.id);
            console.log(`   ✅ Created Application Manager: ${createdAgent.email}`);
        } else {
            // Ensure Application Manager is active and not deleted
            await prisma.user.update({
                where: { id: appManager.id },
                data: {
                    isActive: true,
                    deletedAt: null,
                    isPermanentlyDeleted: false,
                },
            });

            // Ensure AgentProfile exists for Application Manager
            const existingProfile = await prisma.agentProfile.findUnique({
                where: { userId: appManager.id },
            });
            if (!existingProfile) {
                await prisma.agentProfile.create({
                    data: {
                        userId: appManager.id,
                        canManageOffers: true,
                        canManageBanners: true,
                    },
                });
                console.log(`   ✅ Ensured AgentProfile for Application Manager: ${appManager.email}`);
            }
        }

        // ── 4. Clean operational, subscription, and delivery records ──────────
        console.log("\n🗑️  [2/6] Deleting operational, subscription, and delivery records...");

        // 4.1 Delivery transactions & deliveries
        const delTransactions = await prisma.deliveryTransaction.deleteMany();
        console.log(`   - Deleted ${delTransactions.count} delivery transaction(s)`);

        const mealDeliveries = await prisma.mealSubscriptionDelivery.deleteMany();
        console.log(`   - Deleted ${mealDeliveries.count} meal subscription delivery schedule record(s)`);

        const pauseIntervals = await prisma.subscriptionPauseInterval.deleteMany();
        console.log(`   - Deleted ${pauseIntervals.count} subscription pause interval record(s)`);

        const subSlots = await prisma.userSubscriptionMealSlot.deleteMany();
        console.log(`   - Deleted ${subSlots.count} user subscription meal slot(s)`);

        const userMealSubs = await prisma.userMealSubscription.deleteMany();
        console.log(`   - Deleted ${userMealSubs.count} user meal subscription(s)`);

        const planSlots = await prisma.sellerMealPlanSlot.deleteMany();
        console.log(`   - Deleted ${planSlots.count} seller meal plan slot(s)`);

        const sellerMealPlans = await prisma.sellerMealPlan.deleteMany();
        console.log(`   - Deleted ${sellerMealPlans.count} seller meal plan(s)`);

        // 4.2 Refunds, Reviews, Ratings, Bookings, Orders
        const refunds = await prisma.refund.deleteMany();
        console.log(`   - Deleted ${refunds.count} refund(s)`);

        const itemRatings = await prisma.itemRating.deleteMany();
        console.log(`   - Deleted ${itemRatings.count} item rating(s)`);

        const reviews = await prisma.review.deleteMany();
        console.log(`   - Deleted ${reviews.count} review(s)`);

        const orders = await prisma.order.deleteMany();
        console.log(`   - Deleted ${orders.count} order(s)`);

        const bookings = await prisma.booking.deleteMany();
        console.log(`   - Deleted ${bookings.count} booking(s)`);

        const rooms = await prisma.room.deleteMany();
        console.log(`   - Deleted ${rooms.count} room(s)`);

        // 4.3 Support Tickets & Messages
        const ticketMessages = await prisma.ticketMessage.deleteMany();
        console.log(`   - Deleted ${ticketMessages.count} support ticket message(s)`);

        const tickets = await prisma.ticket.deleteMany();
        console.log(`   - Deleted ${tickets.count} support ticket(s)`);

        // 4.4 Food items, Delivery personnel, Served Pincodes
        const foodItems = await prisma.foodItem.deleteMany();
        console.log(`   - Deleted ${foodItems.count} food item(s)`);

        const deliveryPersons = await prisma.deliveryPerson.deleteMany();
        console.log(`   - Deleted ${deliveryPersons.count} delivery person profile(s)`);

        const servedPincodes = await prisma.servedPincode.deleteMany();
        console.log(`   - Deleted ${servedPincodes.count} served pincode(s)`);

        // 4.5 Subscriptions, Coupons, Popups, Banners, Reels, Addresses, Audit Logs
        const subscriptions = await prisma.subscription.deleteMany();
        console.log(`   - Deleted ${subscriptions.count} seller subscription(s)`);

        const subCoupons = await prisma.subscriptionCoupon.deleteMany();
        console.log(`   - Deleted ${subCoupons.count} subscription coupon(s)`);

        const coupons = await prisma.coupon.deleteMany();
        console.log(`   - Deleted ${coupons.count} coupon(s)`);

        const popupBanners = await prisma.popupBanner.deleteMany();
        console.log(`   - Deleted ${popupBanners.count} popup banner(s)`);

        const curatedReels = await prisma.curatedReel.deleteMany();
        console.log(`   - Deleted ${curatedReels.count} curated reel(s)`);

        const addresses = await prisma.address.deleteMany();
        console.log(`   - Deleted ${addresses.count} user address(es)`);

        const auditLogs = await prisma.auditLog.deleteMany();
        console.log(`   - Deleted ${auditLogs.count} audit log(s)`);

        // ── 5. Delete all SellerProfiles ───────────────────────────────────────
        console.log("\n🏪 [3/6] Deleting seller profiles...");
        const sellers = await prisma.sellerProfile.deleteMany();
        console.log(`   - Deleted ${sellers.count} seller profile(s)`);

        // ── 6. Delete all users except Superadmin and Application Manager ─────
        console.log("\n👥 [4/6] Deleting non-admin users (customers, sellers, delivery executives, staff)...");
        const deletedUsers = await prisma.user.deleteMany({
            where: {
                id: {
                    notIn: Array.from(preservedUserIds),
                },
            },
        });
        console.log(`   - Deleted ${deletedUsers.count} user account(s)`);

        // ── 7. Verify remaining users in the database ─────────────────────────
        console.log("\n🔎 [5/6] Verifying remaining database state...");
        const remainingUsers = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
        });

        console.log(`   Total Users Remaining: ${remainingUsers.length}`);
        remainingUsers.forEach((u, idx) => {
            console.log(`   ${idx + 1}. [${u.role}] ${u.name} | ${u.email} (Active: ${u.isActive})`);
        });

        // ── 8. Verify master data tables are preserved ─────────────────────────
        const masterCounts = {
            mealSlots: await prisma.mealSlot.count(),
            categories: await prisma.category.count(),
            foodCategories: await prisma.foodCategory.count(),
            foodSubCategories: await prisma.foodSubCategory.count(),
            subscriptionPlans: await prisma.subscriptionPlan.count(),
            systemSettings: await prisma.systemSettings.count(),
            homePromoBanners: await prisma.homePromoBanner.count(),
        };

        console.log("\n📊 [6/6] Master Data Status (Preserved):");
        console.log(`   - Canonical Meal Slots:    ${masterCounts.mealSlots}`);
        console.log(`   - Categories:              ${masterCounts.categories}`);
        console.log(`   - Food Categories:         ${masterCounts.foodCategories}`);
        console.log(`   - Food Subcategories:      ${masterCounts.foodSubCategories}`);
        console.log(`   - Subscription Plans:      ${masterCounts.subscriptionPlans}`);
        console.log(`   - System Settings:         ${masterCounts.systemSettings}`);
        console.log(`   - Home Promo Banners:      ${masterCounts.homePromoBanners}`);

        console.log("\n========================================================");
        console.log("🎉 Database cleanup completed successfully!");
        console.log("   Only Superadmin and Application Manager remain.");
        console.log("========================================================");
    } catch (error) {
        console.error("\n❌ Error during database cleanup:", error);
        process.exitCode = 1;
    } finally {
        await prisma.$disconnect();
    }
}

cleanDatabase();
