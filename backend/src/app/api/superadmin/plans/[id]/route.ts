import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";

// Update a plan (edit details and/or toggle active status)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getAuthSession();
        if (!session?.user) {
            return NextResponse.json({ success: false, message: "Please log in first to update subscription plans.", error: "Please log in first to update subscription plans." }, { status: 401 });
        }
        if (session.user.role !== "SUPERADMIN") {
            return NextResponse.json({ success: false, message: "Access denied. Superadmin privileges required.", error: "Access denied. Superadmin privileges required." }, { status: 403 });
        }

        const { id } = await params;
        if (!id) {
            return NextResponse.json({ success: false, message: "Plan ID is required.", error: "Plan ID is required." }, { status: 400 });
        }

        const body = await req.json();
        const { name, price, durationMonths, features, category, isActive } = body;

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (price !== undefined) updateData.price = parseFloat(price);
        if (durationMonths !== undefined) updateData.durationMonths = parseInt(durationMonths, 10);
        if (features !== undefined) updateData.features = JSON.stringify(features);
        if (category !== undefined) updateData.category = category;
        if (isActive !== undefined) updateData.isActive = isActive;

        const updated = await db.subscriptionPlan.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json({ success: true, message: "Plan updated successfully", plan: updated });
    } catch (error) {
        console.error("Error updating plan:", error);
        return NextResponse.json({ success: false, message: "Internal server error", error: "Internal server error" }, { status: 500 });
    }
}

// Delete a plan (hard delete from database)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getAuthSession();
        if (!session?.user) {
            return NextResponse.json({ success: false, message: "Please log in first to delete subscription plans.", error: "Please log in first to delete subscription plans." }, { status: 401 });
        }
        if (session.user.role !== "SUPERADMIN") {
            return NextResponse.json({ success: false, message: "Access denied. Superadmin privileges required.", error: "Access denied. Superadmin privileges required." }, { status: 403 });
        }

        const { id } = await params;
        if (!id) {
            return NextResponse.json({ message: "ID is required" }, { status: 400 });
        }

        // Clean up references to prevent foreign key errors
        await db.subscription.updateMany({
            where: { planId: id },
            data: { planId: null }
        });

        await db.subscriptionCoupon.updateMany({
            where: { planId: id },
            data: { planId: null }
        });

        // Hard delete the plan from the database
        await db.subscriptionPlan.delete({
            where: { id }
        });

        return NextResponse.json({ message: "Plan deleted successfully" });
    } catch (error) {
        console.error("Error deleting plan:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
