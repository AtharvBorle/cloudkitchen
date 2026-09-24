import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";

export const getUserMealSubscriptions = async () => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to view your meal subscriptions.", 401);
    }

    const subscriptions = await db.userMealSubscription.findMany({
        where: { userId: session.user.id },
        include: {
            plan: true,
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

    return subscriptions.map((sub) => {
        let features: string[] = [];
        try {
            features = typeof sub.plan.features === "string" ? JSON.parse(sub.plan.features) : sub.plan.features;
        } catch {
            features = [];
        }

        let mealTimings: string[] = [];
        try {
            mealTimings = typeof sub.plan.mealTimings === "string" ? JSON.parse(sub.plan.mealTimings) : sub.plan.mealTimings;
        } catch {
            mealTimings = [];
        }

        return {
            id: sub.id,
            userId: sub.userId,
            sellerId: sub.sellerId,
            planId: sub.planId,
            status: sub.status,
            tier: sub.tier,
            cycle: sub.cycle,
            pricePaid: sub.pricePaid,
            isPaused: sub.isPaused,
            startDate: sub.startDate.toISOString(),
            endDate: sub.endDate ? sub.endDate.toISOString() : null,
            deliveryAddress: sub.deliveryAddress || "",
            contactPhone: sub.contactPhone || "",
            createdAt: sub.createdAt.toISOString(),
            updatedAt: sub.updatedAt.toISOString(),
            plan: {
                id: sub.plan.id,
                name: sub.plan.name,
                tier: sub.plan.tier,
                description: sub.plan.description || "",
                weeklyPrice: sub.plan.weeklyPrice,
                monthlyPrice: sub.plan.monthlyPrice || sub.plan.weeklyPrice * 4,
                quarterlyPrice: sub.plan.quarterlyPrice || sub.plan.weeklyPrice * 12 * 0.9,
                yearlyPrice: sub.plan.yearlyPrice || sub.plan.weeklyPrice * 52 * 0.8,
                duration: sub.plan.duration,
                features,
                mealTimings,
                status: sub.plan.status,
                allowCancel: sub.plan.allowCancel,
                pauseBillingPeriod: sub.plan.pauseBillingPeriod,
            },
            seller: {
                id: sub.seller.id,
                businessName: sub.seller.businessName || "Kitchen Partner",
                trackingId: sub.seller.trackingId,
                addressLocality: sub.seller.addressLocality,
                foodType: sub.seller.foodType,
                bannerImageUrl: sub.seller.bannerImageUrl,
            }
        };
    });
};

export const createUserMealSubscription = async (req: Request) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to subscribe to a meal plan.", 401);
    }

    const body = await req.json();
    const { planId, deliveryAddress, contactPhone, cycle = "WEEKLY" } = body;

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

    const planDuration = (plan.duration || cycle || "1 Week").toLowerCase();

    let durationDays = 7;
    let subscriptionCycle = "1 Week";

    if (planDuration.includes("2 week")) {
        durationDays = 14;
        subscriptionCycle = "2 Weeks";
    } else if (planDuration.includes("1 week") || planDuration === "week" || planDuration === "weekly") {
        durationDays = 7;
        subscriptionCycle = "1 Week";
    } else if (planDuration.includes("6 month")) {
        durationDays = 180;
        subscriptionCycle = "6 Months";
    } else if (planDuration.includes("1 month") || planDuration === "month" || planDuration === "monthly") {
        durationDays = 30;
        subscriptionCycle = "1 Month";
    } else if (planDuration.includes("year") || planDuration === "yearly") {
        durationDays = 365;
        subscriptionCycle = "1 Year";
    } else {
        durationDays = 7;
        subscriptionCycle = plan.duration || "1 Week";
    }

    const calculatedPrice = plan.weeklyPrice;

    // Calculate end date based on durationDays
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationDays);

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
            deliveryAddress: deliveryAddress || "",
            contactPhone: contactPhone || (session.user as any).phone || "",
        },
        include: {
            plan: true,
            seller: true,
        }
    });

    // Increment subscriber count on plan
    await db.sellerMealPlan.update({
        where: { id: plan.id },
        data: { subscribersCount: { increment: 1 } }
    });

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

    return {
        success: true,
        message: `Plan changed successfully to ${newPlan.name}!`,
        subscription: updated,
    };
};

export const togglePauseUserMealSubscription = async (subscriptionId: string, isPaused: boolean) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to manage your subscription status.", 401);
    }

    const subscription = await db.userMealSubscription.findFirst({
        where: {
            id: subscriptionId,
            userId: session.user.id,
        }
    });

    if (!subscription) {
        throw new ApiError("Subscription not found", 404);
    }

    const updated = await db.userMealSubscription.update({
        where: { id: subscriptionId },
        data: {
            isPaused,
            status: isPaused ? "PAUSED" : "ACTIVE",
        },
        include: {
            plan: true,
            seller: true,
        }
    });

    return {
        success: true,
        message: isPaused ? "Subscription paused successfully." : "Subscription resumed successfully.",
        subscription: updated,
    };
};
