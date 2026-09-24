import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { revalidateTag } from "next/cache";

export async function DELETE(req: Request, { params }: { params: Promise<{ couponId: string }> }) {
    try {
        const session = await getAuthSession();
        if (!session?.user) {
            return NextResponse.json({ success: false, message: "Please log in first to delete coupons.", error: "Please log in first to delete coupons." }, { status: 401 });
        }
        if (session.user.role !== "SUPERADMIN") {
            return NextResponse.json({ success: false, message: "Access denied. Superadmin privileges required.", error: "Access denied. Superadmin privileges required." }, { status: 403 });
        }

        const { couponId } = await params;

        await db.coupon.delete({
            where: { id: couponId }
        });

        revalidateTag("coupons", {});

        return NextResponse.json({ message: "Coupon deleted" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting coupon:", error);
        return NextResponse.json({ message: "An error occurred" }, { status: 500 });
    }
}
