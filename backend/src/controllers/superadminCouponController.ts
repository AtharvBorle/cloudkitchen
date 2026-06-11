import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";

export const getCoupons = async () => {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== "SUPERADMIN") {
        throw new ApiError("Unauthorized", 401);
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
    if (!session?.user || session.user.role !== "SUPERADMIN") {
        throw new ApiError("Unauthorized", 401);
    }

    const { code, discountPercentage, appliesToSellerId } = await req.json();

    if (!code || discountPercentage === undefined) {
        throw new ApiError("Code and discount percentage are required", 400);
    }

    const coupon = await db.coupon.create({
        data: {
            code: code.toUpperCase(),
            discountPercentage: parseFloat(discountPercentage),
            appliesToSellerId: appliesToSellerId || null
        }
    });

    return { coupon };
};
