import { db } from "../src/lib/db";
import { PREDEFINED_MEAL_SLOTS, getMealSlotDetails, normalizeMealSlotIds } from "../src/lib/meal-slots";
import { MealSubscriptionDeliveryService } from "../src/services/mealSubscriptionDeliveryService";
import { SubscriptionPauseService } from "../src/services/subscriptionPauseService";

async function runTests() {
  console.log("🧪 Starting Automated Tests for Meal Slots & Delivery System...\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: any) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`, details || "");
      failed++;
    }
  }

  // Test 1: Exactly 6 predefined meal slots
  assert(PREDEFINED_MEAL_SLOTS.length === 6, "Exactly 6 predefined meal slots exist");

  const expectedIds = [
    "breakfast",
    "morning_meal",
    "lunch",
    "evening_snack",
    "dinner",
    "late_night_snack",
  ];
  assert(
    JSON.stringify(PREDEFINED_MEAL_SLOTS.map((s) => s.id)) === JSON.stringify(expectedIds),
    "Slots have correct canonical IDs in proper order"
  );

  // Test 2: Normalization of legacy strings
  const legacyStrings = [
    "Breakfast: 7:30 AM – 9:30 AM",
    "Lunch: 12:30 PM – 2:00 PM",
    "Evening Snacks: 5:30 PM – 6:30 PM",
    "Dinner: 8:00 PM – 9:30 PM",
  ];
  const normalized = normalizeMealSlotIds(legacyStrings);
  assert(
    normalized.length === 4 &&
      normalized.includes("breakfast") &&
      normalized.includes("lunch") &&
      normalized.includes("evening_snack") &&
      normalized.includes("dinner"),
    "Legacy meal timing strings correctly map to canonical slot IDs"
  );

  // Test 3: Normalization rejects invalid/empty
  const invalid = normalizeMealSlotIds(["unknown_slot", "", null, undefined]);
  assert(invalid.length === 0, "Invalid or empty slots correctly rejected");

  // Test 4: Check an existing subscription in DB
  const sampleSub = await db.userMealSubscription.findFirst({
    include: { slots: { include: { slot: true } }, plan: true, user: true },
  });

  if (sampleSub) {
    console.log(`\nTesting with existing subscription ID: ${sampleSub.id} (Seller: ${sampleSub.sellerId})`);
    const todayStr = new Date().toISOString().split("T")[0];

    // Ensure deliveries for today
    await MealSubscriptionDeliveryService.ensureSubscriptionDeliveriesForDate(sampleSub.sellerId, todayStr);

    const deliveryResult = await MealSubscriptionDeliveryService.getSellerDeliveries(sampleSub.sellerId, {
      dateStr: todayStr,
      slotId: "all",
    });

    assert(deliveryResult.deliveries.length > 0, "Deliveries generated for seller");
    assert(typeof deliveryResult.slotCounts === "object", "Slot counts computed");
    assert(typeof deliveryResult.slotCounts.breakfast === "number", "Breakfast count exists");
    assert(typeof deliveryResult.slotCounts.lunch === "number", "Lunch count exists");
    assert(typeof deliveryResult.slotCounts.dinner === "number", "Dinner count exists");

    // Test 5: Re-running generation does NOT create duplicate deliveries
    const countBefore = deliveryResult.deliveries.length;
    await MealSubscriptionDeliveryService.ensureSubscriptionDeliveriesForDate(sampleSub.sellerId, todayStr);
    const deliveryResult2 = await MealSubscriptionDeliveryService.getSellerDeliveries(sampleSub.sellerId, {
      dateStr: todayStr,
      slotId: "all",
    });
    assert(deliveryResult2.deliveries.length === countBefore, "Re-running generation is strictly idempotent (no duplicates)");

    // Test 6: Filtering by slot
    const sampleSlot = sampleSub.slots[0]?.slotId || "lunch";
    const filteredResult = await MealSubscriptionDeliveryService.getSellerDeliveries(sampleSub.sellerId, {
      dateStr: todayStr,
      slotId: sampleSlot,
    });
    const allMatchSlot = filteredResult.deliveries.every((d) => d.slotId === sampleSlot);
    assert(allMatchSlot, `Filtering by slot [${sampleSlot}] returns only deliveries for that slot`);

    // Test 7: Slot-level status update
    if (deliveryResult.deliveries.length > 0) {
      const targetDel = deliveryResult.deliveries[0];
      const updateRes = await MealSubscriptionDeliveryService.recordDeliveryStatus(
        sampleSub.sellerId,
        targetDel.subscriptionId,
        todayStr,
        targetDel.slotId,
        "DELIVERED",
        "Test delivery note"
      );
      assert(updateRes.success && updateRes.delivery.status === "DELIVERED", "Slot delivery successfully marked as DELIVERED");

      // Verify the status persisted in DB
      const verified = await db.mealSubscriptionDelivery.findUnique({
        where: {
          subscriptionId_scheduledDate_slotId: {
            subscriptionId: targetDel.subscriptionId,
            scheduledDate: todayStr,
            slotId: targetDel.slotId,
          },
        },
      });
      assert(verified?.status === "DELIVERED", "Delivered status persisted in MealSubscriptionDelivery");
    }

    // Ensure plan has pauseBillingPeriod enabled for testing pause feature
    await db.sellerMealPlan.update({
      where: { id: sampleSub.planId },
      data: { pauseBillingPeriod: "Monthly" },
    });

    const originalEndDate = sampleSub.endDate ? new Date(sampleSub.endDate).getTime() : Date.now();
    const originalUsedDays = sampleSub.usedPauseDays || 0;

    // First Pause
    const pause1 = await SubscriptionPauseService.pauseSubscription(sampleSub.id, sampleSub.userId, 1);
    assert(pause1.success && pause1.subscription.isPaused === true, "First pause sets isPaused: true");

    // Resume 5 seconds later
    const resume1 = await SubscriptionPauseService.resumeSubscription(sampleSub.id, sampleSub.userId);
    assert(resume1.success && resume1.subscription.isPaused === false, "Resume sets isPaused: false");

    // Second Pause on the same day
    const pause2 = await SubscriptionPauseService.pauseSubscription(sampleSub.id, sampleSub.userId, 1);
    assert(pause2.success && pause2.subscription.isPaused === true, "Second same-day pause succeeds");

    // Resume again
    const resume2 = await SubscriptionPauseService.resumeSubscription(sampleSub.id, sampleSub.userId);
    assert(resume2.success && resume2.subscription.isPaused === false, "Second resume sets isPaused: false");

    // Verify after toggling multiple times on the same day:
    // usedPauseDays must NOT have blown up!
    const finalSub = await db.userMealSubscription.findUnique({
      where: { id: sampleSub.id },
    });

    const finalEndDate = finalSub?.endDate ? new Date(finalSub.endDate).getTime() : 0;
    const finalUsedDays = finalSub?.usedPauseDays || 0;

    console.log(`  Initial usedPauseDays: ${originalUsedDays}, Final usedPauseDays: ${finalUsedDays}`);
    console.log(`  Initial endDate: ${new Date(originalEndDate).toISOString()}, Final endDate: ${new Date(finalEndDate).toISOString()}`);

    assert(
      finalUsedDays === originalUsedDays,
      "Pausing and resuming multiple times on the same day does NOT increase usedPauseDays"
    );
    assert(
      Math.abs(finalEndDate - originalEndDate) < 60000, // within 1 minute
      "Pausing and resuming multiple times on the same day does NOT extend validity by multiple days"
    );
  }

  console.log(`\n========================================`);
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error("Test run error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
