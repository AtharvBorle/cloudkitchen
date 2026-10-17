import { db } from "@/lib/db";
import { ApiError } from "@/lib/api-error";
import { emitMealSubscriptionUpdated } from "@/lib/realtime-events";
import { PREDEFINED_MEAL_SLOTS, getMealSlotDetails } from "@/lib/meal-slots";
import { sendSubscriptionPauseNotification } from "@/lib/emailService";

/**
 * ==============================================================================
 * ⏸️ Subscription Pause & Resume Service
 * ==============================================================================
 * Central authoritative service for pause accounting, pause quotas, and validity calculation.
 * 
 * Guarantees:
 * 1. Same-day pause/resume does NOT automatically extend validity or consume quota.
 * 2. Already delivered meals (e.g. Breakfast) remain completed and are never credited/rescheduled.
 * 3. Only eligible undelivered occurrences skipped due to pause are affected.
 * 4. Idempotent: repeated pause/resume toggles on the same date will never charge multiple days.
 * 5. Fully transactional.
 */

export function parseAllowedPauseDays(period?: string | null): number {
  const p = (period || "").trim().toLowerCase();
  if (!p || p === "disabled" || p === "none" || p === "false") return 0;
  if (p.includes("30") || p.includes("month")) return 30;
  if (p.includes("14") || p.includes("2 week")) return 14;
  if (p.includes("7") || p.includes("1 week") || p.includes("week")) return 7;
  const match = p.match(/\d+/);
  if (match) return parseInt(match[0], 10);
  return 7;
}

/**
 * Formats a Date object as YYYY-MM-DD in local time.
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export class SubscriptionPauseService {
  /**
   * Pauses an active meal subscription.
   */
  static async pauseSubscription(
    subscriptionId: string,
    userId: string,
    requestedDays = 1,
    reason?: string
  ) {
    return await db.$transaction(async (tx) => {
      const subscription = await tx.userMealSubscription.findFirst({
        where: { id: subscriptionId, userId },
        include: {
          plan: {
            include: { slots: true },
          },
          slots: true,
          pauseIntervals: {
            orderBy: { createdAt: "desc" },
          },
          deliveries: true,
        },
      });

      if (!subscription) {
        throw new ApiError("Subscription not found", 404);
      }

      const now = new Date();
      const isEndReached = (() => {
        if (!subscription.endDate) return false;
        const end = new Date(subscription.endDate);
        if (isNaN(end.getTime())) return false;
        if (end <= now) return true;
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const endDayStart = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
        return endDayStart <= todayStart;
      })();

      if (subscription.status === "EXPIRED" || subscription.status === "CANCELLED" || isEndReached) {
        if (isEndReached && subscription.status !== "EXPIRED") {
          await tx.userMealSubscription.update({
            where: { id: subscription.id },
            data: { status: "EXPIRED", isPaused: false },
          }).catch(() => {});
        }
        throw new ApiError("Cannot pause an expired meal subscription. Pausing is only allowed for eligible, active subscriptions.", 400);
      }

      // Check if subscription has not reached its scheduled start date yet
      const isStarted = (() => {
        if (!subscription.startDate) return true;
        const start = new Date(subscription.startDate);
        if (isNaN(start.getTime())) return true;
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const startDayStart = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
        return startDayStart <= todayStart;
      })();

      if (!isStarted) {
        const startFormatted = new Date(subscription.startDate).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        throw new ApiError(
          `You cannot pause your subscription before it starts on ${startFormatted}. Pausing is only available once your meal deliveries begin.`,
          400
        );
      }

      const plan = subscription.plan;
      const allowedDays = parseAllowedPauseDays(plan?.pauseBillingPeriod);
      const allowPause = (plan as any)?.allowPause;
      const allowPauseBilling = (plan as any)?.allowPauseBilling;

      if (allowedDays <= 0 || allowPause === false || allowPauseBilling === false) {
        throw new ApiError("Pausing is not allowed for this meal plan by the kitchen partner.", 400);
      }

      // If already paused, don't double pause
      if (subscription.isPaused) {
        return {
          success: true,
          message: "Subscription is already paused.",
          subscription,
          remainingPauseDays: Math.max(0, allowedDays - (subscription.usedPauseDays || 0)),
        };
      }

      const currentUsedDays = subscription.usedPauseDays || 0;
      const remainingQuota = Math.max(0, allowedDays - currentUsedDays);

      if (remainingQuota <= 0) {
        throw new ApiError(
          `You have used all ${allowedDays} pause days allocated for this meal plan. No pause days remaining.`,
          400
        );
      }

      const pauseDays = Math.max(1, Math.min(Number(requestedDays) || 1, remainingQuota));
      const todayStr = formatDateKey(now);
      const pauseEndDate = new Date(now.getTime() + pauseDays * 24 * 60 * 60 * 1000);

      // Check if today was ALREADY paused and counted in another interval today
      const alreadyPausedToday = subscription.pauseIntervals.some((interval) => {
        const intervalStartStr = formatDateKey(interval.startDate);
        return intervalStartStr === todayStr && (interval.actualDaysUsed || 0) > 0;
      });

      // Calculate initial extension: only charge days that haven't been charged yet
      const effectivePauseDaysToAdd = alreadyPausedToday ? Math.max(0, pauseDays - 1) : pauseDays;

      const baseEndDate = subscription.endDate ? new Date(subscription.endDate) : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const extendedEndDate = new Date(baseEndDate.getTime() + effectivePauseDaysToAdd * 24 * 60 * 60 * 1000);
      const newUsedDays = currentUsedDays + effectivePauseDaysToAdd;

      // 1. Create Pause Interval Record
      const interval = await tx.subscriptionPauseInterval.create({
        data: {
          subscriptionId: subscription.id,
          startDate: now,
          endDate: pauseEndDate,
          pauseDays: pauseDays,
          actualDaysUsed: effectivePauseDaysToAdd,
          status: "ACTIVE",
          reason: reason || "User paused subscription",
        },
      });

      // 2. Slot-level Accounting:
      // Identify upcoming pending deliveries for today and future days during the pause window
      // DO NOT touch already completed DELIVERED or NOT_DELIVERED meals!
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeInMins = currentHour * 60 + currentMinute;

      // Ensure slot IDs are known
      const subSlotIds = subscription.slots.map((s) => s.slotId);

      // For today: mark undelivered upcoming slots as SKIPPED_PAUSED
      for (const slotId of subSlotIds) {
        const slotDef = getMealSlotDetails(slotId);
        const startHour = slotDef?.startHour ?? 0;
        const startMinute = slotDef?.startMinute ?? 0;
        const slotStartMins = startHour * 60 + startMinute;

        // Check existing delivery record for today
        const existingDelivery = await tx.mealSubscriptionDelivery.findUnique({
          where: {
            subscriptionId_scheduledDate_slotId: {
              subscriptionId: subscription.id,
              scheduledDate: todayStr,
              slotId: slotId,
            },
          },
        });

        if (existingDelivery) {
          // If already DELIVERED, PRESERVE IT!
          if (existingDelivery.status === "DELIVERED" || existingDelivery.status === "NOT_DELIVERED") {
            continue;
          }
          // If pending and current time is before or during slot, skip it due to pause
          await tx.mealSubscriptionDelivery.update({
            where: { id: existingDelivery.id },
            data: { status: "SKIPPED_PAUSED", note: "Skipped due to customer pause" },
          });
        } else {
          // Create as SKIPPED_PAUSED
          await tx.mealSubscriptionDelivery.create({
            data: {
              subscriptionId: subscription.id,
              slotId: slotId,
              sellerId: subscription.sellerId,
              userId: subscription.userId,
              scheduledDate: todayStr,
              scheduledTime: slotDef.defaultTimeRange,
              status: "SKIPPED_PAUSED",
              note: "Skipped due to customer pause",
            },
          });
        }
      }

      // Update legacy pause history mirror
      let history: any[] = [];
      try {
        history = typeof subscription.pauseHistory === "string" ? JSON.parse(subscription.pauseHistory) : (subscription.pauseHistory || []);
      } catch {
        history = [];
      }

      history.unshift({
        id: interval.id,
        pausedAt: now.toISOString(),
        pauseEndDate: pauseEndDate.toISOString(),
        requestedDays: pauseDays,
        effectiveDaysCharged: effectivePauseDaysToAdd,
        previousEndDate: baseEndDate.toISOString(),
        newEndDate: extendedEndDate.toISOString(),
        resumedAt: null,
        status: "PAUSED",
      });

      // 3. Update subscription record
      const updated = await tx.userMealSubscription.update({
        where: { id: subscription.id },
        data: {
          isPaused: true,
          status: "PAUSED",
          pausedAt: now,
          pauseEndDate: pauseEndDate,
          usedPauseDays: newUsedDays,
          endDate: extendedEndDate,
          pauseHistory: JSON.stringify(history),
        },
        include: {
          plan: true,
          seller: true,
          slots: true,
        },
      });

      emitMealSubscriptionUpdated(updated.sellerId, userId, "PAUSE", updated);

      // Send pause notification email asynchronously (failsafe)
      (async () => {
        try {
          const customer = await db.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, phone: true }
          });
          const pauseStartDateStr = now.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
          const pauseEndDateStr = pauseEndDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
          const extendedEndDateStr = extendedEndDate ? extendedEndDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : undefined;
          await sendSubscriptionPauseNotification(updated, true, pauseDays, customer, pauseStartDateStr, pauseEndDateStr, extendedEndDateStr);
        } catch (err) {
          console.error("[EmailService] Failed to send subscription pause email:", err);
        }
      })();

      return {
        success: true,
        message: `Subscription paused for ${pauseDays} day${pauseDays > 1 ? "s" : ""}. Validity extended by ${effectivePauseDaysToAdd} days! (${Math.max(0, allowedDays - newUsedDays)} days quota left)`,
        subscription: updated,
        remainingPauseDays: Math.max(0, allowedDays - newUsedDays),
        extendedEndDate: extendedEndDate.toISOString(),
      };
    });
  }

  /**
   * Resumes a paused meal subscription early or on schedule.
   * Correctly reconciles same-day pause/resumes and restores upcoming pending deliveries.
   */
  static async resumeSubscription(subscriptionId: string, userId: string) {
    return await db.$transaction(async (tx) => {
      const subscription = await tx.userMealSubscription.findFirst({
        where: { id: subscriptionId, userId },
        include: {
          plan: {
            include: { slots: true },
          },
          slots: true,
          pauseIntervals: {
            where: { status: "ACTIVE" },
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!subscription) {
        throw new ApiError("Subscription not found", 404);
      }

      if (!subscription.isPaused) {
        return {
          success: true,
          message: "Subscription is already active.",
          subscription,
        };
      }

      const plan = subscription.plan;
      const allowedDays = parseAllowedPauseDays(plan?.pauseBillingPeriod);
      const now = new Date();
      const todayStr = formatDateKey(now);

      const activeInterval = subscription.pauseIntervals[0];
      let currentUsedDays = subscription.usedPauseDays || 0;
      let finalEndDate = subscription.endDate ? new Date(subscription.endDate) : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      if (activeInterval) {
        const pausedAtDate = new Date(activeInterval.startDate);
        const pausedAtDayStr = formatDateKey(pausedAtDate);

        // Check if paused and resumed on the EXACT SAME DAY
        const isSameDayResume = pausedAtDayStr === todayStr;

        if (isSameDayResume) {
          // If paused today and resumed today:
          // Check how many meals were actually missed.
          // If the user paused at 10:00 AM and resumed at 10:30 AM with 0 missed meals,
          // DO NOT charge any pause day and DO NOT extend validity!
          const chargedDays = activeInterval.actualDaysUsed || 0;
          if (chargedDays > 0) {
            currentUsedDays = Math.max(0, currentUsedDays - chargedDays);
            finalEndDate = new Date(finalEndDate.getTime() - chargedDays * 24 * 60 * 60 * 1000);
          }

          await tx.subscriptionPauseInterval.update({
            where: { id: activeInterval.id },
            data: {
              status: "RESUMED_EARLY",
              resumedAt: now,
              actualDaysUsed: 0,
            },
          });
        } else {
          // Paused across multiple days
          const msElapsed = now.getTime() - pausedAtDate.getTime();
          const daysElapsed = Math.max(1, Math.floor(msElapsed / (24 * 60 * 60 * 1000)));
          const originallyCharged = activeInterval.actualDaysUsed || activeInterval.pauseDays;

          if (daysElapsed < originallyCharged) {
            const unusedDays = originallyCharged - daysElapsed;
            currentUsedDays = Math.max(0, currentUsedDays - unusedDays);
            finalEndDate = new Date(finalEndDate.getTime() - unusedDays * 24 * 60 * 60 * 1000);

            await tx.subscriptionPauseInterval.update({
              where: { id: activeInterval.id },
              data: {
                status: "RESUMED_EARLY",
                resumedAt: now,
                actualDaysUsed: daysElapsed,
              },
            });
          } else {
            await tx.subscriptionPauseInterval.update({
              where: { id: activeInterval.id },
              data: {
                status: "COMPLETED",
                resumedAt: now,
                actualDaysUsed: originallyCharged,
              },
            });
          }
        }
      }

      // Re-activate upcoming meal slots for today that have NOT passed cutoff
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeInMins = currentHour * 60 + currentMinute;

      const subSlotIds = subscription.slots.map((s) => s.slotId);

      for (const slotId of subSlotIds) {
        const slotDef = getMealSlotDetails(slotId);
        const endHour = slotDef?.endHour ?? 23;
        const endMinute = slotDef?.endMinute ?? 59;
        const slotEndMins = endHour * 60 + endMinute;

        // If slot delivery window hasn't ended yet today, restore to PENDING!
        if (slotEndMins > currentTimeInMins) {
          const delivery = await tx.mealSubscriptionDelivery.findUnique({
            where: {
              subscriptionId_scheduledDate_slotId: {
                subscriptionId: subscription.id,
                scheduledDate: todayStr,
                slotId: slotId,
              },
            },
          });

          if (delivery && delivery.status === "SKIPPED_PAUSED") {
            await tx.mealSubscriptionDelivery.update({
              where: { id: delivery.id },
              data: {
                status: "PENDING",
                note: "Re-activated upon subscription resume",
              },
            });
          }
        }
      }

      // Update legacy pause history mirror
      let history: any[] = [];
      try {
        history = typeof subscription.pauseHistory === "string" ? JSON.parse(subscription.pauseHistory) : (subscription.pauseHistory || []);
      } catch {
        history = [];
      }

      if (history.length > 0 && !history[0].resumedAt) {
        history[0].resumedAt = now.toISOString();
        history[0].status = "RESUMED";
        history[0].finalEndDate = finalEndDate.toISOString();
      }

      const isExpiredAfterResume = (() => {
        if (!finalEndDate) return false;
        if (finalEndDate <= now) return true;
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const endDayStart = new Date(finalEndDate.getFullYear(), finalEndDate.getMonth(), finalEndDate.getDate()).getTime();
        return endDayStart <= todayStart;
      })();

      const nextStatus = isExpiredAfterResume ? "EXPIRED" : "ACTIVE";

      const updated = await tx.userMealSubscription.update({
        where: { id: subscription.id },
        data: {
          isPaused: false,
          status: nextStatus,
          pausedAt: null,
          pauseEndDate: null,
          usedPauseDays: currentUsedDays,
          endDate: finalEndDate,
          pauseHistory: JSON.stringify(history),
        },
        include: {
          plan: true,
          seller: true,
          slots: true,
        },
      });

      emitMealSubscriptionUpdated(updated.sellerId, userId, "RESUME", updated);

      // Send resume notification email asynchronously (failsafe)
      (async () => {
        try {
          const customer = await db.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, phone: true }
          });
          const resumeDateStr = now.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
          const updatedEndDateStr = finalEndDate ? finalEndDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : undefined;
          await sendSubscriptionPauseNotification(updated, false, undefined, customer, undefined, undefined, updatedEndDateStr);
        } catch (err) {
          console.error("[EmailService] Failed to send subscription resume email:", err);
        }
      })();

      return {
        success: true,
        message: "Subscription resumed successfully! Your daily meals are active again.",
        subscription: updated,
        remainingPauseDays: Math.max(0, allowedDays - currentUsedDays),
        endDate: finalEndDate.toISOString(),
      };
    });
  }
}
