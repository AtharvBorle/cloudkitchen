import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// PUT update an existing subscription coupon
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const body = await req.json();
        const { isActive, maxUsage } = body;
        const { id } = await params;

        // Ensure coupon exists
        const existing = await db.subscriptionCoupon.findUnique({
            where: { id }
        });

        if (!existing) {
            return NextResponse.json({ message: "Coupon not found" }, { status: 404 });
        }

        const updateData: any = {};
        if (isActive !== undefined) updateData.isActive = isActive;
        if (maxUsage !== undefined) updateData.maxUsage = parseInt(maxUsage);

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
