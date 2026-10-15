import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { emitMealSubscriptionUpdated } from "@/lib/realtime-events";
import { SubscriptionPauseService } from "@/services/subscriptionPauseService";
import { normalizeMealSlotIds, getMealSlotDetails } from "@/lib/meal-slots";
import Razorpay from "razorpay";
import crypto from "crypto";

export const getUserMealSubscriptions = async () => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to view your meal subscriptions.", 401);
    }

    const subscriptions = await db.userMealSubscription.findMany({
        where: { userId: session.user.id },
        include: {
            slots: {
                include: { slot: true }
            },
            plan: {
                include: {
                    slots: {
                        include: { slot: true }
                    }
                }
            },
            seller: {
                select: {
                    id: true,
                    businessName: true,
                    trackingId: true,
                    addressLocality: true,
                    addressFlat: true,
                    foodType: true,
                    bannerImageUrl: true,
                    kitchenImages: true,
                }
            }
        },
        orderBy: { createdAt: "desc" }
    });

    const now = new Date();
    // 1. Auto-resume subscriptions whose scheduled pause period has expired
    for (const sub of subscriptions) {
        if (sub.isPaused && sub.pauseEndDate && new Date(sub.pauseEndDate) <= now) {
            let history: any[] = [];
            try {
                history = typeof sub.pauseHistory === "string" ? JSON.parse(sub.pauseHistory) : (sub.pauseHistory || []);
            } catch {
                history = [];
            }
            const lastEntry = history.find((h: any) => !h.resumedAt);
            if (lastEntry) {
                lastEntry.resumedAt = sub.pauseEndDate.toISOString();
                lastEntry.status = "COMPLETED";
                lastEntry.actualDaysUsed = lastEntry.requestedDays;
            }
            await db.userMealSubscription.update({
                where: { id: sub.id },
                data: {
                    isPaused: false,
                    status: "ACTIVE",
                    pausedAt: null,
                    pauseEndDate: null,
                    pauseHistory: JSON.stringify(history),
                }
            }).catch(() => {});
            sub.isPaused = false;
            sub.status = "ACTIVE";
            sub.pausedAt = null;
            sub.pauseEndDate = null;
            sub.pauseHistory = JSON.stringify(history);
        }

        // 2. Auto-expire user subscriptions whose duration / validity (endDate) has passed
        if (sub.status !== "CANCELLED" && sub.status !== "EXPIRED" && sub.endDate && new Date(sub.endDate) < now) {
            await db.userMealSubscription.update({
                where: { id: sub.id },
                data: {
                    status: "EXPIRED",
                    isPaused: false,
                }
            }).catch(() => {});
            sub.status = "EXPIRED";
            sub.isPaused = false;
        }
    }

    return subscriptions.map((sub) => {
        let features: string[] = [];
        try {
            features = typeof sub.plan?.features === "string" ? JSON.parse(sub.plan.features) : (sub.plan?.features || []);
        } catch {
            features = [];
        }

        let mealTimings: string[] = [];
        try {
            mealTimings = typeof sub.plan?.mealTimings === "string" ? JSON.parse(sub.plan.mealTimings) : (sub.plan?.mealTimings || []);
        } catch {
            mealTimings = [];
        }

        let parsedPauseHistory: any[] = [];
        try {
            parsedPauseHistory = typeof sub.pauseHistory === "string" ? JSON.parse(sub.pauseHistory) : (sub.pauseHistory || []);
        } catch {
            parsedPauseHistory = [];
        }

        let parsedDailyDeliveries: any[] = [];
        try {
            parsedDailyDeliveries = typeof sub.dailyDeliveries === "string" ? JSON.parse(sub.dailyDeliveries) : (sub.dailyDeliveries || []);
        } catch {
            parsedDailyDeliveries = [];
        }

        const isPlanDeactivated = sub.plan?.status === "Inactive";
        const isExpired = sub.status === "EXPIRED" || Boolean(sub.endDate && new Date(sub.endDate) < now);
        const effectiveStatus = isExpired
            ? "EXPIRED"
            : isPlanDeactivated && sub.status === "ACTIVE"
            ? "INACTIVE"
            : sub.status;

        const rawSlots = sub.slots && sub.slots.length > 0
            ? sub.slots.map((s: any) => s.slotId)
            : (sub.plan?.slots && sub.plan.slots.length > 0
                ? sub.plan.slots.map((s: any) => s.slotId)
                : mealTimings);
        const resolvedSlotIds = normalizeMealSlotIds(rawSlots);
        const resolvedSlotDetails = resolvedSlotIds.map((id) => getMealSlotDetails(id));

        const planSlotIds = sub.plan?.slots && sub.plan.slots.length > 0
            ? sub.plan.slots.map((s: any) => s.slotId)
            : normalizeMealSlotIds(mealTimings);
        const planSlotDetails = planSlotIds.map((id) => getMealSlotDetails(id));

        return {
            id: sub.id,
            userId: sub.userId,
            sellerId: sub.sellerId,
            planId: sub.planId,
            status: effectiveStatus,
            isExpired,
            isPlanDeactivated: Boolean(isPlanDeactivated),
            tier: sub.tier,
            cycle: sub.cycle,
            pricePaid: sub.pricePaid,
            isPaused: isPlanDeactivated || isExpired ? false : sub.isPaused,
            pausedAt: sub.pausedAt ? sub.pausedAt.toISOString() : null,
            pauseEndDate: sub.pauseEndDate ? sub.pauseEndDate.toISOString() : null,
            usedPauseDays: sub.usedPauseDays || 0,
            pauseHistory: parsedPauseHistory,
            dailyDeliveries: parsedDailyDeliveries,
            mealTimings: resolvedSlotIds,
            mealSlots: resolvedSlotDetails,
            slotIds: resolvedSlotIds,
            startDate: sub.startDate.toISOString(),
            endDate: sub.endDate ? sub.endDate.toISOString() : null,
            deliveryAddress: sub.deliveryAddress || "",
            contactPhone: sub.contactPhone || "",
            createdAt: sub.createdAt.toISOString(),
            updatedAt: sub.updatedAt.toISOString(),
            plan: sub.plan ? {
                id: sub.plan.id,
                name: sub.plan.name,
                tier: sub.plan.tier,
                description: sub.plan.description || "",
                weeklyPrice: sub.plan.weeklyPrice,
                monthlyPrice: sub.plan.monthlyPrice || ((sub.plan.duration || "").toLowerCase().includes("week") ? null : sub.plan.weeklyPrice),
                quarterlyPrice: sub.plan.quarterlyPrice || null,
                yearlyPrice: sub.plan.yearlyPrice || null,
                duration: sub.plan.duration,
                features,
                mealTimings: planSlotIds,
                mealSlots: planSlotDetails,
                slotIds: planSlotIds,
                status: sub.plan.status,
                isActive: sub.plan.status === "Live",
                allowCancel: sub.plan.allowCancel,
                pauseBillingPeriod: sub.plan.pauseBillingPeriod,
                allowPause: Boolean(
                    sub.plan.pauseBillingPeriod &&
                    sub.plan.pauseBillingPeriod.trim().toLowerCase() !== "none" &&
                    sub.plan.pauseBillingPeriod.trim().toLowerCase() !== "disabled" &&
                    sub.plan.pauseBillingPeriod.trim().toLowerCase() !== "false"
                ),
                allowPauseBilling: Boolean(
                    sub.plan.pauseBillingPeriod &&
                    sub.plan.pauseBillingPeriod.trim().toLowerCase() !== "none" &&
                    sub.plan.pauseBillingPeriod.trim().toLowerCase() !== "disabled" &&
                    sub.plan.pauseBillingPeriod.trim().toLowerCase() !== "false"
                ),
            } : null,
            seller: sub.seller ? {
                id: sub.seller.id,
                businessName: sub.seller.businessName || "Kitchen Partner",
                trackingId: sub.seller.trackingId,
                addressLocality: sub.seller.addressLocality,
                foodType: sub.seller.foodType,
                bannerImageUrl: sub.seller.bannerImageUrl,
            } : {
                id: sub.sellerId,
                businessName: "Kitchen Partner",
            }
        };
    });
};

export const initiateMealSubscriptionPayment = async (req: Request) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to subscribe to a meal plan.", 401);
    }
    if (session.user.role !== "USER") {
        throw new ApiError("Access denied. Customer account required to subscribe to meal plans.", 403);
    }

    const body = await req.json();
    const { planId, cycle = "WEEKLY" } = body;

    if (!planId) {
        throw new ApiError("Plan ID is required", 400);
    }

    const plan = await db.sellerMealPlan.findUnique({
        where: { id: planId },
        include: { seller: true }
    });

    if (!plan || plan.status !== "Live") {
        throw new ApiError("Selected meal plan is unavailable or inactive", 404);
    }

    if (plan.seller && plan.seller.isOnline === false) {
        throw new ApiError("This kitchen partner is currently offline and not accepting new subscriptions.", 400);
    }

    const planDuration = (plan.duration || "1 Week").toLowerCase();
    const cycleNormalized = (cycle || plan.duration || "WEEKLY").toUpperCase();
    let calculatedPrice = plan.weeklyPrice;
    let durationDays = 7;
    let subscriptionCycle = plan.duration || "1 Week";

    if (cycleNormalized.includes("YEAR") || cycleNormalized === "YEARLY" || planDuration.includes("year")) {
        calculatedPrice = plan.yearlyPrice || plan.weeklyPrice;
        durationDays = 365;
        subscriptionCycle = "1 Year";
    } else if (cycleNormalized.includes("6 MONTH") || cycleNormalized === "6 MONTHS" || cycleNormalized === "HALF_YEARLY" || planDuration.includes("6 month")) {
        calculatedPrice = plan.monthlyPrice ? plan.monthlyPrice * 6 : plan.weeklyPrice;
        durationDays = 180;
        subscriptionCycle = "6 Months";
    } else if (cycleNormalized.includes("QUARTER") || cycleNormalized === "QUARTERLY" || cycleNormalized.includes("3 MONTH") || planDuration.includes("quarter") || planDuration.includes("3 month")) {
        calculatedPrice = plan.quarterlyPrice || plan.monthlyPrice || plan.weeklyPrice;
        durationDays = 90;
        subscriptionCycle = "3 Months";
    } else if (cycleNormalized.includes("MONTH") || cycleNormalized === "MONTHLY" || cycleNormalized.includes("1 MONTH") || planDuration.includes("month")) {
        calculatedPrice = plan.monthlyPrice || plan.weeklyPrice;
        durationDays = 30;
        subscriptionCycle = "1 Month";
    } else if (cycleNormalized.includes("2 WEEK") || cycleNormalized === "BIWEEKLY" || planDuration.includes("2 week")) {
        calculatedPrice = plan.weeklyPrice;
        durationDays = 14;
        subscriptionCycle = "2 Weeks";
    } else {
        calculatedPrice = plan.weeklyPrice;
        durationDays = 7;
        subscriptionCycle = "1 Week";
    }

    if (!calculatedPrice || calculatedPrice <= 0) {
        throw new ApiError("Invalid subscription pricing for selected plan", 400);
    }

    const key_id = process.env.RAZORPAY_KEY_ID || "rzp_test_TX4MPQgJuetMFP";
    const key_secret = process.env.RAZORPAY_KEY_SECRET || "";

    let rzpOrderId = `order_sub_${Date.now()}`;
    let rzpAmount = Math.round(calculatedPrice * 100);
    let rzpCurrency = "INR";

    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        try {
            const razorpay = new Razorpay({
                key_id: process.env.RAZORPAY_KEY_ID,
                key_secret: process.env.RAZORPAY_KEY_SECRET,
            });
            const rzpOrder = await razorpay.orders.create({
                amount: rzpAmount,
                currency: "INR",
                receipt: `meal_rcpt_${Date.now().toString().slice(-10)}`,
                notes: {
                    userId: session.user.id,
                    sellerId: plan.sellerId,
                    planId: plan.id,
                    cycle: subscriptionCycle,
                    planName: plan.name,
                }
            });
            rzpOrderId = rzpOrder.id;
            rzpAmount = Number(rzpOrder.amount);
            rzpCurrency = rzpOrder.currency;
        } catch (error: any) {
            console.error("Razorpay live order creation error for meal subscription:", error);
        }
    }

    return {
        razorpayOrderId: rzpOrderId,
        amount: rzpAmount,
        currency: rzpCurrency,
        keyId: key_id,
        calculatedPrice,
        subscriptionCycle,
        durationDays,
    };
};

export const createUserMealSubscription = async (req: Request) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to subscribe to a meal plan.", 401);
    }
    if (session.user.role !== "USER") {
        throw new ApiError("Access denied. Customer account required to subscribe to meal plans.", 403);
    }

    const body = await req.json();
    const {
        planId,
        deliveryAddress,
        contactPhone,
        cycle = "WEEKLY",
        startDate: customStartDate,
        startDatePreference,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
    } = body;

    if (!planId) {
        throw new ApiError("Plan ID is required", 400);
    }

    const cleanAddress = String(deliveryAddress || "").trim();
    if (!cleanAddress) {
        throw new ApiError("Delivery address is required for meal delivery", 400);
    }
    if (cleanAddress.length < 5 || cleanAddress.length > 150) {
        throw new ApiError("Delivery address must be between 5 and 150 characters", 400);
    }

    if (contactPhone) {
        const cleanPhone = String(contactPhone).replace(/\D/g, "");
        if (cleanPhone.length !== 10) {
            throw new ApiError("Contact phone number must be exactly 10 digits", 400);
        }
    }

    // Enforce Online Payment Verification via Razorpay
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw new ApiError("Payment verification details are required. Subscription cannot be activated without completing payment.", 400);
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || "";
    if (secret) {
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            throw new ApiError("Payment verification failed: Invalid transaction signature", 400);
        }
    }

    // Check for duplicate activation using the same razorpay payment / order ID
    const existingPaymentSub = await db.userMealSubscription.findFirst({
        where: {
            OR: [
                { razorpayOrderId: razorpay_order_id },
                { razorpayPaymentId: razorpay_payment_id }
            ]
        }
    });

    if (existingPaymentSub) {
        throw new ApiError("This payment transaction has already been processed for an active subscription.", 400);
    }

    const plan = await db.sellerMealPlan.findUnique({
        where: { id: planId },
        include: { seller: true }
    });

    if (!plan || plan.status !== "Live") {
        throw new ApiError("Selected meal plan is unavailable or inactive", 404);
    }

    const planDuration = (plan.duration || "1 Week").toLowerCase();
    const cycleNormalized = (cycle || plan.duration || "WEEKLY").toUpperCase();
    let calculatedPrice = plan.weeklyPrice;
    let durationDays = 7;
    let subscriptionCycle = plan.duration || "1 Week";

    if (cycleNormalized.includes("YEAR") || cycleNormalized === "YEARLY" || planDuration.includes("year")) {
        calculatedPrice = plan.yearlyPrice || plan.weeklyPrice;
        durationDays = 365;
        subscriptionCycle = "1 Year";
    } else if (cycleNormalized.includes("6 MONTH") || cycleNormalized === "6 MONTHS" || cycleNormalized === "HALF_YEARLY" || planDuration.includes("6 month")) {
        calculatedPrice = plan.monthlyPrice ? plan.monthlyPrice * 6 : plan.weeklyPrice;
        durationDays = 180;
        subscriptionCycle = "6 Months";
    } else if (cycleNormalized.includes("QUARTER") || cycleNormalized === "QUARTERLY" || cycleNormalized.includes("3 MONTH") || planDuration.includes("quarter") || planDuration.includes("3 month")) {
        calculatedPrice = plan.quarterlyPrice || plan.monthlyPrice || plan.weeklyPrice;
        durationDays = 90;
        subscriptionCycle = "3 Months";
    } else if (cycleNormalized.includes("MONTH") || cycleNormalized === "MONTHLY" || cycleNormalized.includes("1 MONTH") || planDuration.includes("month")) {
        calculatedPrice = plan.monthlyPrice || plan.weeklyPrice;
        durationDays = 30;
        subscriptionCycle = "1 Month";
    } else if (cycleNormalized.includes("2 WEEK") || cycleNormalized === "BIWEEKLY" || planDuration.includes("2 week")) {
        calculatedPrice = plan.weeklyPrice;
        durationDays = 14;
        subscriptionCycle = "2 Weeks";
    } else {
        calculatedPrice = plan.weeklyPrice;
        durationDays = 7;
        subscriptionCycle = "1 Week";
    }

    // Dynamic Start Date Calculation
    const now = new Date();
    let startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 8, 0, 0); // default tomorrow

    if (customStartDate) {
        const parsed = new Date(customStartDate);
        if (!isNaN(parsed.getTime())) {
            startDate = parsed;
        }
    } else if (startDatePreference) {
        const pref = String(startDatePreference).toLowerCase().trim();
        if (pref.includes("tomorrow") || pref === "tomorrow") {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 8, 0, 0);
        } else if (pref.includes("monday") || pref === "monday") {
            const day = now.getDay();
            let daysUntilMonday = (1 + 7 - day) % 7;
            if (daysUntilMonday === 0) daysUntilMonday = 7;
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilMonday, 8, 0, 0);
        } else if (pref.includes("1st") || pref.includes("month") || pref === "1st") {
            startDate = new Date(now.getFullYear(), now.getMonth() + 1, 1, 8, 0, 0);
        } else if (pref.includes("today") || pref === "today") {
            startDate = now;
        }
    }

    // Calculate end date based on durationDays
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationDays);

    const planSlots = await db.sellerMealPlanSlot.findMany({
        where: { planId: plan.id },
    });
    const subSlotIds = planSlots.length > 0
        ? planSlots.map((s) => s.slotId)
        : normalizeMealSlotIds(typeof plan.mealTimings === "string" ? JSON.parse(plan.mealTimings) : plan.mealTimings);
    const validSlotIds = subSlotIds.length > 0 ? subSlotIds : ["lunch"];

    const newSub = await db.userMealSubscription.create({
        data: {
            userId: session.user.id,
            sellerId: plan.sellerId,
            planId: plan.id,
            tier: plan.tier,
            status: "ACTIVE",
            cycle: subscriptionCycle,
            pricePaid: calculatedPrice,
            isPaused: false,
            startDate,
            endDate,
            deliveryAddress: String(deliveryAddress).trim(),
            contactPhone: contactPhone ? String(contactPhone).trim() : (session.user as any).phone || "",
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            slots: {
                create: validSlotIds.map((sId) => ({
                    slot: { connect: { id: sId } },
                })),
            },
        },
        include: {
            slots: {
                include: { slot: true }
            },
            plan: true,
            seller: {
                select: {
                    id: true,
                    businessName: true,
                    trackingId: true,
                    addressLocality: true,
                    foodType: true,
                    bannerImageUrl: true,
                }
            }
        }
    });

    // Increment subscriber count on plan
    await db.sellerMealPlan.update({
        where: { id: plan.id },
        data: { subscribersCount: { increment: 1 } }
    }).catch(() => {});

    emitMealSubscriptionUpdated(newSub.sellerId, newSub.userId, "CREATE", newSub);

    return newSub;
};

export const cancelUserMealSubscription = async (subscriptionId: string, reason?: string) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to manage your meal subscription.", 401);
    }

    const subscription = await db.userMealSubscription.findFirst({
        where: {
            id: subscriptionId,
            userId: session.user.id,
        },
        include: { plan: true }
    });

    if (!subscription) {
        throw new ApiError("Subscription not found or you do not have permission to cancel it.", 404);
    }

    // Dynamic seller policy enforcement: check if seller allowed cancellation
    if (subscription.plan && subscription.plan.allowCancel === false) {
        throw new ApiError(
            "Self-service cancellation is disabled by the kitchen partner for this meal plan. Please contact support or your kitchen partner for assistance.",
            400
        );
    }

    const updated = await db.userMealSubscription.update({
        where: { id: subscriptionId },
        data: {
            status: "CANCELLED",
            isPaused: false,
        }
    });

    // Decrement subscriber count on plan if it was active
    if (subscription.status === "ACTIVE" && subscription.plan.subscribersCount > 0) {
        await db.sellerMealPlan.update({
            where: { id: subscription.planId },
            data: { subscribersCount: { decrement: 1 } }
        }).catch(() => {});
    }

    emitMealSubscriptionUpdated(subscription.sellerId, session.user.id, "CANCEL", updated);

    return {
        success: true,
        message: "Meal subscription cancelled successfully",
        subscription: updated,
    };
};

export const changeUserMealPlan = async (subscriptionId: string, newPlanId: string) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to change your meal plan.", 401);
    }

    if (!newPlanId) {
        throw new ApiError("New plan ID is required", 400);
    }

    const subscription = await db.userMealSubscription.findFirst({
        where: {
            id: subscriptionId,
            userId: session.user.id,
        },
        include: { plan: true, seller: true }
    });

    if (!subscription) {
        throw new ApiError("Current subscription not found", 404);
    }

    const newPlan = await db.sellerMealPlan.findUnique({
        where: { id: newPlanId }
    });

    if (!newPlan || newPlan.status !== "Live") {
        throw new ApiError("The selected new meal plan is not available", 404);
    }

    // Ensure the new plan belongs to the SAME seller
    if (newPlan.sellerId !== subscription.sellerId) {
        throw new ApiError("You can only change plans within the same kitchen partner.", 400);
    }

    const planDuration = (newPlan.duration || "1 Week").toLowerCase();
    let subscriptionCycle = "1 Week";
    if (planDuration.includes("2 week")) subscriptionCycle = "2 Weeks";
    else if (planDuration.includes("1 week") || planDuration === "week") subscriptionCycle = "1 Week";
    else if (planDuration.includes("6 month")) subscriptionCycle = "6 Months";
    else if (planDuration.includes("1 month") || planDuration === "month") subscriptionCycle = "1 Month";
    else if (planDuration.includes("year")) subscriptionCycle = "1 Year";
    else subscriptionCycle = newPlan.duration || "1 Week";

    const updated = await db.userMealSubscription.update({
        where: { id: subscriptionId },
        data: {
            planId: newPlan.id,
            tier: newPlan.tier,
            status: "ACTIVE",
            cycle: subscriptionCycle,
            pricePaid: newPlan.weeklyPrice,
            updatedAt: new Date(),
        },
        include: {
            plan: true,
            seller: {
                select: {
                    id: true,
                    businessName: true,
                    trackingId: true,
                    addressLocality: true,
                    foodType: true,
                    bannerImageUrl: true,
                }
            }
        }
    });

    // Update subscriber counts on both plans
    if (subscription.planId !== newPlan.id) {
        if (subscription.plan && subscription.plan.subscribersCount > 0) {
            await db.sellerMealPlan.update({
                where: { id: subscription.planId },
                data: { subscribersCount: { decrement: 1 } }
            }).catch(() => {});
        }
        await db.sellerMealPlan.update({
            where: { id: newPlan.id },
            data: { subscribersCount: { increment: 1 } }
        }).catch(() => {});
    }

    emitMealSubscriptionUpdated(updated.sellerId, session.user.id, "UPDATE", updated);

    return {
        success: true,
        message: `Plan changed successfully to ${newPlan.name}!`,
        subscription: updated,
    };
};

export const togglePauseUserMealSubscription = async (
    subscriptionId: string,
    isPaused: boolean,
    requestedDays?: number
) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to manage your subscription status.", 401);
    }

    if (isPaused) {
        return await SubscriptionPauseService.pauseSubscription(
            subscriptionId,
            session.user.id,
            requestedDays
        );
    } else {
        return await SubscriptionPauseService.resumeSubscription(
            subscriptionId,
            session.user.id
        );
    }
};
