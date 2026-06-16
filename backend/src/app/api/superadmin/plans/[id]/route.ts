import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";

// Update a plan (edit details and/or toggle active status)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getAuthSession();
        if (!session || session.user.role !== "SUPERADMIN") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        if (!id) {
            return NextResponse.json({ message: "ID is required" }, { status: 400 });
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

        return NextResponse.json({ message: "Plan updated successfully", plan: updated });
    } catch (error) {
        console.error("Error updating plan:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

// Delete (deactivate) a plan
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getAuthSession();
        if (!session || session.user.role !== "SUPERADMIN") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        if (!id) {
            return NextResponse.json({ message: "ID is required" }, { status: 400 });
        }

        // We soft delete it so existing subscriptions attached to it don't break
        await db.subscriptionPlan.update({
            where: { id },
            data: { isActive: false }
        });

        return NextResponse.json({ message: "Plan deleted successfully" });
    } catch (error) {
        console.error("Error deleting plan:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
