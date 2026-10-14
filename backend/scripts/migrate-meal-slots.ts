import { db } from "../src/lib/db";
import { PREDEFINED_MEAL_SLOTS, normalizeMealSlotIds } from "../src/lib/meal-slots";

async function main() {
  console.log("🍱 Starting Meal Slots Migration & Seed...");

  // 1. Seed or update the 7 standardized MealSlot records
  for (const slot of PREDEFINED_MEAL_SLOTS) {
    await db.mealSlot.upsert({
      where: { id: slot.id },
      create: {
        id: slot.id,
        name: slot.name,
        subtitle: slot.subtitle,
        description: slot.description,
        defaultTimeRange: slot.defaultTimeRange,
        startHour: slot.startHour,
        startMinute: slot.startMinute,
        endHour: slot.endHour,
        endMinute: slot.endMinute,
        order: slot.order,
        isActive: true,
      },
      update: {
        name: slot.name,
        subtitle: slot.subtitle,
        description: slot.description,
        defaultTimeRange: slot.defaultTimeRange,
        startHour: slot.startHour,
        startMinute: slot.startMinute,
        endHour: slot.endHour,
        endMinute: slot.endMinute,
        order: slot.order,
        isActive: true,
      },
    });
    console.log(`  ✓ Slot [${slot.id}] ${slot.name} seeded`);
  }

  // 2. Migrate existing SellerMealPlan records
  const plans = await db.sellerMealPlan.findMany({
    include: { slots: true },
  });
  console.log(`Found ${plans.length} meal plans to migrate`);

  for (const plan of plans) {
    let rawTimings: any[] = [];
    try {
      rawTimings = typeof plan.mealTimings === "string" ? JSON.parse(plan.mealTimings) : (plan.mealTimings || []);
    } catch {
      rawTimings = [];
    }

    let slotIds = normalizeMealSlotIds(rawTimings);
    if (slotIds.length === 0) {
      // Default to Lunch if ambiguous or empty
      slotIds = ["lunch"];
    }

    for (const slotId of slotIds) {
      await db.sellerMealPlanSlot.upsert({
        where: {
          planId_slotId: {
            planId: plan.id,
            slotId: slotId,
          },
        },
        create: {
          planId: plan.id,
          slotId: slotId,
        },
        update: {},
      });
    }

    // Keep mealTimings field updated with canonical slot IDs
    await db.sellerMealPlan.update({
      where: { id: plan.id },
      data: {
        mealTimings: JSON.stringify(slotIds),
      },
    });
    console.log(`  ✓ Plan [${plan.name}] mapped to slots: ${slotIds.join(", ")}`);
  }

  // 3. Migrate existing UserMealSubscription records
  const subscriptions = await db.userMealSubscription.findMany({
    include: {
      plan: {
        include: { slots: true },
      },
      slots: true,
    },
  });
  console.log(`Found ${subscriptions.length} user subscriptions to migrate`);

  for (const sub of subscriptions) {
    // Get slots from plan
    const planSlotIds = sub.plan?.slots.map((s) => s.slotId) || ["lunch"];

    for (const slotId of planSlotIds) {
      await db.userSubscriptionMealSlot.upsert({
        where: {
          subscriptionId_slotId: {
            subscriptionId: sub.id,
            slotId: slotId,
          },
        },
        create: {
          subscriptionId: sub.id,
          slotId: slotId,
        },
        update: {},
      });
    }

    // Migrate any existing dailyDeliveries
    let existingDeliveries: any[] = [];
    try {
      existingDeliveries = typeof sub.dailyDeliveries === "string" ? JSON.parse(sub.dailyDeliveries) : (sub.dailyDeliveries || []);
    } catch {
      existingDeliveries = [];
    }

    for (const record of existingDeliveries) {
      const date = record.date || new Date().toISOString().split("T")[0];
      const status = record.status || "PENDING";
      const targetSlot = record.slotId ? (normalizeMealSlotIds([record.slotId])[0] || planSlotIds[0]) : planSlotIds[0];

      if (targetSlot) {
        await db.mealSubscriptionDelivery.upsert({
          where: {
            subscriptionId_scheduledDate_slotId: {
              subscriptionId: sub.id,
              scheduledDate: date,
              slotId: targetSlot,
            },
          },
          create: {
            subscriptionId: sub.id,
            slotId: targetSlot,
            sellerId: sub.sellerId,
            userId: sub.userId,
            scheduledDate: date,
            scheduledTime: record.scheduledTime || undefined,
            status: status,
            deliveredAt: record.markedAt ? new Date(record.markedAt) : undefined,
            markedBy: record.markedBy || undefined,
            note: record.note || undefined,
          },
          update: {
            status: status,
            deliveredAt: record.markedAt ? new Date(record.markedAt) : undefined,
            markedBy: record.markedBy || undefined,
            note: record.note || undefined,
          },
        });
      }
    }
    console.log(`  ✓ Sub [${sub.id}] mapped with ${planSlotIds.length} slots`);
  }

  console.log("✅ Meal Slots Migration & Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Migration error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
