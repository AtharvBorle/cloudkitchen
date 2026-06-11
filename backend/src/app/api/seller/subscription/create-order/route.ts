import { createSubscriptionOrder } from "@/controllers/sellerSubscriptionController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function POST(req: Request) {
    try {
        const data = await createSubscriptionOrder(req);
        return successResponse(data);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Error creating subscription order:", error);
        return errorResponse("Internal server error", 500);
    }
}
