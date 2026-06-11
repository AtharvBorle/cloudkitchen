import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET() {
    try {
        const dbPlans = await db.subscriptionPlan.findMany({
            where: { isActive: true },
            orderBy: { price: 'asc' }
        });
        const plans = dbPlans.map(plan => ({
            id: plan.id,
            name: plan.name,
            price: Number(plan.price),
            durationMonths: Number(plan.durationMonths),
            features: JSON.parse(plan.features || "[]")
        }));
        return successResponse(plans);
    } catch (e: any) {
        console.error("Could not fetch subscription plans:", e);
        return errorResponse("Could not fetch subscription plans", 500);
    }
}
