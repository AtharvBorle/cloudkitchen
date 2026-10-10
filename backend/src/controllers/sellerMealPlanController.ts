import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { getCategoryExpiries } from "@/lib/subscription";

export const getAuthenticatedSellerProfile = async () => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to manage meal plans.", 401);
    }
    if (session.user.role !== "SELLER") {
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
            userSubscriptions: {
                include: {
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
            user: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    email: true,
                }
            },
            plan: true
        },
        orderBy: { createdAt: "desc" }
    });

    const now = new Date();
    const isSubscriptionActive = (sub: any) => {
        const statusStr = String(sub.status || "").toUpperCase().trim();
        const isStatusActive = statusStr === "ACTIVE" || statusStr === "LIVE";
        const notPaused = !sub.isPaused;
        const notExpired = !sub.endDate || new Date(sub.endDate) >= now;
        return isStatusActive && notPaused && notExpired;
    };

    // Extract all subscribers across seller's plans and direct subscriptions without duplicates
    const allSubscribers: any[] = [];
    const seenSubIds = new Set<string>();

    const appendSub = (sub: any, planName?: string, planTier?: string, planId?: string) => {
        if (!sub?.id || seenSubIds.has(sub.id)) return;
        seenSubIds.add(sub.id);
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
            cycle: sub.cycle || "Weekly",
            startDate: sub.startDate instanceof Date ? sub.startDate.toISOString() : String(sub.startDate),
            endDate: sub.endDate ? (sub.endDate instanceof Date ? sub.endDate.toISOString() : String(sub.endDate)) : null,
            pricePaid: Number(sub.pricePaid) || 0,
        });
    };

    dbPlans.forEach((plan) => {
        plan.userSubscriptions.forEach((sub) => {
            appendSub(sub, plan.name, plan.tier, plan.id);
        });
    });

    directSubs.forEach((sub) => {
        appendSub(sub, sub.plan?.name, sub.plan?.tier, sub.planId);
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

        // Count distinct active users subscribed to this specific plan
        const planActiveUserKeys = new Set<string>();

        // 1. Direct Prisma userSubscriptions relations
        (plan.userSubscriptions || []).forEach((s) => {
            if (isSubscriptionActive(s)) {
                const userKey = s.user?.id || s.userId || s.id;
                if (userKey) planActiveUserKeys.add(String(userKey).toLowerCase().trim());
            }
        });

        // 2. Cross-match against allSubscribers (catches directSubs, name matching, ID matching)
        allSubscribers.forEach((s) => {
            const statusUpper = String(s.status || "").toUpperCase();
            const isActive = (statusUpper === "ACTIVE" || statusUpper === "LIVE") && !s.isPaused;
            if (!isActive) return;

            const matchesPlanId = s.planId && (s.planId === plan.id || s.planId.toLowerCase() === plan.id.toLowerCase());
            const matchesPlanName = s.planName && plan.name && s.planName.trim().toLowerCase() === plan.name.trim().toLowerCase();

            if (matchesPlanId || matchesPlanName) {
                const userKey = s.userId || s.customerEmail || s.customerPhone || s.customerName || s.id;
                if (userKey) planActiveUserKeys.add(String(userKey).toLowerCase().trim());
            }
        });

        const activeSubscribers = planActiveUserKeys.size > 0 
            ? planActiveUserKeys.size 
            : (plan.subscribersCount || 0);

        const isWeekly = (plan.duration || "1 Week").toLowerCase().includes("week");
        return {
            id: plan.id,
            name: plan.name,
            tier: plan.tier,
            description: plan.description || "",
            weeklyPrice: `₹${plan.weeklyPrice.toFixed(0)}`,
            rawWeeklyPrice: plan.weeklyPrice,
            monthlyPrice: plan.monthlyPrice ? `₹${plan.monthlyPrice.toFixed(0)}` : "",
            quarterlyPrice: plan.quarterlyPrice ? `₹${plan.quarterlyPrice.toFixed(0)}` : "",
            yearlyPrice: plan.yearlyPrice ? `₹${plan.yearlyPrice.toFixed(0)}` : "",
            duration: plan.duration,
            features: parsedFeatures,
            mealTimings: parsedTimings,
            status: plan.status,
            allowCancel: plan.allowCancel,
            pauseBillingPeriod: plan.pauseBillingPeriod,
            subscribersCount: activeSubscribers,
            createdAt: plan.createdAt.toISOString(),
            updatedAt: plan.updatedAt.toISOString(),
        };
    });

    // Count the total number of distinct users who currently have an active subscription
    const activeUserKeys = new Set<string>();
    allSubscribers.forEach((s) => {
        if (isSubscriptionActive(s)) {
            const userKey = s.userId || s.customerEmail || s.customerPhone || s.customerName || s.id;
            if (userKey) {
                activeUserKeys.add(String(userKey).toLowerCase().trim());
            }
        }
    });

    const activeSubscribersCount = activeUserKeys.size;
    const activePlansCount = plans.filter((p) => p.status === "Live").length;
    const mrrTotal = allSubscribers
        .filter(isSubscriptionActive)
        .reduce((sum, s) => {
            const c = (s.cycle || "1 Week").toLowerCase();
            if (c.includes("2 week") || c === "biweekly") return sum + ((s.pricePaid || 0) * 2);
            if (c.includes("week") || c === "weekly" || c.includes("1 week")) return sum + ((s.pricePaid || 0) * 4);
            if (c.includes("quarter") || c.includes("3 month")) return sum + Math.round((s.pricePaid || 0) / 3);
            if (c.includes("6 month") || c === "half_yearly") return sum + Math.round((s.pricePaid || 0) / 6);
            if (c.includes("year") || c === "yearly") return sum + Math.round((s.pricePaid || 0) / 12);
            return sum + (s.pricePaid || 0);
        }, 0) ||
        plans.reduce((acc, p) => acc + (p.rawWeeklyPrice * 4 * (p.subscribersCount || 0)), 0);

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

export const getSellerMealPlanById = async (planId: string) => {
    const { sellerProfile } = await getAuthenticatedSellerProfile();

    const plan = await db.sellerMealPlan.findFirst({
        where: { id: planId, sellerId: sellerProfile.id },
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
    const subCount = activeSubUsers.size > 0 ? activeSubUsers.size : (plan.subscribersCount || 0);

    const isWeekly = (plan.duration || "1 Week").toLowerCase().includes("week");
    return {
        id: plan.id,
        name: plan.name,
        tier: plan.tier,
        description: plan.description || "",
        weeklyPrice: `₹${plan.weeklyPrice.toFixed(0)}`,
        rawWeeklyPrice: plan.weeklyPrice,
        monthlyPrice: plan.monthlyPrice ? `₹${plan.monthlyPrice.toFixed(0)}` : "",
        quarterlyPrice: plan.quarterlyPrice ? `₹${plan.quarterlyPrice.toFixed(0)}` : "",
        yearlyPrice: plan.yearlyPrice ? `₹${plan.yearlyPrice.toFixed(0)}` : "",
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
        pauseBillingPeriod = "Monthly",
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
            mealTimings: JSON.stringify(Array.isArray(mealTimings) ? mealTimings : []),
            status: status || "Live",
            allowCancel: allowCancel !== undefined ? Boolean(allowCancel) : false,
            pauseBillingPeriod: (body.allowPause === false || body.allowPauseBilling === false) ? "None" : (pauseBillingPeriod || "Monthly"),
        }
    });

    return {
        id: newPlan.id,
        name: newPlan.name,
        tier: newPlan.tier,
        description: newPlan.description,
        weeklyPrice: `₹${newPlan.weeklyPrice.toFixed(0)}`,
        rawWeeklyPrice: newPlan.weeklyPrice,
        monthlyPrice: newPlan.monthlyPrice ? `₹${newPlan.monthlyPrice.toFixed(0)}` : "",
        quarterlyPrice: newPlan.quarterlyPrice ? `₹${newPlan.quarterlyPrice.toFixed(0)}` : "",
        yearlyPrice: newPlan.yearlyPrice ? `₹${newPlan.yearlyPrice.toFixed(0)}` : "",
        duration: newPlan.duration,
        features: Array.isArray(features) ? features : [],
        mealTimings: Array.isArray(mealTimings) ? mealTimings : [],
        status: newPlan.status,
        allowCancel: newPlan.allowCancel,
        pauseBillingPeriod: newPlan.pauseBillingPeriod,
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
        where: { id: planId, sellerId: sellerProfile.id }
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
            updateData.monthlyPrice = isWeekly ? num : num * 4;
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
    if (body.mealTimings !== undefined) {
        updateData.mealTimings = JSON.stringify(Array.isArray(body.mealTimings) ? body.mealTimings : []);
    }
    if (body.status !== undefined) {
        updateData.status = body.status;
    }
    if (body.allowCancel !== undefined) {
        updateData.allowCancel = Boolean(body.allowCancel);
    }
    if (body.pauseBillingPeriod !== undefined) {
        updateData.pauseBillingPeriod = body.pauseBillingPeriod;
    } else if (body.allowPause === false || body.allowPauseBilling === false) {
        updateData.pauseBillingPeriod = "None";
    }

    const updated = await db.sellerMealPlan.update({
        where: { id: planId },
        data: updateData
    });

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

    return {
        id: updated.id,
        name: updated.name,
        tier: updated.tier,
        description: updated.description,
        weeklyPrice: `₹${updated.weeklyPrice.toFixed(0)}`,
        rawWeeklyPrice: updated.weeklyPrice,
        monthlyPrice: `₹${(updated.monthlyPrice || updated.weeklyPrice * 4).toFixed(0)}`,
        duration: updated.duration,
        features: parsedFeatures,
        mealTimings: parsedTimings,
        status: updated.status,
        allowCancel: updated.allowCancel,
        pauseBillingPeriod: updated.pauseBillingPeriod,
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
        where: { id: planId, sellerId: sellerProfile.id }
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
        where: { id: planId },
        data: { status: newStatus }
    });

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
        where: { id: planId, sellerId: sellerProfile.id },
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
        where: { id: planId }
    });

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
            }
        },
        orderBy: { weeklyPrice: "asc" }
    });

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

        const isWeekly = (p.duration || "1 Week").toLowerCase().includes("week");
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
            mealTimings: parsedTimings,
            allowCancel: p.allowCancel,
            pauseBillingPeriod: p.pauseBillingPeriod,
        };
    });
};

