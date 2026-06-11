import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getAuthSession();
        if (!session || !session.user || (session.user.role !== "AGENT" && session.user.role !== "SUPERADMIN")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { isActive } = body;
        const { id } = await params;

        const updatedBanner = await db.popupBanner.update({
            where: { id },
            data: { isActive }
        });

        return NextResponse.json({ message: "Banner updated successfully", banner: updatedBanner }, { status: 200 });

    } catch (error) {
        console.error("Error updating banner:", error);
        return NextResponse.json({ message: "An error occurred" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getAuthSession();
        if (!session || !session.user || (session.user.role !== "AGENT" && session.user.role !== "SUPERADMIN")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
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
