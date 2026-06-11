import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getAuthSession } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const session = await getAuthSession();
        if (!session || session.user.role !== "SUPERADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
