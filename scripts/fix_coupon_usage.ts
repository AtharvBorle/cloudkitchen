import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Recalculating correct usage counts for all coupons...");

    // Get all active subscriptions that used a coupon
    const subscriptions = await prisma.subscription.findMany({
        where: {
            appliedCoupon: {
                not: null
            }
        }
    });

    // Count usages per coupon
    const couponCounts: Record<string, number> = {};
    for (const sub of subscriptions) {
        if (sub.appliedCoupon) {
            const code = sub.appliedCoupon.toUpperCase();
            couponCounts[code] = (couponCounts[code] || 0) + 1;
        }
    }

    // Update logic: reset all first, then apply exactly the found counts
    await prisma.subscriptionCoupon.updateMany({
        data: {
            currentUsage: 0
        }
    });

    for (const [code, count] of Object.entries(couponCounts)) {
        try {
            await prisma.subscriptionCoupon.update({
                where: { code },
                data: { currentUsage: count }
            });
            console.log(`Updated coupon ${code} usage to ${count}`);
        } catch (e) {
            console.error(`Failed to update coupon ${code}:`, e);
        }
    }

    console.log("Successfully recalculated all past coupon usages.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
