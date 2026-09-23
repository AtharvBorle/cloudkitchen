import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { revalidateTag } from "next/cache";

export const getCoupons = async () => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to view coupons.", 401);
    }
    if (session.user.role !== "SUPERADMIN") {
        throw new ApiError("Access denied. Superadmin privileges required.", 403);
    }

    const coupons = await db.coupon.findMany({
        orderBy: { code: 'asc' }
    });

    const subscriptions = await db.subscription.findMany({
        include: { seller: { include: { user: true } } },
        orderBy: { createdAt: 'desc' }
    });

    return { coupons, subscriptions };
};

export const createCoupon = async (req: Request) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to create coupons.", 401);
    }
    if (session.user.role !== "SUPERADMIN") {
        throw new ApiError("Access denied. Superadmin privileges required.", 403);
    }

    const { code, discountPercentage, appliesToSellerId, category } = await req.json();

    if (!code || discountPercentage === undefined) {
        throw new ApiError("Coupon code and discount percentage are required.", 400);
    }

    const coupon = await db.coupon.create({
        data: {
            code: code.toUpperCase(),
            discountPercentage: parseFloat(discountPercentage),
            appliesToSellerId: appliesToSellerId || null,
            category: category || "BOTH"
        }
    });

    revalidateTag("coupons", {});

    return { coupon };
};
