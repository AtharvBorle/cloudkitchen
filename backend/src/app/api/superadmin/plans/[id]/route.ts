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

// Delete/archive a plan (preserving existing subscriber access until expiration)
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
            return NextResponse.json({ success: false, message: "Plan ID is required." }, { status: 400 });
        }

        // Check active and historical subscriptions for this plan
        const activeSubscribersCount = await db.subscription.count({
            where: {
                planId: id,
                status: "ACTIVE",
                validUntil: {
                    gt: new Date()
                }
            }
        });

        const totalSubscriptionsCount = await db.subscription.count({
            where: { planId: id }
        });

        if (totalSubscriptionsCount > 0) {
            // Keep existing seller subscriptions intact so they continue to enjoy benefits until expiry!
            // Deactivate the plan template so no new sellers can buy it.
            await db.subscriptionPlan.update({
                where: { id },
                data: {
                    isActive: false
                }
            });

            // Deactivate linked subscription coupons
            await db.subscriptionCoupon.updateMany({
                where: { planId: id },
                data: { isActive: false }
            });

            return NextResponse.json({
                success: true,
                message: `Subscription plan deleted from catalog. ${activeSubscribersCount} active subscriber(s) will retain their full access and benefits until their subscription expiry.`,
                activeSubscribersCount
            });
        }

        // If no subscriptions have ever used this plan, clean coupons and hard delete
        await db.subscriptionCoupon.deleteMany({
            where: { planId: id }
        });

        await db.subscriptionPlan.delete({
            where: { id }
        });

        return NextResponse.json({ success: true, message: "Subscription plan deleted successfully." });
    } catch (error) {
        console.error("Error deleting plan:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
