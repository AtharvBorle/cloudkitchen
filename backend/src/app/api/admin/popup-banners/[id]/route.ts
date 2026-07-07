import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { updatePopupBanner } from "@/controllers/adminController";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const data = await updatePopupBanner(req, id);
        return NextResponse.json({ message: "Banner updated successfully", banner: data.banner }, { status: 200 });
    } catch (error: any) {
        console.error("Error updating banner:", error);
        const status = error.statusCode || 500;
        return NextResponse.json({ message: error.message || "An error occurred" }, { status });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getAuthSession();
        if (!session || !session.user || (session.user.role !== "AGENT" && session.user.role !== "SUPERADMIN")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role === "AGENT") {
            const agentProfile = await db.agentProfile.findUnique({
                where: { userId: session.user.id }
            });
            if (!agentProfile || !agentProfile.canManageBanners) {
                return NextResponse.json({ message: "You do not have permission to manage popup banners" }, { status: 403 });
            }
        }

        const { id } = await params;

        await db.popupBanner.delete({
            where: { id }
        });

        return NextResponse.json({ message: "Banner deleted successfully" }, { status: 200 });

    } catch (error) {
        console.error("Error deleting banner:", error);
        return NextResponse.json({ message: "An error occurred" }, { status: 500 });
    }
}
