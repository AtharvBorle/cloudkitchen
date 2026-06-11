import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";

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
