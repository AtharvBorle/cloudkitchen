import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { emitMealPlanUpdated, emitMealSubscriptionUpdated } from "@/lib/realtime-events";
import { getCategoryExpiries } from "@/lib/subscription";
import { PREDEFINED_MEAL_SLOTS, normalizeMealSlotId, normalizeMealSlotIds, getMealSlotDetails } from "@/lib/meal-slots";
import { MealSubscriptionDeliveryService } from "@/services/mealSubscriptionDeliveryService";

export const getAuthenticatedSellerProfile = async () => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to manage meal plans.", 401);
    }
    const userRole = (session.user.role || "").toUpperCase();
    if (userRole !== "SELLER" && userRole !== "ADMIN" && userRole !== "SUPERADMIN") {
        throw new ApiError("Access denied. Seller account required to manage meal plans.", 403);
    }

    const sellerProfile = await db.sellerProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!sellerProfile) {
        throw new ApiError("Seller profile not found. Please complete seller registration.", 404);
    }

    const activeSubs = await db.subscription.findMany({
        where: {
            sellerId: sellerProfile.id,
            status: "ACTIVE",
            validUntil: {
                gt: new Date()
            }
        },
        include: {
            plan: true
        }
    });

    const { foodExpiry } = getCategoryExpiries(activeSubs);
    const isFoodActive = (foodExpiry ? foodExpiry > new Date() : false) && sellerProfile.foodVerificationStatus === "APPROVED";

    if (!isFoodActive && sellerProfile.verificationStatus !== "APPROVED") {
        throw new ApiError("An active Food subscription and approved verification are required to manage meal plans.", 403);
    }

    return { session, sellerProfile };
};

export const getSellerMealPlans = async () => {
    const { sellerProfile } = await getAuthenticatedSellerProfile();

    const dbPlans = await db.sellerMealPlan.findMany({
        where: { sellerId: sellerProfile.id },
        include: {
            slots: {
                include: { slot: true }
            },
            userSubscriptions: {
                include: {
                    slots: {
                        include: { slot: true }
                    },
                    user: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                            email: true,
                        }
                    }
                },
                orderBy: { createdAt: "desc" }
            }
        },
        orderBy: { createdAt: "desc" }
    });

    // Also fetch all user meal subscriptions linked to this seller directly
    const directSubs = await db.userMealSubscription.findMany({
        where: { sellerId: sellerProfile.id },
        include: {
            slots: {
                include: { slot: true }
            },
            user: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    email: true,
                }
            },
            plan: {
                include: {
                    slots: {
                        include: { slot: true }
                    }
                }
            }
        },
        orderBy: { createdAt: "desc" }
    });

    const sellerSetting = await db.systemSettings.findUnique({
        where: { key: `SELLER_MEAL_TIMINGS_${sellerProfile.id}` },
    });
    let sellerCustomTimes: Record<string, string> = {};
    if (sellerSetting?.value) {
        try { sellerCustomTimes = JSON.parse(sellerSetting.value); } catch {}
    }

    const platformSetting = await db.systemSettings.findUnique({
        where: { key: "MEAL_SUBSCRIPTION_SLOTS" },
    });
    let platformCustomTimes: Record<string, string> = {};
    if (platformSetting?.value) {
        try { platformCustomTimes = JSON.parse(platformSetting.value); } catch {}
    }
    const combinedSellerTimes = { ...platformCustomTimes, ...sellerCustomTimes };

    const now = new Date();
    const isSubscriptionActive = (sub: any) => {
        const statusStr = String(sub.status || "").toUpperCase().trim();
        if (statusStr === "EXPIRED" || statusStr === "CANCELLED" || statusStr === "PAUSED") return false;
        const isStatusActive = statusStr === "ACTIVE" || statusStr === "LIVE" || statusStr === "EXPIRING SOON";
        const notPaused = !sub.isPaused;
        const notExpired = !sub.endDate || new Date(sub.endDate) >= now;
        return isStatusActive && notPaused && notExpired;
    };

    const getPlanBasePrice = (plan: any) => {
        const dur = String(plan?.duration || "1 Week").toLowerCase();
        if (dur.includes("year") && plan?.yearlyPrice && Number(plan.yearlyPrice) > 0) {
            return Number(plan.yearlyPrice);
        }
        if ((dur.includes("quarter") || dur.includes("3 month")) && plan?.quarterlyPrice && Number(plan.quarterlyPrice) > 0) {
            return Number(plan.quarterlyPrice);
        }
        if (dur.includes("month") && plan?.monthlyPrice && Number(plan.monthlyPrice) > 0) {
            return Number(plan.monthlyPrice);
        }
        return Number(plan?.weeklyPrice) || Number(plan?.rawWeeklyPrice) || Number(plan?.monthlyPrice) || 0;
    };

    // Extract all subscribers across seller's plans and direct subscriptions without duplicates
    const allSubscribers: any[] = [];
    const seenSubIds = new Set<string>();

    const appendSub = (sub: any, planName?: string, planTier?: string, planId?: string, planObj?: any) => {
        if (!sub?.id || seenSubIds.has(sub.id)) return;
        seenSubIds.add(sub.id);

        // Check if pause expired naturally
        if (sub.isPaused && sub.pauseEndDate && new Date(sub.pauseEndDate) <= now) {
            sub.isPaused = false;
            sub.status = "ACTIVE";
        }
        // Check if subscription expired naturally
        if (sub.endDate && new Date(sub.endDate) < now) {
            sub.isPaused = false;
            sub.status = "EXPIRED";
        }

        const resolvedPrice = Number(sub.pricePaid) > 0 ? Number(sub.pricePaid) : getPlanBasePrice(planObj || sub.plan);

        let parsedMealTimings: string[] = [];
        try {
            const rawTimings = planObj?.mealTimings || sub.plan?.mealTimings;
            parsedMealTimings = typeof rawTimings === "string" ? JSON.parse(rawTimings) : (Array.isArray(rawTimings) ? rawTimings : []);
        } catch {
            parsedMealTimings = [];
        }

        let parsedPauseHistory: any[] = [];
        try {
            parsedPauseHistory = typeof sub.pauseHistory === "string" ? JSON.parse(sub.pauseHistory) : (Array.isArray(sub.pauseHistory) ? sub.pauseHistory : []);
        } catch {
            parsedPauseHistory = [];
        }

        let parsedDailyDeliveries: any[] = [];
        try {
            parsedDailyDeliveries = typeof sub.dailyDeliveries === "string" ? JSON.parse(sub.dailyDeliveries) : (Array.isArray(sub.dailyDeliveries) ? sub.dailyDeliveries : []);
        } catch {
            parsedDailyDeliveries = [];
        }

        const pauseBillingPeriod = planObj?.pauseBillingPeriod || sub.plan?.pauseBillingPeriod || "7 Days";

        const rawSubSlots = sub.slots && sub.slots.length > 0
            ? sub.slots.map((s: any) => s.slotId)
            : (planObj?.slots && planObj.slots.length > 0
                ? planObj.slots.map((s: any) => s.slotId)
                : parsedMealTimings);
        const resolvedSlotIds = normalizeMealSlotIds(rawSubSlots);
        const resolvedSlotDetails = resolvedSlotIds.map((id) => {
            const base = getMealSlotDetails(id);
            const dbSlot = sub.slots?.find((s: any) => s.slotId === id)?.slot ||
                           planObj?.slots?.find((s: any) => s.slotId === id)?.slot;
            const customTime = (
                combinedSellerTimes[id] ||
                combinedSellerTimes[id.replace(/-/g, '_')] ||
                combinedSellerTimes[id.replace(/_/g, '-')] ||
                dbSlot?.defaultTimeRange ||
                ""
            ).trim();
            return {
                ...base,
                defaultTimeRange: customTime || base.defaultTimeRange || "",
            };
        });

        const resolvedTimings = resolvedSlotIds.map((id) => {
            const detail = resolvedSlotDetails.find((d) => d.id === id);
            const name = detail?.name || getMealSlotDetails(id).name;
            const time = detail?.defaultTimeRange || "";
            return time ? `${name}: ${time}` : name;
        });

        allSubscribers.push({
            id: sub.id,
            userId: sub.user?.id || sub.userId || "",
            planId: planId || sub.planId || "",
            planName: planName || sub.plan?.name || "Meal Plan",
            tier: sub.tier || planTier || sub.plan?.tier || "Bronze",
            customerName: sub.user?.name || "Customer",
            customerPhone: sub.contactPhone || sub.user?.phone || "",
            customerEmail: sub.user?.email || "",
            deliveryAddress: sub.deliveryAddress || "",
            status: isSubscriptionActive(sub) ? "ACTIVE" : (sub.isPaused ? "PAUSED" : (sub.endDate && new Date(sub.endDate) < now ? "EXPIRED" : sub.status)),
            rawStatus: sub.status,
            isPaused: Boolean(sub.isPaused),
            pausedAt: sub.pausedAt ? (sub.pausedAt instanceof Date ? sub.pausedAt.toISOString() : String(sub.pausedAt)) : null,
            pauseEndDate: sub.pauseEndDate ? (sub.pauseEndDate instanceof Date ? sub.pauseEndDate.toISOString() : String(sub.pauseEndDate)) : null,
            usedPauseDays: Number(sub.usedPauseDays || 0),
            pauseHistory: parsedPauseHistory,
            dailyDeliveries: parsedDailyDeliveries,
            mealTimings: resolvedTimings,
            mealSlots: resolvedSlotDetails,
            slotIds: resolvedSlotIds,
            pauseBillingPeriod,
            cycle: sub.cycle || "Weekly",
            startDate: sub.startDate instanceof Date ? sub.startDate.toISOString() : String(sub.startDate),
            endDate: sub.endDate ? (sub.endDate instanceof Date ? sub.endDate.toISOString() : String(sub.endDate)) : null,
            pricePaid: resolvedPrice,
        });
    };

    dbPlans.forEach((plan) => {
        plan.userSubscriptions.forEach((sub) => {
            appendSub(sub, plan.name, plan.tier, plan.id, plan);
        });
    });

    directSubs.forEach((sub) => {
        appendSub(sub, sub.plan?.name, sub.plan?.tier, sub.planId, sub.plan);
    });

    // Format plans for frontend consumption
    const plans = dbPlans.map((plan) => {
        let parsedFeatures: string[] = [];
        try {
            parsedFeatures = typeof plan.features === "string" ? JSON.parse(plan.features) : plan.features;
        } catch {
            parsedFeatures = [];
        }

        let parsedTimings: string[] = [];
        try {
            parsedTimings = typeof plan.mealTimings === "string" ? JSON.parse(plan.mealTimings) : plan.mealTimings;
        } catch {
            parsedTimings = [];
        }

        const planSlotIds = plan.slots && plan.slots.length > 0
            ? plan.slots.map((s: any) => s.slotId)
            : normalizeMealSlotIds(parsedTimings);
        const planSlotDetails = planSlotIds.map((id: string) => {
            const base = getMealSlotDetails(id);
            const dbSlot = plan.slots?.find((s: any) => s.slotId === id)?.slot;
            const customTime = (
                combinedSellerTimes[id] ||
                combinedSellerTimes[id.replace(/-/g, '_')] ||
                combinedSellerTimes[id.replace(/_/g, '-')] ||
                dbSlot?.defaultTimeRange ||
                ""
            ).trim();
            return {
                ...base,
                defaultTimeRange: customTime || base.defaultTimeRange || "",
            };
        });

        const resolvedTimings = planSlotIds.map((id: string) => {
            const detail = planSlotDetails.find((d) => d.id === id);
            const name = detail?.name || getMealSlotDetails(id).name;
            const time = detail?.defaultTimeRange || "";
            return time ? `${name}: ${time}` : name;
        });

        // Count active subscriptions for this specific plan (deduplicated by subscription ID)
        const planActiveSubIds = new Set<string>();

        // 1. Direct Prisma userSubscriptions relations
        (plan.userSubscriptions || []).forEach((s) => {
            if (isSubscriptionActive(s) && s.id) {
                planActiveSubIds.add(String(s.id).toLowerCase().trim());
            }
        });

        // 2. Cross-match against allSubscribers (catches directSubs, name matching, ID matching)
        allSubscribers.forEach((s) => {
            if (!isSubscriptionActive(s)) return;

            const matchesPlanId = s.planId && (s.planId === plan.id || s.planId.toLowerCase() === plan.id.toLowerCase());
            const matchesPlanName = s.planName && plan.name && s.planName.trim().toLowerCase() === plan.name.trim().toLowerCase();

            if ((matchesPlanId || matchesPlanName) && s.id) {
                planActiveSubIds.add(String(s.id).toLowerCase().trim());
            }
        });

        const activeSubscribers = planActiveSubIds.size;

        return {
            id: plan.id,
            name: plan.name,
            tier: plan.tier,
            description: plan.description || "",
            weeklyPrice: plan.weeklyPrice != null ? `₹${Number(plan.weeklyPrice).toFixed(0)}` : "₹0",
            rawWeeklyPrice: getPlanBasePrice(plan),
            monthlyPrice: plan.monthlyPrice != null ? `₹${Number(plan.monthlyPrice).toFixed(0)}` : "",
            quarterlyPrice: plan.quarterlyPrice != null ? `₹${Number(plan.quarterlyPrice).toFixed(0)}` : "",
            yearlyPrice: plan.yearlyPrice != null ? `₹${Number(plan.yearlyPrice).toFixed(0)}` : "",
            duration: plan.duration,
            features: parsedFeatures,
            mealTimings: resolvedTimings,
            mealSlots: planSlotDetails,
            slotIds: planSlotIds,
            status: plan.status,
            allowCancel: plan.allowCancel,
            pauseBillingPeriod: plan.pauseBillingPeriod,
            allowPause: plan.pauseBillingPeriod !== "None" && plan.pauseBillingPeriod !== "disabled",
            allowPauseBilling: plan.pauseBillingPeriod !== "None" && plan.pauseBillingPeriod !== "disabled",
            subscribersCount: activeSubscribers,
            createdAt: plan.createdAt.toISOString(),
            updatedAt: plan.updatedAt.toISOString(),
        };
    });

    const activeSubscriptionsList = allSubscribers.filter(isSubscriptionActive);
    const activeSubscribersCount = activeSubscriptionsList.length;
    const activePlansCount = plans.filter((p) => p.status === "Live").length;
    const mrrTotal = activeSubscriptionsList.reduce((sum, s) => {
        if (s.pricePaid && Number(s.pricePaid) > 0) return sum + Number(s.pricePaid);
        const matchedPlan = plans.find(
            (p) =>
                (s.planId && (s.planId === p.id || s.planId.toLowerCase() === p.id.toLowerCase())) ||
                (s.planName && p.name && s.planName.trim().toLowerCase() === p.name.trim().toLowerCase())
        );
        return sum + (matchedPlan?.rawWeeklyPrice || 0);
    }, 0);

    return {
        plans,
        subscribers: allSubscribers,
        metrics: {
            activeSubscribers: activeSubscribersCount,
            monthlyRecurringRevenue: mrrTotal > 0 ? `₹${mrrTotal.toLocaleString("en-IN")}` : "₹0",
            rawMRR: mrrTotal,
            activePlansCount,
            fulfillmentRate: "99.2%",
        }
    };
};

const buildPlanIdWhereClause = (sellerId: string, rawPlanId: string) => {
    const clean = String(rawPlanId || "").trim();
    const prefix = clean.toUpperCase().startsWith("PLN-") ? clean.slice(4).trim() : "";
    if (prefix && prefix.length >= 3) {
        return {
            sellerId,
            OR: [
                { id: clean },
                { id: { startsWith: prefix, mode: "insensitive" as const } },
            ],
        };
    }
    return { id: clean, sellerId };
};

export const getSellerMealPlanById = async (planId: string) => {
    const { sellerProfile } = await getAuthenticatedSellerProfile();

    const plan = await db.sellerMealPlan.findFirst({
        where: buildPlanIdWhereClause(sellerProfile.id, planId),
        include: {
            userSubscriptions: {
                include: {
                    user: { select: { id: true, name: true, phone: true, email: true } }
                }
            }
        }
    });

    if (!plan) {
        throw new ApiError("Meal subscription plan could not be found or you do not have permission to access it.", 404);
    }

    let parsedFeatures: string[] = [];
    try {
        parsedFeatures = typeof plan.features === "string" ? JSON.parse(plan.features) : plan.features;
    } catch {
        parsedFeatures = [];
    }

    let parsedTimings: string[] = [];
    try {
        parsedTimings = typeof plan.mealTimings === "string" ? JSON.parse(plan.mealTimings) : plan.mealTimings;
    } catch {
        parsedTimings = [];
    }

    const activeSubUsers = new Set(
        (plan.userSubscriptions || [])
            .filter((s) => {
                const statusStr = String(s.status || "").toUpperCase().trim();
                const notPaused = !s.isPaused;
                const notExpired = !s.endDate || new Date(s.endDate) >= new Date();
                return (statusStr === "ACTIVE" || statusStr === "LIVE") && notPaused && notExpired;
            })
            .map((s) => s.user?.id || s.userId || s.id)
            .filter(Boolean)
    );
    const subCount = activeSubUsers.size;

    const isWeekly = (plan.duration || "1 Week").toLowerCase().includes("week");
    return {
        id: plan.id,
        name: plan.name,
        tier: plan.tier,
        description: plan.description || "",
        weeklyPrice: plan.weeklyPrice != null ? `₹${Number(plan.weeklyPrice).toFixed(0)}` : "₹0",
        rawWeeklyPrice: plan.weeklyPrice ?? 0,
        monthlyPrice: plan.monthlyPrice != null ? `₹${Number(plan.monthlyPrice).toFixed(0)}` : "",
        quarterlyPrice: plan.quarterlyPrice != null ? `₹${Number(plan.quarterlyPrice).toFixed(0)}` : "",
        yearlyPrice: plan.yearlyPrice != null ? `₹${Number(plan.yearlyPrice).toFixed(0)}` : "",
        duration: plan.duration,
        features: parsedFeatures,
        mealTimings: parsedTimings,
        status: plan.status,
        allowCancel: plan.allowCancel,
        pauseBillingPeriod: plan.pauseBillingPeriod,
        subscribersCount: subCount,
        createdAt: plan.createdAt.toISOString(),
        updatedAt: plan.updatedAt.toISOString(),
    };
};

export const createSellerMealPlan = async (req: Request) => {
    const { sellerProfile } = await getAuthenticatedSellerProfile();

    const body = await req.json();
    const {
        name,
        tier = "Bronze",
        description = "",
        weeklyPrice,
        monthlyPrice,
        quarterlyPrice,
        yearlyPrice,
        duration = "1 Week",
        features = [],
        mealTimings = [],
        status = "Live",
        allowCancel = false,
        pauseBillingPeriod = "30 Days",
    } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
        throw new ApiError("Plan Name is required", 400);
    }

    if (typeof weeklyPrice === "number" && weeklyPrice <= 0) {
        throw new ApiError("A valid positive Price (₹) greater than 0 is required", 400);
    }
    if (typeof weeklyPrice === "string" && (weeklyPrice.includes("-") || !weeklyPrice.trim())) {
        throw new ApiError("A valid positive Price (₹) greater than 0 is required", 400);
    }
    const numericWeeklyPrice = parseFloat(String(weeklyPrice).replace(/[^0-9.]/g, ""));
    if (isNaN(numericWeeklyPrice) || numericWeeklyPrice <= 0) {
        throw new ApiError("A valid positive Price (₹) greater than 0 is required", 400);
    }

    const isWeekly = (duration || "1 Week").toLowerCase().includes("week");
    const numericMonthly = monthlyPrice
        ? parseFloat(String(monthlyPrice).replace(/[^0-9.]/g, ""))
        : (isWeekly ? null : numericWeeklyPrice);
    const numericQuarterly = quarterlyPrice
        ? parseFloat(String(quarterlyPrice).replace(/[^0-9.]/g, ""))
        : null;
    const numericYearly = yearlyPrice
        ? parseFloat(String(yearlyPrice).replace(/[^0-9.]/g, ""))
        : null;

    const pausePeriodInput = String(body.pauseBillingPeriod || pauseBillingPeriod || "").trim().toLowerCase();
    const isPauseDisabled =
        body.allowPause === false ||
        body.allowPauseBilling === false ||
        pausePeriodInput === "none" ||
        pausePeriodInput === "disabled" ||
        pausePeriodInput === "false";

    const rawSlotsInput = body.mealSlots ?? body.slotIds ?? body.mealTimings ?? mealTimings;
    const normalizedSlotIds = normalizeMealSlotIds(Array.isArray(rawSlotsInput) ? rawSlotsInput : [rawSlotsInput]);

    if (normalizedSlotIds.length === 0) {
        throw new ApiError("Please select at least one meal slot for this subscription plan.", 400);
    }

    // Verify that every selected meal slot has delivery timings configured
    const slotSetting = await db.systemSettings.findUnique({
        where: { key: "MEAL_SUBSCRIPTION_SLOTS" },
    });
    let customTimes: Record<string, string> = {};
    if (slotSetting?.value) {
        try { customTimes = JSON.parse(slotSetting.value); } catch {}
    }

    if (sellerProfile?.id) {
        const sellerSetting = await db.systemSettings.findUnique({
            where: { key: `SELLER_MEAL_TIMINGS_${sellerProfile.id}` },
        });
        if (sellerSetting?.value) {
            try {
                const sellerTimes = JSON.parse(sellerSetting.value);
                customTimes = { ...customTimes, ...sellerTimes };
            } catch {}
        }
    }

    const dbSlots = await db.mealSlot.findMany({
        where: { id: { in: normalizedSlotIds } },
    });

    const missingSlots: string[] = [];
    for (const slotId of normalizedSlotIds) {
        const slotRecord = dbSlots.find((s) => s.id === slotId);
        const configuredTime = (
            customTimes[slotId] ||
            customTimes[slotId.replace(/-/g, '_')] ||
            customTimes[slotId.replace(/_/g, '-')] ||
            slotRecord?.defaultTimeRange ||
            ""
        ).trim();
        const inlineTimingMatch = Array.isArray(body.mealTimings)
            ? body.mealTimings.find((t: string) => typeof t === "string" && normalizeMealSlotId(t) === slotId && t.includes(":"))
            : null;
        const inlineTime = inlineTimingMatch ? inlineTimingMatch.split(":").slice(1).join(":").trim() : "";
        if (!configuredTime && !inlineTime) {
            missingSlots.push(slotRecord?.name || getMealSlotDetails(slotId).name);
        }
    }

    if (missingSlots.length > 0) {
        throw new ApiError(
            `Delivery timing is not configured for: ${missingSlots.join(", ")}. Please configure delivery timings in Manage Meal Subscription Timings first before creating this plan.`,
            400
        );
    }

    const planTimingsArray = normalizedSlotIds.map((slotId) => {
        const slotRecord = dbSlots.find((s) => s.id === slotId);
        const slotName = slotRecord?.name || getMealSlotDetails(slotId).name;
        const configuredTime = (
            customTimes[slotId] ||
            customTimes[slotId.replace(/-/g, '_')] ||
            customTimes[slotId.replace(/_/g, '-')] ||
            slotRecord?.defaultTimeRange ||
            ""
        ).trim();
        const inlineTimingMatch = Array.isArray(body.mealTimings)
            ? body.mealTimings.find((t: string) => typeof t === "string" && normalizeMealSlotId(t) === slotId && t.includes(":"))
            : null;
        const inlineTime = inlineTimingMatch ? inlineTimingMatch.split(":").slice(1).join(":").trim() : "";
        const finalTime = configuredTime || inlineTime;
        return finalTime ? `${slotName}: ${finalTime}` : slotName;
    });

    const newPlan = await db.sellerMealPlan.create({
        data: {
            sellerId: sellerProfile.id,
            name: name.trim(),
            tier: ["Bronze", "Silver", "Gold"].includes(tier) ? tier : "Bronze",
            description: description || "",
            weeklyPrice: numericWeeklyPrice,
            monthlyPrice: numericMonthly,
            quarterlyPrice: numericQuarterly,
            yearlyPrice: numericYearly,
            duration: duration || "1 Week",
            features: JSON.stringify(Array.isArray(features) ? features : []),
            mealTimings: JSON.stringify(planTimingsArray),
            status: status || "Live",
            allowCancel: allowCancel !== undefined ? Boolean(allowCancel) : false,
            pauseBillingPeriod: isPauseDisabled ? "None" : (pauseBillingPeriod || "30 Days"),
            slots: {
                create: normalizedSlotIds.map((slotId) => ({
                    slot: { connect: { id: slotId } },
                })),
            },
        },
        include: {
            slots: {
                include: { slot: true }
            }
        }
    });

    emitMealPlanUpdated(sellerProfile.id, "CREATE", newPlan);

    const planSlotDetails = newPlan.slots.map((s) => s.slot);

    return {
        id: newPlan.id,
        name: newPlan.name,
        tier: newPlan.tier,
        description: newPlan.description,
        weeklyPrice: newPlan.weeklyPrice != null ? `₹${Number(newPlan.weeklyPrice).toFixed(0)}` : "₹0",
        rawWeeklyPrice: newPlan.weeklyPrice ?? 0,
        monthlyPrice: newPlan.monthlyPrice != null ? `₹${Number(newPlan.monthlyPrice).toFixed(0)}` : "",
        quarterlyPrice: newPlan.quarterlyPrice != null ? `₹${Number(newPlan.quarterlyPrice).toFixed(0)}` : "",
        yearlyPrice: newPlan.yearlyPrice != null ? `₹${Number(newPlan.yearlyPrice).toFixed(0)}` : "",
        duration: newPlan.duration,
        features: Array.isArray(features) ? features : [],
        mealTimings: normalizedSlotIds,
        mealSlots: planSlotDetails,
        slotIds: normalizedSlotIds,
        status: newPlan.status,
        allowCancel: newPlan.allowCancel,
        pauseBillingPeriod: newPlan.pauseBillingPeriod,
        allowPause: !isPauseDisabled,
        allowPauseBilling: !isPauseDisabled,
        subscribersCount: 0,
        createdAt: newPlan.createdAt.toISOString(),
        updatedAt: newPlan.updatedAt.toISOString(),
    };
};

export const updateSellerMealPlan = async (req: Request) => {
    const { sellerProfile } = await getAuthenticatedSellerProfile();

    const body = await req.json();
    const url = new URL(req.url);
    const planId = body.id || body.planId || url.searchParams.get("id");

    if (!planId) {
        throw new ApiError("Plan ID is required", 400);
    }

    const existingPlan = await db.sellerMealPlan.findFirst({
        where: buildPlanIdWhereClause(sellerProfile.id, planId)
    });

    if (!existingPlan) {
        throw new ApiError("Meal subscription plan could not be found or you do not have permission to access it.", 404);
    }

    const updateData: any = {};

    if (body.name !== undefined && String(body.name).trim()) {
        updateData.name = String(body.name).trim();
    }
    if (body.tier !== undefined && ["Bronze", "Silver", "Gold"].includes(body.tier)) {
        updateData.tier = body.tier;
    }
    if (body.description !== undefined) {
        updateData.description = body.description;
    }
    if (body.weeklyPrice !== undefined) {
        if (typeof body.weeklyPrice === "string" && body.weeklyPrice.includes("-")) {
            throw new ApiError("Price cannot be negative", 400);
        }
        const num = parseFloat(String(body.weeklyPrice).replace(/[^0-9.]/g, ""));
        if (isNaN(num) || num <= 0) {
            throw new ApiError("A valid positive Price (₹) greater than 0 is required", 400);
        }
        updateData.weeklyPrice = num;
        if (!body.monthlyPrice) {
            const isWeekly = (body.duration || existingPlan.duration || "").toLowerCase().includes("week");
            updateData.monthlyPrice = isWeekly ? null : num;
        }
        if (body.quarterlyPrice !== undefined) {
            updateData.quarterlyPrice = body.quarterlyPrice ? parseFloat(String(body.quarterlyPrice).replace(/[^0-9.]/g, "")) : null;
        }
        if (body.yearlyPrice !== undefined) {
            updateData.yearlyPrice = body.yearlyPrice ? parseFloat(String(body.yearlyPrice).replace(/[^0-9.]/g, "")) : null;
        }
    }
    if (body.monthlyPrice !== undefined) {
        const num = parseFloat(String(body.monthlyPrice).replace(/[^0-9.]/g, "")) ;
        if (!isNaN(num)) updateData.monthlyPrice = num;
    }
    if (body.duration !== undefined) {
        updateData.duration = body.duration;
    }
    if (body.features !== undefined) {
        updateData.features = JSON.stringify(Array.isArray(body.features) ? body.features : []);
    }
    if (body.mealSlots !== undefined || body.slotIds !== undefined || body.mealTimings !== undefined) {
        const rawSlots = body.mealSlots ?? body.slotIds ?? body.mealTimings;
        const normalizedSlotIds = normalizeMealSlotIds(Array.isArray(rawSlots) ? rawSlots : [rawSlots]);
        if (normalizedSlotIds.length === 0) {
            throw new ApiError("Please select at least one meal slot for this subscription plan.", 400);
        }

        const slotSetting = await db.systemSettings.findUnique({
            where: { key: "MEAL_SUBSCRIPTION_SLOTS" },
        });
        let customTimes: Record<string, string> = {};
        if (slotSetting?.value) {
            try { customTimes = JSON.parse(slotSetting.value); } catch {}
        }

        if (sellerProfile?.id) {
            const sellerSetting = await db.systemSettings.findUnique({
                where: { key: `SELLER_MEAL_TIMINGS_${sellerProfile.id}` },
            });
            if (sellerSetting?.value) {
                try {
                    const sellerTimes = JSON.parse(sellerSetting.value);
                    customTimes = { ...customTimes, ...sellerTimes };
                } catch {}
            }
        }

        const dbSlots = await db.mealSlot.findMany({
            where: { id: { in: normalizedSlotIds } },
        });
        const missingSlots: string[] = [];
        for (const slotId of normalizedSlotIds) {
            const slotRecord = dbSlots.find((s) => s.id === slotId);
            const configuredTime = (
                customTimes[slotId] ||
                customTimes[slotId.replace(/-/g, '_')] ||
                customTimes[slotId.replace(/_/g, '-')] ||
                slotRecord?.defaultTimeRange ||
                ""
            ).trim();
            const inlineTimingMatch = Array.isArray(body.mealTimings)
                ? body.mealTimings.find((t: string) => typeof t === "string" && normalizeMealSlotId(t) === slotId && t.includes(":"))
                : null;
            const inlineTime = inlineTimingMatch ? inlineTimingMatch.split(":").slice(1).join(":").trim() : "";
            if (!configuredTime && !inlineTime) {
                missingSlots.push(slotRecord?.name || getMealSlotDetails(slotId).name);
            }
        }
        if (missingSlots.length > 0) {
            throw new ApiError(
                `Delivery timing is not configured for: ${missingSlots.join(", ")}. Please configure delivery timings in Manage Meal Subscription Timings first before saving this plan.`,
                400
            );
        }

        const planTimingsArray = normalizedSlotIds.map((slotId) => {
            const slotRecord = dbSlots.find((s) => s.id === slotId);
            const slotName = slotRecord?.name || getMealSlotDetails(slotId).name;
            const configuredTime = (
                customTimes[slotId] ||
                customTimes[slotId.replace(/-/g, '_')] ||
                customTimes[slotId.replace(/_/g, '-')] ||
                slotRecord?.defaultTimeRange ||
                ""
            ).trim();
            const inlineTimingMatch = Array.isArray(body.mealTimings)
                ? body.mealTimings.find((t: string) => typeof t === "string" && normalizeMealSlotId(t) === slotId && t.includes(":"))
                : null;
            const inlineTime = inlineTimingMatch ? inlineTimingMatch.split(":").slice(1).join(":").trim() : "";
            const finalTime = configuredTime || inlineTime;
            return finalTime ? `${slotName}: ${finalTime}` : slotName;
        });

        updateData.mealTimings = JSON.stringify(planTimingsArray);
        await db.sellerMealPlanSlot.deleteMany({ where: { planId: existingPlan.id } });
        await db.sellerMealPlanSlot.createMany({
            data: normalizedSlotIds.map((sId) => ({ planId: existingPlan.id, slotId: sId })),
        });
    }
    if (body.status !== undefined) {
        updateData.status = body.status;
    }
    if (body.allowCancel !== undefined) {
        updateData.allowCancel = Boolean(body.allowCancel);
    }
    const rawPauseStr = String(body.pauseBillingPeriod || "").trim().toLowerCase();
    if (
        body.allowPause === false ||
        body.allowPauseBilling === false ||
        rawPauseStr === "none" ||
        rawPauseStr === "disabled" ||
        rawPauseStr === "false"
    ) {
        updateData.pauseBillingPeriod = "None";
    } else if (body.pauseBillingPeriod !== undefined) {
        updateData.pauseBillingPeriod = body.pauseBillingPeriod;
    } else if (body.allowPause === true || body.allowPauseBilling === true) {
        if (existingPlan.pauseBillingPeriod === "None" || existingPlan.pauseBillingPeriod === "disabled") {
            updateData.pauseBillingPeriod = "30 Days";
        }
    }

    const updated = await db.sellerMealPlan.update({
        where: { id: existingPlan.id },
        data: updateData
    });

    if (updateData.weeklyPrice !== undefined || updateData.monthlyPrice !== undefined) {
        const updatedBasePrice = updated.monthlyPrice && !(updated.duration || "").toLowerCase().includes("week")
            ? updated.monthlyPrice
            : updated.weeklyPrice;
        if (updatedBasePrice && updatedBasePrice > 0) {
            await db.userMealSubscription.updateMany({
                where: { planId: existingPlan.id, status: "ACTIVE" },
                data: { pricePaid: updatedBasePrice }
            });
        }
    }

    const updatedPauseLower = String(updated.pauseBillingPeriod || "").trim().toLowerCase();
    const isUpdatedPauseDisabled =
        updatedPauseLower === "none" ||
        updatedPauseLower === "disabled" ||
        updatedPauseLower === "false";

    if (isUpdatedPauseDisabled) {
        await db.userMealSubscription.updateMany({
            where: { planId: existingPlan.id, isPaused: true },
            data: { isPaused: false, status: "ACTIVE" }
        });
    }

    let parsedFeatures: string[] = [];
    try {
        parsedFeatures = typeof updated.features === "string" ? JSON.parse(updated.features) : updated.features;
    } catch {
        parsedFeatures = [];
    }

    let parsedTimings: string[] = [];
    try {
        parsedTimings = typeof updated.mealTimings === "string" ? JSON.parse(updated.mealTimings) : updated.mealTimings;
    } catch {
        parsedTimings = [];
    }

    const updatedPlanWithSlots = await db.sellerMealPlan.findUnique({
        where: { id: existingPlan.id },
        include: { slots: { include: { slot: true } } },
    });
    const planSlotIds = updatedPlanWithSlots?.slots.map((s) => s.slotId) || normalizeMealSlotIds(parsedTimings);
    const planSlotDetails = planSlotIds.map((id) => getMealSlotDetails(id));

    emitMealPlanUpdated(sellerProfile.id, "UPDATE", updated);

    return {
        id: updated.id,
        name: updated.name,
        tier: updated.tier,
        description: updated.description,
        weeklyPrice: updated.weeklyPrice != null ? `₹${Number(updated.weeklyPrice).toFixed(0)}` : "₹0",
        rawWeeklyPrice: updated.weeklyPrice ?? 0,
        monthlyPrice: updated.monthlyPrice != null ? `₹${Number(updated.monthlyPrice).toFixed(0)}` : "",
        duration: updated.duration,
        features: parsedFeatures,
        mealTimings: planSlotIds,
        mealSlots: planSlotDetails,
        slotIds: planSlotIds,
        status: updated.status,
        allowCancel: updated.allowCancel,
        pauseBillingPeriod: updated.pauseBillingPeriod,
        allowPause: !isUpdatedPauseDisabled,
        allowPauseBilling: !isUpdatedPauseDisabled,
        subscribersCount: updated.subscribersCount || 0,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
    };
};

export const toggleSellerMealPlanStatus = async (req: Request, paramId?: string) => {
    const { sellerProfile } = await getAuthenticatedSellerProfile();

    let body: any = {};
    try {
        body = await req.json();
    } catch {
        // empty body
    }

    const url = new URL(req.url);
    const planId = paramId || body.id || body.planId || url.searchParams.get("id");

    if (!planId) {
        throw new ApiError("Plan ID is required", 400);
    }

    const existingPlan = await db.sellerMealPlan.findFirst({
        where: buildPlanIdWhereClause(sellerProfile.id, planId)
    });

    if (!existingPlan) {
        throw new ApiError("Meal subscription plan could not be found or you do not have permission to access it.", 404);
    }

    let newStatus = "Live";
    if (body.status !== undefined) {
        const s = String(body.status).toLowerCase();
        newStatus = s === "live" || s === "active" || s === "true" ? "Live" : "Inactive";
    } else if (body.isActive !== undefined) {
        newStatus = body.isActive ? "Live" : "Inactive";
    } else {
        newStatus = existingPlan.status === "Live" ? "Inactive" : "Live";
    }

    const updated = await db.sellerMealPlan.update({
        where: { id: existingPlan.id },
        data: { status: newStatus }
    });

    emitMealPlanUpdated(sellerProfile.id, "TOGGLE", updated);

    return {
        id: updated.id,
        name: updated.name,
        status: updated.status,
        isActive: updated.status === "Live",
        message: updated.status === "Live"
            ? "Meal subscription plan activated successfully. Users can now view and subscribe to it."
            : "Meal subscription plan inactivated successfully. It is now hidden from users.",
    };
};

export const deleteSellerMealPlan = async (req: Request, paramId?: string) => {
    const { sellerProfile } = await getAuthenticatedSellerProfile();

    const url = new URL(req.url);
    const planId = paramId || url.searchParams.get("id");

    if (!planId) {
        throw new ApiError("Plan ID is required", 400);
    }

    const existingPlan = await db.sellerMealPlan.findFirst({
        where: buildPlanIdWhereClause(sellerProfile.id, planId),
        include: {
            userSubscriptions: {
                where: {
                    status: "ACTIVE",
                    OR: [
                        { endDate: null },
                        { endDate: { gte: new Date() } }
                    ]
                }
            }
        }
    });

    if (!existingPlan) {
        throw new ApiError("Meal subscription plan could not be found or you do not have permission to access it.", 404);
    }

    const activeSubscribersCount = existingPlan.userSubscriptions.length;
    if (activeSubscribersCount > 0) {
        throw new ApiError(
            `Cannot delete this meal subscription plan because it currently has ${activeSubscribersCount} active subscriber(s). Please set the plan status to 'Inactive' instead so no new users can subscribe, and you can delete it once all existing subscriptions have completed.`,
            400
        );
    }

    await db.sellerMealPlan.delete({
        where: { id: existingPlan.id }
    });

    emitMealPlanUpdated(sellerProfile.id, "DELETE", { id: existingPlan.id });

    return { success: true, message: "Meal subscription plan deleted successfully" };
};

export const getPublicMealPlans = async (req: Request) => {
    const url = new URL(req.url);
    const sellerId = url.searchParams.get("sellerId");
    const tier = url.searchParams.get("tier");

    const whereClause: any = {
        status: "Live"
    };

    if (sellerId) {
        const cleanSellerId = decodeURIComponent(sellerId).trim();
        const matchedSeller = await db.sellerProfile.findFirst({
            where: {
                OR: [
                    { id: cleanSellerId },
                    { trackingId: { equals: cleanSellerId, mode: 'insensitive' } },
                    { userId: cleanSellerId },
                    { businessName: { equals: cleanSellerId, mode: 'insensitive' } }
                ]
            },
            select: { id: true }
        });
        if (matchedSeller) {
            whereClause.sellerId = matchedSeller.id;
        } else {
            whereClause.sellerId = cleanSellerId;
        }
    }
    if (tier && tier !== "All") {
        whereClause.tier = tier;
    }

    const plans = await db.sellerMealPlan.findMany({
        where: whereClause,
        include: {
            seller: {
                select: {
                    id: true,
                    businessName: true,
                    bannerImageUrl: true,
                    addressLocality: true,
                    foodType: true,
                }
            },
            slots: {
                include: {
                    slot: true
                }
            }
        },
        orderBy: { weeklyPrice: "asc" }
    });

    const sellerIds = Array.from(new Set(plans.map((p) => p.sellerId).filter(Boolean)));
    const sellerSettings = await db.systemSettings.findMany({
        where: {
            key: {
                in: [
                    "MEAL_SUBSCRIPTION_SLOTS",
                    ...sellerIds.map((sid) => `SELLER_MEAL_TIMINGS_${sid}`),
                ],
            },
        },
    });

    const platformTimesSetting = sellerSettings.find((s) => s.key === "MEAL_SUBSCRIPTION_SLOTS");
    let basePlatformTimes: Record<string, string> = {};
    if (platformTimesSetting?.value) {
        try { basePlatformTimes = JSON.parse(platformTimesSetting.value); } catch {}
    }

    const sellerTimesMap: Record<string, Record<string, string>> = {};
    for (const sid of sellerIds) {
        const st = sellerSettings.find((s) => s.key === `SELLER_MEAL_TIMINGS_${sid}`);
        let stTimes: Record<string, string> = {};
        if (st?.value) {
            try { stTimes = JSON.parse(st.value); } catch {}
        }
        sellerTimesMap[sid] = { ...basePlatformTimes, ...stTimes };
    }

    return plans.map((p) => {
        let parsedFeatures: string[] = [];
        try {
            parsedFeatures = typeof p.features === "string" ? JSON.parse(p.features) : (p.features || []);
        } catch {
            parsedFeatures = [];
        }

        let parsedTimings: string[] = [];
        try {
            parsedTimings = typeof p.mealTimings === "string" ? JSON.parse(p.mealTimings) : (p.mealTimings || []);
        } catch {
            parsedTimings = [];
        }

        const sellerTimes = sellerTimesMap[p.sellerId] || basePlatformTimes;
        const slotSources = parsedTimings.length > 0
            ? parsedTimings
            : (p.slots && p.slots.length > 0 ? p.slots.map((s: any) => s.slotId) : []);

        const resolvedTimings = slotSources.map((t: string) => {
            const slotId = normalizeMealSlotId(t) || t;
            const slotRecord = p.slots?.find((s: any) => s.slotId === slotId)?.slot;
            const slotName = slotRecord?.name || getMealSlotDetails(slotId).name;

            if (t.includes(":") && !t.endsWith(":")) {
                const parts = t.split(":");
                const namePart = parts[0].trim();
                const timePart = parts.slice(1).join(":").trim();
                if (timePart) {
                    return `${namePart}: ${timePart}`;
                }
            }

            const configuredTime = (
                sellerTimes[slotId] ||
                sellerTimes[slotId.replace(/-/g, '_')] ||
                sellerTimes[slotId.replace(/_/g, '-')] ||
                slotRecord?.defaultTimeRange ||
                ""
            ).trim();

            return configuredTime ? `${slotName}: ${configuredTime}` : slotName;
        });

        const isWeekly = (p.duration || "1 Week").toLowerCase().includes("week");
        const pausePeriodLower = String(p.pauseBillingPeriod || "").trim().toLowerCase();
        const allowPause = Boolean(
            pausePeriodLower &&
            pausePeriodLower !== "none" &&
            pausePeriodLower !== "disabled" &&
            pausePeriodLower !== "false"
        );

        return {
            id: p.id,
            sellerId: p.sellerId,
            sellerName: p.seller?.businessName || "Kitchen Partner",
            sellerLocality: p.seller?.addressLocality || "",
            foodType: p.seller?.foodType || "BOTH",
            name: p.name,
            tier: p.tier,
            description: p.description,
            weeklyPrice: p.weeklyPrice,
            monthlyPrice: p.monthlyPrice || (isWeekly ? null : p.weeklyPrice),
            quarterlyPrice: p.quarterlyPrice || null,
            yearlyPrice: p.yearlyPrice || null,
            duration: p.duration,
            features: parsedFeatures,
            mealTimings: resolvedTimings,
            allowCancel: p.allowCancel,
            pauseBillingPeriod: allowPause ? p.pauseBillingPeriod : "None",
            allowPause,
            allowPauseBilling: allowPause,
        };
    });
};

export const toggleSubscriberMealDeliveryStatus = async (
    subscriptionId: string,
    date: string,
    status: "DELIVERED" | "NOT_DELIVERED" | "PENDING",
    note?: string,
    slotId?: string
) => {
    const { sellerProfile } = await getAuthenticatedSellerProfile();

    let targetSlot = slotId ? normalizeMealSlotId(slotId) : null;
    if (!targetSlot) {
        const subSlots = await db.userSubscriptionMealSlot.findMany({
            where: { subscriptionId },
            include: { slot: true },
            orderBy: { slot: { order: "asc" } },
        });
        targetSlot = subSlots[0]?.slotId || "breakfast";
    }

    return await MealSubscriptionDeliveryService.recordDeliveryStatus(
        sellerProfile.id,
        subscriptionId,
        date,
        targetSlot,
        status,
        note
    );
};

export const getMealSubscriptionDeliveries = async (req: Request) => {
    const { sellerProfile } = await getAuthenticatedSellerProfile();
    const url = new URL(req.url);
    const dateStr = url.searchParams.get("date") || new Date().toISOString().split("T")[0];
    const slotId = url.searchParams.get("slotId") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const search = url.searchParams.get("search") || undefined;

    return await MealSubscriptionDeliveryService.getSellerDeliveries(sellerProfile.id, {
        dateStr,
        slotId,
        status,
        search,
    });
};

export const getMealSlotsConfig = async (req?: Request) => {
    let customTimes: Record<string, string> = {};

    let sellerId: string | null = null;
    try {
        const session = await getAuthSession();
        if (session?.user?.id) {
            const seller = await db.sellerProfile.findUnique({
                where: { userId: session.user.id },
                select: { id: true },
            });
            if (seller) sellerId = seller.id;
        }
    } catch {}

    if (!sellerId && req) {
        try {
            const url = new URL(req.url);
            sellerId = url.searchParams.get("sellerId");
        } catch {}
    }

    // 1. Central platform settings
    const setting = await db.systemSettings.findUnique({
        where: { key: "MEAL_SUBSCRIPTION_SLOTS" },
    });
    if (setting?.value) {
        try {
            customTimes = JSON.parse(setting.value);
        } catch {}
    }

    // 2. Seller-specific settings
    if (sellerId) {
        const sellerSetting = await db.systemSettings.findUnique({
            where: { key: `SELLER_MEAL_TIMINGS_${sellerId}` },
        });
        if (sellerSetting?.value) {
            try {
                const sellerTimes = JSON.parse(sellerSetting.value);
                customTimes = { ...customTimes, ...sellerTimes };
            } catch {}
        }
    }

    const dbSlots = await db.mealSlot.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
    });

    const slots = PREDEFINED_MEAL_SLOTS.map((predefined) => {
        const dbMatch = dbSlots.find((d) => d.id === predefined.id);
        const configuredTime = (
            customTimes[predefined.id] ||
            customTimes[predefined.id.replace(/-/g, '_')] ||
            customTimes[predefined.id.replace(/_/g, '-')] ||
            dbMatch?.defaultTimeRange ||
            ""
        ).trim();

        return {
            ...predefined,
            ...(dbMatch || {}),
            name: predefined.name,
            subtitle: predefined.subtitle,
            order: predefined.order,
            defaultTimeRange: configuredTime,
        };
    });

    return {
        slots,
        total: slots.length,
        timings: customTimes,
    };
};

export const updateMealSlotsConfig = async (req: Request) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to update meal slot timings.", 401);
    }
    const userRole = (session.user.role || "").toUpperCase();
    if (userRole !== "SELLER" && userRole !== "ADMIN" && userRole !== "SUPERADMIN") {
        throw new ApiError("Access denied. Authorized partner or admin account required.", 403);
    }

    let sellerId: string | null = null;
    try {
        const seller = await db.sellerProfile.findUnique({
            where: { userId: session.user.id },
            select: { id: true },
        });
        if (seller) sellerId = seller.id;
    } catch {}

    const body = await req.json();
    let slotUpdates: Record<string, string> = {};

    if (body.timings && typeof body.timings === "object") {
        slotUpdates = { ...body.timings };
    } else if (body.slotId) {
        const timeRange = body.defaultTimeRange ?? body.timeRange ?? body.timing ?? "";
        slotUpdates[body.slotId] = typeof timeRange === "string" ? timeRange.trim() : String(timeRange);
    } else {
        throw new ApiError("A valid slotId or timings dictionary is required.", 400);
    }

    // Normalize keys in slotUpdates
    const normalizedUpdates: Record<string, string> = {};
    for (const [key, val] of Object.entries(slotUpdates)) {
        const normKey = normalizeMealSlotId(key) || key;
        normalizedUpdates[normKey] = typeof val === "string" ? val.trim() : String(val);
    }

    // 1. Central platform settings
    const existing = await db.systemSettings.findUnique({
        where: { key: "MEAL_SUBSCRIPTION_SLOTS" },
    });

    let currentMap: Record<string, string> = {};
    if (existing?.value) {
        try {
            currentMap = JSON.parse(existing.value);
        } catch {}
    }

    const mergedPlatform = { ...currentMap, ...normalizedUpdates };

    await db.systemSettings.upsert({
        where: { key: "MEAL_SUBSCRIPTION_SLOTS" },
        create: {
            id: "MEAL_SUBSCRIPTION_SLOTS",
            key: "MEAL_SUBSCRIPTION_SLOTS",
            value: JSON.stringify(mergedPlatform),
        },
        update: {
            value: JSON.stringify(mergedPlatform),
        },
    });

    // 2. Seller-specific settings
    if (sellerId) {
        const sellerSettingKey = `SELLER_MEAL_TIMINGS_${sellerId}`;
        const existingSeller = await db.systemSettings.findUnique({
            where: { key: sellerSettingKey },
        });
        let sellerMap: Record<string, string> = {};
        if (existingSeller?.value) {
            try {
                sellerMap = JSON.parse(existingSeller.value);
            } catch {}
        }
        const mergedSeller = { ...sellerMap, ...normalizedUpdates };
        await db.systemSettings.upsert({
            where: { key: sellerSettingKey },
            create: {
                id: sellerSettingKey,
                key: sellerSettingKey,
                value: JSON.stringify(mergedSeller),
            },
            update: {
                value: JSON.stringify(mergedSeller),
            },
        });
    }

    // 3. Upsert into MealSlot database table with proper names and details
    for (const [slotId, timeRange] of Object.entries(normalizedUpdates)) {
        if (typeof timeRange === "string") {
            const trimmed = timeRange.trim();
            const details = getMealSlotDetails(slotId);
            await db.mealSlot.upsert({
                where: { id: details.id },
                create: {
                    id: details.id,
                    name: details.name,
                    subtitle: details.subtitle,
                    description: details.description || "",
                    defaultTimeRange: trimmed,
                    order: details.order || 99,
                    isActive: true,
                },
                update: {
                    defaultTimeRange: trimmed,
                    name: details.name,
                    subtitle: details.subtitle,
                },
            }).catch(() => {});
        }
    }

    const returnSlotId = body.slotId ? (normalizeMealSlotId(body.slotId) || body.slotId) : undefined;
    return {
        success: true,
        message: "Meal subscription timings updated successfully.",
        timings: mergedPlatform,
        slot: returnSlotId
            ? { id: returnSlotId, defaultTimeRange: normalizedUpdates[returnSlotId] }
            : undefined,
    };
};


