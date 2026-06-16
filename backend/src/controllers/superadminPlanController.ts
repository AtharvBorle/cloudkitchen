import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";

export const getSubscriptionPlans = async () => {
    const session = await getAuthSession();
    if (!session || (session.user.role !== "SUPERADMIN" && session.user.role !== "SELLER")) {
        throw new ApiError("Unauthorized", 401);
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
    if (!session || session.user.role !== "SUPERADMIN") {
        throw new ApiError("Unauthorized", 401);
    }

    const { name, price, durationMonths, features, category } = await req.json();

    if (!name || isNaN(price) || isNaN(durationMonths)) {
        throw new ApiError("Name, price, and duration are required", 400);
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
