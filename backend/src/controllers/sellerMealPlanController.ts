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

        const activeSubscribers = plan.userSubscriptions.filter((s) => s.status === "ACTIVE" || !s.isPaused).length;

        return {
            id: plan.id,
            name: plan.name,
            tier: plan.tier,
            description: plan.description || "",
            weeklyPrice: `₹${plan.weeklyPrice.toFixed(0)}`,
            rawWeeklyPrice: plan.weeklyPrice,
            monthlyPrice: plan.monthlyPrice ? `₹${plan.monthlyPrice.toFixed(0)}` : `₹${(plan.weeklyPrice * 4).toFixed(0)}`,
            quarterlyPrice: plan.quarterlyPrice ? `₹${plan.quarterlyPrice.toFixed(0)}` : `₹${(plan.weeklyPrice * 12 * 0.9).toFixed(0)}`,
            yearlyPrice: plan.yearlyPrice ? `₹${plan.yearlyPrice.toFixed(0)}` : `₹${(plan.weeklyPrice * 52 * 0.8).toFixed(0)}`,
            duration: plan.duration,
            features: parsedFeatures,
            mealTimings: parsedTimings,
            status: plan.status,
            allowCancel: plan.allowCancel,
            pauseBillingPeriod: plan.pauseBillingPeriod,
            subscribersCount: activeSubscribers || plan.subscribersCount || 0,
            createdAt: plan.createdAt.toISOString(),
            updatedAt: plan.updatedAt.toISOString(),
        };
    });

    // Extract all subscribers across seller's plans
    const allSubscribers: any[] = [];
    dbPlans.forEach((plan) => {
        plan.userSubscriptions.forEach((sub) => {
            allSubscribers.push({
                id: sub.id,
                planId: plan.id,
                planName: plan.name,
                tier: sub.tier || plan.tier,
                customerName: sub.user?.name || "Customer",
                customerPhone: sub.contactPhone || sub.user?.phone || "",
                customerEmail: sub.user?.email || "",
                deliveryAddress: sub.deliveryAddress || "",
                status: sub.status,
                isPaused: sub.isPaused,
                cycle: sub.cycle,
                startDate: sub.startDate.toISOString(),
                endDate: sub.endDate ? sub.endDate.toISOString() : null,
                pricePaid: sub.pricePaid,
            });
        });
    });

    const activeSubscribersCount = allSubscribers.filter((s) => s.status === "ACTIVE" && !s.isPaused).length;
    const activePlansCount = plans.filter((p) => p.status === "Live").length;
    const mrrTotal = plans.reduce((acc, p) => acc + (p.rawWeeklyPrice * 4 * (p.subscribersCount || 0)), 0);

    return {
        plans,
        subscribers: allSubscribers,
        metrics: {
            activeSubscribers: activeSubscribersCount,
            monthlyRecurringRevenue: mrrTotal > 0 ? `₹${(mrrTotal / 1000).toFixed(1)}k` : "₹0",
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

    return {
        id: plan.id,
        name: plan.name,
        tier: plan.tier,
        description: plan.description || "",
        weeklyPrice: `₹${plan.weeklyPrice.toFixed(0)}`,
        rawWeeklyPrice: plan.weeklyPrice,
        monthlyPrice: plan.monthlyPrice ? `₹${plan.monthlyPrice.toFixed(0)}` : `₹${(plan.weeklyPrice * 4).toFixed(0)}`,
        quarterlyPrice: plan.quarterlyPrice ? `₹${plan.quarterlyPrice.toFixed(0)}` : `₹${(plan.weeklyPrice * 12 * 0.9).toFixed(0)}`,
        yearlyPrice: plan.yearlyPrice ? `₹${plan.yearlyPrice.toFixed(0)}` : `₹${(plan.weeklyPrice * 52 * 0.8).toFixed(0)}`,
        duration: plan.duration,
        features: parsedFeatures,
        mealTimings: parsedTimings,
        status: plan.status,
        allowCancel: plan.allowCancel,
        pauseBillingPeriod: plan.pauseBillingPeriod,
        subscribersCount: plan.userSubscriptions?.length || plan.subscribersCount || 0,
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
        allowCancel = true,
        pauseBillingPeriod = "Monthly",
    } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
        throw new ApiError("Plan Name is required", 400);
    }

    const numericWeeklyPrice = parseFloat(String(weeklyPrice).replace(/[^0-9.]/g, ""));
    if (isNaN(numericWeeklyPrice) || numericWeeklyPrice < 0) {
        throw new ApiError("A valid Weekly Price (₹) is required", 400);
    }

    const numericMonthly = monthlyPrice
        ? parseFloat(String(monthlyPrice).replace(/[^0-9.]/g, ""))
        : numericWeeklyPrice * 4;
    const numericQuarterly = quarterlyPrice
        ? parseFloat(String(quarterlyPrice).replace(/[^0-9.]/g, ""))
        : numericWeeklyPrice * 12 * 0.9;
    const numericYearly = yearlyPrice
        ? parseFloat(String(yearlyPrice).replace(/[^0-9.]/g, ""))
        : numericWeeklyPrice * 52 * 0.8;

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
            allowCancel: allowCancel !== undefined ? Boolean(allowCancel) : true,
            pauseBillingPeriod: pauseBillingPeriod || "Monthly",
        }
    });

    return {
        id: newPlan.id,
        name: newPlan.name,
        tier: newPlan.tier,
        description: newPlan.description,
        weeklyPrice: `₹${newPlan.weeklyPrice.toFixed(0)}`,
        rawWeeklyPrice: newPlan.weeklyPrice,
        monthlyPrice: `₹${(newPlan.monthlyPrice || newPlan.weeklyPrice * 4).toFixed(0)}`,
        quarterlyPrice: `₹${(newPlan.quarterlyPrice || newPlan.weeklyPrice * 12 * 0.9).toFixed(0)}`,
        yearlyPrice: `₹${(newPlan.yearlyPrice || newPlan.weeklyPrice * 52 * 0.8).toFixed(0)}`,
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
        const num = parseFloat(String(body.weeklyPrice).replace(/[^0-9.]/g, ""));
        if (!isNaN(num) && num >= 0) {
            updateData.weeklyPrice = num;
            if (!body.monthlyPrice) updateData.monthlyPrice = num * 4;
            if (!body.quarterlyPrice) updateData.quarterlyPrice = num * 12 * 0.9;
            if (!body.yearlyPrice) updateData.yearlyPrice = num * 52 * 0.8;
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
            monthlyPrice: p.monthlyPrice || p.weeklyPrice * 4,
            quarterlyPrice: p.quarterlyPrice || p.weeklyPrice * 12 * 0.9,
            yearlyPrice: p.yearlyPrice || p.weeklyPrice * 52 * 0.8,
            duration: p.duration,
            features: parsedFeatures,
            mealTimings: parsedTimings,
            allowCancel: p.allowCancel,
            pauseBillingPeriod: p.pauseBillingPeriod,
        };
    });
};

