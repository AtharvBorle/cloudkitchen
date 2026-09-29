import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const { code, sellerId, subtotal = 0 } = body;

        return await validateCouponCode(code, sellerId, Number(subtotal));
    } catch (error: any) {
        console.error("Coupon validation error:", error);
        return errorResponse("An error occurred while validating the coupon.", 500);
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const code = searchParams.get("code");
        const sellerId = searchParams.get("sellerId");
        const subtotal = parseFloat(searchParams.get("subtotal") || "0");

        return await validateCouponCode(code, sellerId, subtotal);
    } catch (error: any) {
        console.error("Coupon validation error:", error);
        return errorResponse("An error occurred while validating the coupon.", 500);
    }
}

async function validateCouponCode(rawCode: string | null | undefined, sellerId?: string | null, subtotal: number = 0) {
    if (!rawCode || !rawCode.trim()) {
        return errorResponse("Please enter a valid coupon code.", 400);
    }

    const cleanCode = rawCode.trim().toUpperCase();

    const coupon = await db.coupon.findUnique({
        where: { code: cleanCode }
    });

    if (!coupon) {
        return errorResponse(`Invalid promo code "${cleanCode}". Please check and try again.`, 400);
    }

    if (!coupon.isActive || coupon.approvalStatus !== "APPROVED") {
        return errorResponse("This coupon is no longer active.", 400);
    }

    const now = new Date();
    if (coupon.validFrom && new Date(coupon.validFrom) > now) {
        return errorResponse("This coupon is not yet active.", 400);
    }

    if (!coupon.noExpiry && coupon.validUntil && new Date(coupon.validUntil) < now) {
        return errorResponse("This coupon has expired.", 400);
    }

    if (coupon.appliesToSellerId && sellerId && coupon.appliesToSellerId !== sellerId) {
        return errorResponse("This coupon is not valid for this store.", 400);
    }

    const minCart = coupon.minimumCartValue || (coupon as any).minOrderAmount || 0;
    if (subtotal > 0 && minCart > 0 && subtotal < minCart) {
        return errorResponse(`This coupon requires a minimum cart value of ₹${minCart}. (Your subtotal: ₹${subtotal})`, 400);
    }

    const totalLimit = coupon.usageLimit || coupon.maxUsers;
    if (totalLimit && coupon.currentUsersCount >= totalLimit) {
        return errorResponse("This coupon has reached its maximum users limit.", 400);
    }

    let calculatedDiscount = 0;
    const discountType = coupon.discountType || (coupon.discountPercentage ? "PERCENTAGE" : "FLAT");

    if (discountType === "PERCENTAGE" && coupon.discountPercentage) {
        calculatedDiscount = Math.round((subtotal * coupon.discountPercentage) / 100);
        if (coupon.maxDiscountAmount && calculatedDiscount > coupon.maxDiscountAmount) {
            calculatedDiscount = coupon.maxDiscountAmount;
        }
    } else if (coupon.discountAmount) {
        calculatedDiscount = Math.min(coupon.discountAmount, subtotal > 0 ? subtotal : coupon.discountAmount);
    }

    return successResponse({
        valid: true,
        coupon: {
            id: coupon.id,
            code: coupon.code,
            description: coupon.description,
            discountType,
            discountPercentage: coupon.discountPercentage,
            discountAmount: coupon.discountAmount,
            maxDiscountAmount: coupon.maxDiscountAmount,
            minimumCartValue: minCart,
            calculatedDiscount,
        }
    }, `Promo code "${coupon.code}" applied successfully!`);
}
