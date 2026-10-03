import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// PUT update an existing subscription coupon
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const body = await req.json();
        const { code, description, discountPercentage, discountAmount, planId, maxUsage, isActive, category } = body;
        const { id } = await params;

        // Ensure coupon exists
        const existing = await db.subscriptionCoupon.findUnique({
            where: { id }
        });

        if (!existing) {
            return NextResponse.json({ message: "Coupon not found" }, { status: 404 });
        }

        if (code && code.toUpperCase() !== existing.code) {
            const codeExists = await db.subscriptionCoupon.findUnique({
                where: { code: code.toUpperCase() }
            });
            if (codeExists) {
                return NextResponse.json({ message: "Coupon code already exists" }, { status: 400 });
            }
        }

        const updateData: any = {};
        if (code !== undefined) updateData.code = code.toUpperCase();
        if (description !== undefined) updateData.description = description;

        if (discountPercentage !== undefined) {
            if (discountPercentage === null || discountPercentage === "") {
                updateData.discountPercentage = null;
            } else {
                const parsed = parseFloat(discountPercentage);
                if (isNaN(parsed) || parsed <= 0 || parsed > 100) {
                    return NextResponse.json({ message: "Discount percentage must be between 1% and 100%." }, { status: 400 });
                }
                updateData.discountPercentage = parsed;
            }
        }

        const targetPlanId = planId !== undefined ? planId : existing.planId;
        if (discountAmount !== undefined) {
            if (discountAmount === null || discountAmount === "") {
                updateData.discountAmount = null;
            } else {
                const parsed = parseFloat(discountAmount);
                if (isNaN(parsed) || parsed <= 0) {
                    return NextResponse.json({ message: "Flat discount amount must be greater than 0." }, { status: 400 });
                }
                if (targetPlanId) {
                    const plan = await db.subscriptionPlan.findUnique({ where: { id: targetPlanId } });
                    if (plan && parsed > plan.price) {
                        return NextResponse.json({ message: `Flat discount amount (₹${parsed}) cannot exceed the selected subscription plan price (₹${plan.price}).` }, { status: 400 });
                    }
                }
                updateData.discountAmount = parsed;
            }
        }

        if (planId !== undefined) updateData.planId = planId || null;
        if (maxUsage !== undefined) updateData.maxUsage = parseInt(maxUsage);
        if (isActive !== undefined) updateData.isActive = isActive;
        if (category !== undefined) updateData.category = category;

        const updated = await db.subscriptionCoupon.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json({ message: "Coupon updated successfully", coupon: updated }, { status: 200 });

    } catch (error) {
        console.error("Error updating subscription coupon:", error);
        return NextResponse.json({ message: "Failed to update subscription coupon" }, { status: 500 });
    }
}

// DELETE a subscription coupon
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        await db.subscriptionCoupon.delete({
            where: { id }
        });

        return NextResponse.json({ message: "Coupon deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting subscription coupon:", error);
        return NextResponse.json({ message: "Failed to delete subscription coupon" }, { status: 500 });
    }
}
