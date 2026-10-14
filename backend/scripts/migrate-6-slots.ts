import { db } from "../src/lib/db";
import { PREDEFINED_MEAL_SLOTS } from "../src/lib/meal-slots";

async function main() {
  console.log("🍱 Starting 6 Meal Slots Migration...");

  // 1. Ensure `morning_meal` exists in MealSlot
  const morningSlot = PREDEFINED_MEAL_SLOTS.find((s) => s.id === "morning_meal")!;
  await db.mealSlot.upsert({
    where: { id: "morning_meal" },
    create: {
      id: "morning_meal",
      name: morningSlot.name,
      subtitle: morningSlot.subtitle,
      description: morningSlot.description,
      defaultTimeRange: "",
      startHour: 10,
      startMinute: 30,
      endHour: 11,
      endMinute: 30,
      order: 2,
      isActive: true,
    },
    update: {
      name: morningSlot.name,
      subtitle: morningSlot.subtitle,
      description: morningSlot.description,
      defaultTimeRange: "",
      order: 2,
      isActive: true,
    },
  });

  // 2. Remap any references from `mid_morning_meal` and `mid_morning_snack` to `morning_meal`
  // Remap SellerMealPlanSlot
  const oldPlanSlots = await db.sellerMealPlanSlot.findMany({
    where: { slotId: { in: ["mid_morning_meal", "mid_morning_snack"] } },
  });
  for (const ps of oldPlanSlots) {
    const existingTarget = await db.sellerMealPlanSlot.findUnique({
      where: { planId_slotId: { planId: ps.planId, slotId: "morning_meal" } },
    });
    if (!existingTarget) {
      await db.sellerMealPlanSlot.create({
        data: { planId: ps.planId, slotId: "morning_meal" },
      });
    }
    await db.sellerMealPlanSlot.delete({ where: { id: ps.id } });
  }

  // Remap UserSubscriptionMealSlot
  const oldSubSlots = await db.userSubscriptionMealSlot.findMany({
    where: { slotId: { in: ["mid_morning_meal", "mid_morning_snack"] } },
  });
  for (const ss of oldSubSlots) {
    const existingTarget = await db.userSubscriptionMealSlot.findUnique({
      where: { subscriptionId_slotId: { subscriptionId: ss.subscriptionId, slotId: "morning_meal" } },
    });
    if (!existingTarget) {
      await db.userSubscriptionMealSlot.create({
        data: { subscriptionId: ss.subscriptionId, slotId: "morning_meal" },
      });
    }
    await db.userSubscriptionMealSlot.delete({ where: { id: ss.id } });
  }

  // Remap MealSubscriptionDelivery
  const oldDeliveries = await db.mealSubscriptionDelivery.findMany({
    where: { slotId: { in: ["mid_morning_meal", "mid_morning_snack"] } },
  });
  for (const d of oldDeliveries) {
    const existingTarget = await db.mealSubscriptionDelivery.findUnique({
      where: {
        subscriptionId_scheduledDate_slotId: {
          subscriptionId: d.subscriptionId,
          scheduledDate: d.scheduledDate,
          slotId: "morning_meal",
        },
      },
    });
    if (!existingTarget) {
      await db.mealSubscriptionDelivery.update({
        where: { id: d.id },
        data: { slotId: "morning_meal" },
      });
    } else {
      await db.mealSubscriptionDelivery.delete({ where: { id: d.id } });
    }
  }

  // 3. Delete obsolete slots from MealSlot
  await db.mealSlot.deleteMany({
    where: { id: { in: ["mid_morning_meal", "mid_morning_snack"] } },
  });

  // 4. Upsert the 6 active meal slots with empty defaultTimeRange
  for (const slot of PREDEFINED_MEAL_SLOTS) {
    await db.mealSlot.upsert({
      where: { id: slot.id },
      create: {
        id: slot.id,
        name: slot.name,
        subtitle: slot.subtitle,
        description: slot.description,
        defaultTimeRange: "",
        startHour: slot.startHour || 7,
        startMinute: slot.startMinute || 30,
        endHour: slot.endHour || 9,
        endMinute: slot.endMinute || 30,
        order: slot.order,
        isActive: true,
      },
      update: {
        name: slot.name,
        subtitle: slot.subtitle,
        description: slot.description,
        defaultTimeRange: "",
        order: slot.order,
        isActive: true,
      },
    });
    console.log(`  ✓ Slot [${slot.id}] ${slot.name} configured with order ${slot.order} (no default timing)`);
  }

  // Clear hardcoded defaults from systemSettings so timings must be added by user
  await db.systemSettings.upsert({
    where: { key: "MEAL_SUBSCRIPTION_SLOTS" },
    create: {
      id: "MEAL_SUBSCRIPTION_SLOTS",
      key: "MEAL_SUBSCRIPTION_SLOTS",
      value: JSON.stringify({}),
    },
    update: {
      value: JSON.stringify({}),
    },
  });

  console.log("✅ 6 Meal Slots Migration Finished Successfully!");
}

main()
  .catch((e) => {
    console.error("Migration error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
