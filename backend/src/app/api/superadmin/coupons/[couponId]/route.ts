import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { revalidateTag } from "next/cache";

export async function DELETE(req: Request, { params }: { params: Promise<{ couponId: string }> }) {
    try {
        const session = await getAuthSession();
        if (!session?.user || session.user.role !== "SUPERADMIN") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
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
