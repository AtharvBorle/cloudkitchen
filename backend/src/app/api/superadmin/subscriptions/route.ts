import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getAuthSession } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const session = await getAuthSession();
        if (!session?.user) {
            return NextResponse.json({ success: false, message: "Please log in first to view subscriptions.", error: "Please log in first to view subscriptions." }, { status: 401 });
        }
        if (session.user.role !== "SUPERADMIN") {
            return NextResponse.json({ success: false, message: "Access denied. Superadmin privileges required.", error: "Access denied. Superadmin privileges required." }, { status: 403 });
        }

        const subscriptions = await prisma.subscription.findMany({
            include: {
                seller: true,
                plan: true
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return NextResponse.json({ recentSubscriptions: subscriptions }, { status: 200 });
    } catch (error) {
        console.error("Error fetching subscriptions:", error);
        return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
    }
}
