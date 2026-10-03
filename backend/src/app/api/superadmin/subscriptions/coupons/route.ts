import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET all subscription coupons
export async function GET(req: NextRequest) {
    try {
        const coupons = await db.subscriptionCoupon.findMany({
            include: {
                plan: true // Include plan details if associated with one
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json({ coupons }, { status: 200 });
    } catch (error) {
        console.error("Error fetching subscription coupons:", error);
        return NextResponse.json({ message: "Failed to fetch subscription coupons" }, { status: 500 });
    }
}

// POST create a new subscription coupon
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { code, description, discountPercentage, discountAmount, planId, maxUsage, isActive, category } = body;

        // Basic validation
        if (!code || (!discountPercentage && !discountAmount)) {
            return NextResponse.json({ message: "Code and at least one discount type are required" }, { status: 400 });
        }

        let parsedPercent: number | null = null;
        let parsedAmount: number | null = null;

        if (discountPercentage !== undefined && discountPercentage !== null && discountPercentage !== "") {
            parsedPercent = parseFloat(discountPercentage);
            if (isNaN(parsedPercent) || parsedPercent <= 0 || parsedPercent > 100) {
                return NextResponse.json({ message: "Discount percentage must be between 1% and 100%." }, { status: 400 });
            }
        }

        if (discountAmount !== undefined && discountAmount !== null && discountAmount !== "") {
            parsedAmount = parseFloat(discountAmount);
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                return NextResponse.json({ message: "Flat discount amount must be greater than 0." }, { status: 400 });
            }
            if (planId) {
                const plan = await db.subscriptionPlan.findUnique({ where: { id: planId } });
                if (plan && parsedAmount > plan.price) {
                    return NextResponse.json({ message: `Flat discount amount (₹${parsedAmount}) cannot exceed the selected subscription plan price (₹${plan.price}).` }, { status: 400 });
                }
            }
        }

        // Check if code already exists
        const existing = await db.subscriptionCoupon.findUnique({
            where: { code: code.toUpperCase() }
        });

        if (existing) {
            return NextResponse.json({ message: "Coupon code already exists" }, { status: 400 });
        }

        // Create coupon
        const coupon = await db.subscriptionCoupon.create({
            data: {
                code: code.toUpperCase(),
                description: description || "",
                discountPercentage: parsedPercent,
                discountAmount: parsedAmount,
                planId: planId || null,
                maxUsage: maxUsage ? parseInt(maxUsage) : 0,
                isActive: isActive !== undefined ? isActive : true,
                category: category || "BOTH",
            }
        });

        return NextResponse.json({ message: "Coupon created successfully", coupon }, { status: 201 });
    } catch (error) {
        console.error("Error creating subscription coupon:", error);
        return NextResponse.json({ message: "Failed to create subscription coupon" }, { status: 500 });
    }
}
