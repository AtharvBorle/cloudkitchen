import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";

export const getSubscriptionPlans = async () => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to view subscription plans.", 401);
    }
    if (session.user.role !== "SUPERADMIN" && session.user.role !== "SELLER") {
        throw new ApiError("Access denied. Authorized account required.", 403);
    }

    const whereClause = session.user.role === "SUPERADMIN" ? {} : { isActive: true };

    const plans = await db.subscriptionPlan.findMany({
        where: whereClause,
        orderBy: { price: 'asc' }
    });

    return { plans };
};

export const createSubscriptionPlan = async (req: Request) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to create subscription plans.", 401);
    }
    if (session.user.role !== "SUPERADMIN") {
        throw new ApiError("Access denied. Superadmin privileges required.", 403);
    }

    const { name, price, durationMonths, features, category } = await req.json();

    if (!name || isNaN(price) || isNaN(durationMonths)) {
        throw new ApiError("Plan name, price, and duration are required.", 400);
    }

    const plan = await db.subscriptionPlan.create({
        data: {
            name,
            price: parseFloat(price),
            durationMonths: parseInt(durationMonths, 10),
            features: features ? JSON.stringify(features) : "[]",
            isActive: true,
            category: category || "BOTH"
        }
    });

    return { plan };
};
