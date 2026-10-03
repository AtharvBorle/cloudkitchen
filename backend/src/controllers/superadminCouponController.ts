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

    const { code, discountPercentage, appliesToSellerId, category, isAutoApply, autoApply } = await req.json();

    if (!code || typeof code !== "string" || !code.trim()) {
        throw new ApiError("Please enter a valid coupon code.", 400);
    }
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length > 20) {
        throw new ApiError("Coupon code cannot exceed 20 characters.", 400);
    }
    if (!/^[A-Z0-9_-]+$/.test(cleanCode)) {
        throw new ApiError("Coupon code can only contain letters, numbers, hyphens, and underscores.", 400);
    }

    const disc = parseFloat(discountPercentage);
    if (isNaN(disc) || disc <= 0 || disc > 100) {
        throw new ApiError("Discount percentage must be between 1% and 100%.", 400);
    }

    const coupon = await db.coupon.create({
        data: {
            code: cleanCode,
            discountPercentage: disc,
            appliesToSellerId: appliesToSellerId || null,
            category: category || "BOTH",
            isAutoApply: isAutoApply !== undefined ? Boolean(isAutoApply) : (autoApply !== undefined ? Boolean(autoApply) : false)
        }
    });

    revalidateTag("coupons", {});

    return { coupon };
};
