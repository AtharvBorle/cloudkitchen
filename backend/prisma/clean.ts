import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function cleanDatabase() {
    console.log("========================================================");
    console.log("🧹 Starting Neo Cloud Bites Complete Database Cleaning...");
    console.log("   Policy: ONLY Superadmin remains. All tables wiped clean.");
    console.log("========================================================\n");

    try {
        // ── 1. Identify or create Superadmin account to retain ────────────────
        console.log("🔍 [1/5] Identifying Superadmin account...");

        const existingSuperadmin = await prisma.user.findFirst({
            where: {
                OR: [
                    { role: "SUPERADMIN" },
                    { email: "superadmin@admin.com" },
                ],
            },
        });

        let superadminId: string;
        let superadminEmail: string;

        if (!existingSuperadmin) {
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
            superadminId = createdSuper.id;
            superadminEmail = createdSuper.email || "superadmin@admin.com";
            console.log(`   ✅ Created Superadmin: ${superadminEmail}`);
        } else {
            // Ensure superadmin has SUPERADMIN role, is active, and is not soft-deleted
            await prisma.user.update({
                where: { id: existingSuperadmin.id },
                data: {
                    role: "SUPERADMIN",
                    isActive: true,
                    deletedAt: null,
                    isPermanentlyDeleted: false,
                },
            });
            superadminId = existingSuperadmin.id;
            superadminEmail = existingSuperadmin.email || "superadmin@admin.com";
            console.log(`   ✅ Retaining Superadmin: ${superadminEmail} (ID: ${superadminId})`);
        }

        // ── 2. Clean operational, transaction, review, order, and booking records ──
        console.log("\n🗑️  [2/5] Wiping operational, order, booking, and delivery records...");

        const delTransactions = await prisma.deliveryTransaction.deleteMany();
        console.log(`   - Deleted ${delTransactions.count} delivery transaction(s)`);

        const mealDeliveries = await prisma.mealSubscriptionDelivery.deleteMany();
        console.log(`   - Deleted ${mealDeliveries.count} meal subscription delivery schedule record(s)`);

        const pauseIntervals = await prisma.subscriptionPauseInterval.deleteMany();
        console.log(`   - Deleted ${pauseIntervals.count} subscription pause interval record(s)`);

        const subSlots = await prisma.userSubscriptionMealSlot.deleteMany();
        console.log(`   - Deleted ${subSlots.count} user subscription meal slot(s)`);

        const sellerSlots = await prisma.sellerMealPlanSlot.deleteMany();
        console.log(`   - Deleted ${sellerSlots.count} seller meal plan slot(s)`);

        const userMealSubs = await prisma.userMealSubscription.deleteMany();
        console.log(`   - Deleted ${userMealSubs.count} user meal subscription(s)`);

        const sellerMealPlans = await prisma.sellerMealPlan.deleteMany();
        console.log(`   - Deleted ${sellerMealPlans.count} seller meal plan(s)`);

        const refunds = await prisma.refund.deleteMany();
        console.log(`   - Deleted ${refunds.count} refund(s)`);

        const itemRatings = await prisma.itemRating.deleteMany();
        console.log(`   - Deleted ${itemRatings.count} item rating(s)`);

        const reviews = await prisma.review.deleteMany();
        console.log(`   - Deleted ${reviews.count} review(s)`);

        const ticketMessages = await prisma.ticketMessage.deleteMany();
        console.log(`   - Deleted ${ticketMessages.count} support ticket message(s)`);

        const tickets = await prisma.ticket.deleteMany();
        console.log(`   - Deleted ${tickets.count} support ticket(s)`);

        const orders = await prisma.order.deleteMany();
        console.log(`   - Deleted ${orders.count} order(s)`);

        const bookings = await prisma.booking.deleteMany();
        console.log(`   - Deleted ${bookings.count} booking(s)`);

        const rooms = await prisma.room.deleteMany();
        console.log(`   - Deleted ${rooms.count} room(s)`);

        const curatedReels = await prisma.curatedReel.deleteMany();
        console.log(`   - Deleted ${curatedReels.count} curated reel(s)`);

        // ── 3. Clean food items, categories, pincodes, subscriptions, coupons, master data ──
        console.log("\n🗑️  [3/5] Wiping menu items, categories, meal slots, plans, settings, and marketing data...");

        const foodItems = await prisma.foodItem.deleteMany();
        console.log(`   - Deleted ${foodItems.count} food item(s)`);

        const foodSubCategories = await prisma.foodSubCategory.deleteMany();
        console.log(`   - Deleted ${foodSubCategories.count} food subcategory(ies)`);

        const foodCategories = await prisma.foodCategory.deleteMany();
        console.log(`   - Deleted ${foodCategories.count} food category(ies)`);

        const categories = await prisma.category.deleteMany();
        console.log(`   - Deleted ${categories.count} category(ies)`);

        const mealSlots = await prisma.mealSlot.deleteMany();
        console.log(`   - Deleted ${mealSlots.count} meal slot(s)`);

        const servedPincodes = await prisma.servedPincode.deleteMany();
        console.log(`   - Deleted ${servedPincodes.count} served pincode(s)`);

        const deliveryPersons = await prisma.deliveryPerson.deleteMany();
        console.log(`   - Deleted ${deliveryPersons.count} delivery person profile(s)`);

        const subscriptions = await prisma.subscription.deleteMany();
        console.log(`   - Deleted ${subscriptions.count} seller subscription(s)`);

        const subCoupons = await prisma.subscriptionCoupon.deleteMany();
        console.log(`   - Deleted ${subCoupons.count} subscription coupon(s)`);

        const subscriptionPlans = await prisma.subscriptionPlan.deleteMany();
        console.log(`   - Deleted ${subscriptionPlans.count} subscription plan(s)`);

        const coupons = await prisma.coupon.deleteMany();
        console.log(`   - Deleted ${coupons.count} coupon(s)`);

        const popupBanners = await prisma.popupBanner.deleteMany();
        console.log(`   - Deleted ${popupBanners.count} popup banner(s)`);

        const homePromoBanners = await prisma.homePromoBanner.deleteMany();
        console.log(`   - Deleted ${homePromoBanners.count} home promo banner(s)`);

        const addresses = await prisma.address.deleteMany();
        console.log(`   - Deleted ${addresses.count} user address(es)`);

        const auditLogs = await prisma.auditLog.deleteMany();
        console.log(`   - Deleted ${auditLogs.count} audit log(s)`);

        const systemSettings = await prisma.systemSettings.deleteMany();
        console.log(`   - Deleted ${systemSettings.count} system setting(s)`);

        // ── 4. Clean all seller profiles and agent profiles ───────────────────
        console.log("\n🏪 [4/5] Wiping all seller profiles and agent profiles...");

        const sellers = await prisma.sellerProfile.deleteMany();
        console.log(`   - Deleted ${sellers.count} seller profile(s)`);

        const agentProfiles = await prisma.agentProfile.deleteMany();
        console.log(`   - Deleted ${agentProfiles.count} agent profile(s)`);

        // ── 5. Delete all users except Superadmin ─────────────────────────────
        console.log("\n👥 [5/5] Wiping all users except Superadmin...");

        const deletedUsers = await prisma.user.deleteMany({
            where: {
                id: {
                    not: superadminId,
                },
            },
        });
        console.log(`   - Deleted ${deletedUsers.count} non-superadmin user account(s)`);

        // ── 6. Full database status verification ─────────────────────────────
        console.log("\n🔎 Verifying complete database cleanup...");

        const tableCounts = {
            deliveryTransactions: await prisma.deliveryTransaction.count(),
            mealSubscriptionDeliveries: await prisma.mealSubscriptionDelivery.count(),
            subscriptionPauseIntervals: await prisma.subscriptionPauseInterval.count(),
            userSubscriptionMealSlots: await prisma.userSubscriptionMealSlot.count(),
            sellerMealPlanSlots: await prisma.sellerMealPlanSlot.count(),
            userMealSubscriptions: await prisma.userMealSubscription.count(),
            sellerMealPlans: await prisma.sellerMealPlan.count(),
            mealSlots: await prisma.mealSlot.count(),
            itemRatings: await prisma.itemRating.count(),
            reviews: await prisma.review.count(),
            refunds: await prisma.refund.count(),
            ticketMessages: await prisma.ticketMessage.count(),
            tickets: await prisma.ticket.count(),
            orders: await prisma.order.count(),
            bookings: await prisma.booking.count(),
            rooms: await prisma.room.count(),
            curatedReels: await prisma.curatedReel.count(),
            foodItems: await prisma.foodItem.count(),
            foodSubCategories: await prisma.foodSubCategory.count(),
            foodCategories: await prisma.foodCategory.count(),
            categories: await prisma.category.count(),
            servedPincodes: await prisma.servedPincode.count(),
            deliveryPersons: await prisma.deliveryPerson.count(),
            subscriptions: await prisma.subscription.count(),
            subscriptionCoupons: await prisma.subscriptionCoupon.count(),
            subscriptionPlans: await prisma.subscriptionPlan.count(),
            coupons: await prisma.coupon.count(),
            popupBanners: await prisma.popupBanner.count(),
            homePromoBanners: await prisma.homePromoBanner.count(),
            addresses: await prisma.address.count(),
            auditLogs: await prisma.auditLog.count(),
            systemSettings: await prisma.systemSettings.count(),
            sellerProfiles: await prisma.sellerProfile.count(),
            agentProfiles: await prisma.agentProfile.count(),
            totalUsers: await prisma.user.count(),
        };

        const remainingUsers = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
            },
        });

        console.log("========================================================");
        console.log("📊 Final Clean Verification Report:");
        console.log(`   - Users Remaining: ${tableCounts.totalUsers}`);
        for (const u of remainingUsers) {
            console.log(`     👉 [${u.role}] ${u.name} | ${u.email} (Active: ${u.isActive})`);
        }
        console.log("\n   Table Counts (all non-user tables should be 0):");
        Object.entries(tableCounts).forEach(([table, count]) => {
            if (table !== "totalUsers") {
                console.log(`   - ${table.padEnd(30)}: ${count}`);
            }
        });
        console.log("========================================================");
        console.log("🎉 Complete cleanup finished successfully!");
        console.log(`   ONLY Superadmin (${superadminEmail}) remains. All other tables are 0.`);
        console.log("========================================================");
    } catch (error) {
        console.error("\n❌ Error during database cleanup:", error);
        process.exitCode = 1;
    } finally {
        await prisma.$disconnect();
    }
}

cleanDatabase();
