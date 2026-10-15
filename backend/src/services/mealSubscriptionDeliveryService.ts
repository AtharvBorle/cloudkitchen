import { db } from "@/lib/db";
import { ApiError } from "@/lib/api-error";
import { emitMealSubscriptionUpdated } from "@/lib/realtime-events";
import { PREDEFINED_MEAL_SLOTS, getMealSlotDetails, normalizeMealSlotId } from "@/lib/meal-slots";

/**
 * ==============================================================================
 * 🚚 Meal Subscription Delivery Management Service
 * ==============================================================================
 * Central service for generating, querying, and updating scheduled daily meal deliveries
 * across the 7 standardized meal slots.
 */

export interface GetDeliveriesOptions {
  dateStr: string;           // YYYY-MM-DD
  slotId?: string;           // "all" or specific slot ID e.g. "breakfast"
  status?: string;           // "ALL" or "PENDING" | "DELIVERED" | "NOT_DELIVERED" | "SKIPPED_PAUSED"
  search?: string;           // Search query (customer name, phone, address, plan)
}

export class MealSubscriptionDeliveryService {
  /**
   * Generates or ensures delivery records exist for all active subscriptions of a seller for a given date.
   * Idempotent: Never overwrites already marked DELIVERED or NOT_DELIVERED deliveries.
   */
  static async ensureSubscriptionDeliveriesForDate(sellerId: string, dateStr: string) {
    const targetDateStart = new Date(`${dateStr}T00:00:00.000Z`);
    const targetDateEnd = new Date(`${dateStr}T23:59:59.999Z`);

    // Fetch active/paused subscriptions for this seller that overlap target date
    const subscriptions = await db.userMealSubscription.findMany({
      where: {
        sellerId,
        startDate: { lte: targetDateEnd },
        OR: [
          { endDate: null },
          { endDate: { gte: targetDateStart } },
        ],
        status: { notIn: ["CANCELLED"] },
      },
      include: {
        slots: true,
        plan: {
          include: { slots: true },
        },
      },
    });

    for (const sub of subscriptions) {
      // Determine subscription slots
      let slotIds = sub.slots.map((s) => s.slotId);

      // If subscription has no slots yet, sync from plan or default to lunch
      if (slotIds.length === 0) {
        const planSlotIds = sub.plan?.slots.map((s) => s.slotId) || [];
        if (planSlotIds.length > 0) {
          slotIds = planSlotIds;
          for (const sId of planSlotIds) {
            await db.userSubscriptionMealSlot.upsert({
              where: {
                subscriptionId_slotId: {
                  subscriptionId: sub.id,
                  slotId: sId,
                },
              },
              create: {
                subscriptionId: sub.id,
                slotId: sId,
              },
              update: {},
            }).catch(() => {});
          }
        } else {
          slotIds = ["lunch"];
        }
      }

      // Check if paused on this date
      const isSubPaused = Boolean(sub.isPaused);

      for (const slotId of slotIds) {
        const slotDef = getMealSlotDetails(slotId);

        // Check if delivery already exists
        const existing = await db.mealSubscriptionDelivery.findUnique({
          where: {
            subscriptionId_scheduledDate_slotId: {
              subscriptionId: sub.id,
              scheduledDate: dateStr,
              slotId,
            },
          },
        });

        if (!existing) {
          await db.mealSubscriptionDelivery.create({
            data: {
              subscriptionId: sub.id,
              slotId,
              sellerId: sub.sellerId,
              userId: sub.userId,
              scheduledDate: dateStr,
              scheduledTime: slotDef.defaultTimeRange,
              status: isSubPaused ? "SKIPPED_PAUSED" : "PENDING",
              note: isSubPaused ? "Skipped due to paused subscription" : undefined,
            },
          }).catch(() => {});
        }
      }
    }
  }

  /**
   * Fetches deliveries organized by slot for the seller's deliveries dashboard.
   */
  static async getSellerDeliveries(sellerId: string, options: GetDeliveriesOptions) {
    const { dateStr, slotId, status, search } = options;

    // 1. Ensure deliveries exist for the requested date
    await this.ensureSubscriptionDeliveriesForDate(sellerId, dateStr);

    // 2. Build where filter
    const where: any = {
      sellerId,
      scheduledDate: dateStr,
    };

    if (slotId && slotId !== "all" && slotId !== "ALL") {
      const normalizedSlot = normalizeMealSlotId(slotId);
      if (normalizedSlot) {
        where.slotId = normalizedSlot;
      }
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    // 3. Query all deliveries for date to compute slot counts
    const allDeliveriesForDate = await db.mealSubscriptionDelivery.findMany({
      where: {
        sellerId,
        scheduledDate: dateStr,
      },
      select: {
        id: true,
        slotId: true,
        status: true,
      },
    });

    const slotCounts: Record<string, number> = {
      all: allDeliveriesForDate.length,
    };
    PREDEFINED_MEAL_SLOTS.forEach((s) => {
      slotCounts[s.id] = 0;
    });

    for (const d of allDeliveriesForDate) {
      const normSlot = normalizeMealSlotId(d.slotId);
      if (normSlot && slotCounts[normSlot] !== undefined) {
        slotCounts[normSlot]++;
      }
    }

    // 4. Fetch the filtered deliveries with full relations
    const deliveries = await db.mealSubscriptionDelivery.findMany({
      where,
      include: {
        slot: true,
        subscription: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
              },
            },
            plan: {
              select: {
                id: true,
                name: true,
                tier: true,
                duration: true,
              },
            },
          },
        },
      },
      orderBy: [
        { slot: { order: "asc" } },
        { createdAt: "desc" },
      ],
    });

    // 5. Apply search filter in memory if provided
    let results = deliveries;
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      results = deliveries.filter((d) => {
        const u = d.subscription?.user;
        const p = d.subscription?.plan;
        const addr = d.subscription?.deliveryAddress || "";
        const phone = d.subscription?.contactPhone || u?.phone || "";
        return (
          u?.name?.toLowerCase().includes(q) ||
          phone.includes(q) ||
          addr.toLowerCase().includes(q) ||
          p?.name?.toLowerCase().includes(q) ||
          d.slot?.name?.toLowerCase().includes(q)
        );
      });
    }

    // Format response
    const formattedDeliveries = results.map((d) => {
      const user = d.subscription?.user;
      const plan = d.subscription?.plan;
      const slotDef = d.slot || getMealSlotDetails(d.slotId);

      return {
        id: d.id,
        subscriptionId: d.subscriptionId,
        slotId: d.slotId,
        slotName: slotDef.name,
        slotSubtitle: slotDef.subtitle,
        scheduledDate: d.scheduledDate,
        scheduledTime: d.scheduledTime || slotDef.defaultTimeRange,
        status: d.status,
        deliveredAt: d.deliveredAt ? d.deliveredAt.toISOString() : null,
        markedBy: d.markedBy,
        note: d.note,
        customerName: user?.name || "Customer",
        customerPhone: d.subscription?.contactPhone || user?.phone || "",
        customerEmail: user?.email || "",
        deliveryAddress: d.subscription?.deliveryAddress || "",
        planName: plan?.name || "Meal Plan",
        tier: plan?.tier || d.subscription?.tier || "Bronze",
        isPaused: Boolean(d.subscription?.isPaused),
        subscription: {
          id: d.subscriptionId,
          tier: plan?.tier || d.subscription?.tier || "Bronze",
          status: d.subscription?.status || (Boolean(d.subscription?.isPaused) ? "PAUSED" : "ACTIVE"),
          deliveryAddress: d.subscription?.deliveryAddress || "",
          contactPhone: d.subscription?.contactPhone || user?.phone || "",
          user: {
            id: user?.id || d.userId,
            name: user?.name || "Subscriber",
            phone: d.subscription?.contactPhone || user?.phone || "",
            email: user?.email || "",
          },
          plan: {
            id: plan?.id || "",
            name: plan?.name || "Meal Plan",
            tier: plan?.tier || "Bronze",
          },
        },
      };
    });

    return {
      scheduledDate: dateStr,
      slotCounts,
      deliveries: formattedDeliveries,
      totalCount: formattedDeliveries.length,
    };
  }

  /**
   * Updates delivery status for a specific occurrence (e.g. mark Breakfast as Delivered).
   */
  static async recordDeliveryStatus(
    sellerId: string,
    subscriptionId: string,
    dateStr: string,
    slotId: string,
    status: "DELIVERED" | "NOT_DELIVERED" | "PENDING",
    note?: string
  ) {
    const normalizedSlot = normalizeMealSlotId(slotId) || "breakfast";
    const slotDef = getMealSlotDetails(normalizedSlot);
    const now = new Date();

    const sub = await db.userMealSubscription.findFirst({
      where: { id: subscriptionId, sellerId },
      include: { user: true, plan: true },
    });

    if (!sub) {
      throw new ApiError("Subscription not found or not assigned to your kitchen", 404);
    }

    // Upsert the delivery record
    const delivery = await db.mealSubscriptionDelivery.upsert({
      where: {
        subscriptionId_scheduledDate_slotId: {
          subscriptionId,
          scheduledDate: dateStr,
          slotId: normalizedSlot,
        },
      },
      create: {
        subscriptionId,
        slotId: normalizedSlot,
        sellerId,
        userId: sub.userId,
        scheduledDate: dateStr,
        scheduledTime: slotDef.defaultTimeRange,
        status,
        deliveredAt: status === "DELIVERED" ? now : undefined,
        markedBy: sellerId,
        note: note || undefined,
      },
      update: {
        status,
        deliveredAt: status === "DELIVERED" ? now : null,
        markedBy: sellerId,
        note: note || undefined,
      },
    });

    // Update the legacy dailyDeliveries array on the subscription for backward compatibility
    let dailyDeliveries: any[] = [];
    try {
      dailyDeliveries = typeof sub.dailyDeliveries === "string" ? JSON.parse(sub.dailyDeliveries) : (sub.dailyDeliveries || []);
    } catch {
      dailyDeliveries = [];
    }

    const legacyIdx = dailyDeliveries.findIndex(
      (d: any) => d.date === dateStr && (d.slotId === normalizedSlot || (!d.slotId && normalizedSlot === "breakfast"))
    );

    const legacyRecord = {
      date: dateStr,
      slotId: normalizedSlot,
      status,
      markedAt: now.toISOString(),
      markedBy: sellerId,
      note: note || undefined,
    };

    if (legacyIdx >= 0) {
      dailyDeliveries[legacyIdx] = { ...dailyDeliveries[legacyIdx], ...legacyRecord };
    } else {
      dailyDeliveries.unshift(legacyRecord);
    }

    const updatedSub = await db.userMealSubscription.update({
      where: { id: subscriptionId },
      data: {
        dailyDeliveries: JSON.stringify(dailyDeliveries),
      },
      include: { user: true, plan: true },
    });

    emitMealSubscriptionUpdated(sellerId, sub.userId, "UPDATE", updatedSub);

    return {
      success: true,
      message: `Delivery for ${slotDef.name} marked as ${status === "DELIVERED" ? "Delivered" : status === "NOT_DELIVERED" ? "Not Delivered" : "Pending"} for ${dateStr}`,
      delivery,
      dailyDeliveries,
    };
  }
}
