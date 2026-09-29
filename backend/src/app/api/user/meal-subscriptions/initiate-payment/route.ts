import { initiateMealSubscriptionPayment } from "@/controllers/userMealSubscriptionController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const data = await initiateMealSubscriptionPayment(req);
        return successResponse(data, "Subscription payment initiated successfully", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Initiate meal subscription payment error:", error);
        return errorResponse(error?.message || "An error occurred while initiating subscription payment", 500);
    }
}
