import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

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
                discountPercentage: discountPercentage ? parseFloat(discountPercentage) : null,
                discountAmount: discountAmount ? parseFloat(discountAmount) : null,
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
