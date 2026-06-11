import { getSubscriptionPlans, createSubscriptionPlan } from "@/controllers/superadminPlanController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET() {
    try {
        const data = await getSubscriptionPlans();
        return successResponse(data);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Error fetching plans:", error);
        return errorResponse("Internal server error", 500);
    }
}

export async function POST(req: Request) {
    try {
        const data = await createSubscriptionPlan(req);
        return successResponse(data, "Plan created successfully", 201);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Error creating plan:", error);
        return errorResponse("Internal server error", 500);
    }
}
