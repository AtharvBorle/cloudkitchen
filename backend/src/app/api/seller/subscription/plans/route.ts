import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getAuthSession } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        let category = url.searchParams.get("category");

        let whereClause: any = { isActive: true };
        if (category && category !== "BOTH") {
            whereClause.category = {
                in: [category, "BOTH"]
            };
        }

        const dbPlans = await db.subscriptionPlan.findMany({
            where: whereClause,
            orderBy: { price: 'asc' }
        });

        const plans = dbPlans.map(plan => ({
            id: plan.id,
            name: plan.name,
            price: Number(plan.price),
            durationMonths: Number(plan.durationMonths),
            features: JSON.parse(plan.features || "[]"),
            category: plan.category || "BOTH"
        }));
        return successResponse(plans);
    } catch (e: any) {
        console.error("Could not fetch subscription plans:", e);
        return errorResponse("Could not fetch subscription plans", 500);
    }
}
