import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getAuthSession } from "@/lib/auth";

const db = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { code, planId } = body;

        if (!code || !planId) {
            return NextResponse.json({ message: "Coupon code and Plan ID are required" }, { status: 400 });
        }

        // 1. Check if plan exists
        const plan = await db.subscriptionPlan.findUnique({
            where: { id: planId }
        });

        if (!plan) {
            return NextResponse.json({ message: "Invalid subscription plan" }, { status: 404 });
        }

        // 2. Find coupon
        const coupon = await db.subscriptionCoupon.findUnique({
            where: { code: code.toUpperCase() }
        });

        if (!coupon) {
            return NextResponse.json({ message: "Invalid coupon code" }, { status: 404 });
        }

        // 3. Validation checks
        if (!coupon.isActive) {
            return NextResponse.json({ message: "This coupon is no longer active" }, { status: 400 });
        }

        if (coupon.planId && coupon.planId !== planId) {
            return NextResponse.json({ message: "This coupon is not valid for the selected plan" }, { status: 400 });
        }

        const isCategoryMatch = 
            !coupon.category || 
            coupon.category === "BOTH" || 
            plan.category === "BOTH" || 
            coupon.category === plan.category;

        if (!isCategoryMatch) {
            return NextResponse.json({ message: `This coupon is only valid for ${coupon.category} plans` }, { status: 400 });
        }

        if (coupon.maxUsage > 0 && coupon.currentUsage >= coupon.maxUsage) {
            return NextResponse.json({ message: "This coupon has reached its maximum usage limit" }, { status: 400 });
        }

        // 4. Calculate discount
        let discount = 0;
        if (coupon.discountPercentage) {
            discount = (plan.price * coupon.discountPercentage) / 100;
        } else if (coupon.discountAmount) {
            discount = coupon.discountAmount;
        }

        // Ensure discount doesn't exceed plan price
        discount = Math.min(discount, plan.price);
        const finalPrice = Math.max(0, plan.price - discount);

        return NextResponse.json({
            message: "Coupon applied successfully",
            valid: true,
            originalPrice: plan.price,
            discount: discount,
            finalPrice: finalPrice,
            couponId: coupon.id
        }, { status: 200 });

    } catch (error) {
        console.error("Error validating coupon:", error);
        return NextResponse.json({ message: "Failed to validate coupon" }, { status: 500 });
    }
}
