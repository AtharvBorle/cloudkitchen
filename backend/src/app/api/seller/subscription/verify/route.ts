import { verifySubscriptionPayment } from "@/controllers/sellerSubscriptionController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function POST(req: Request) {
    try {
        const data = await verifySubscriptionPayment(req);
        return successResponse(data, "Subscription activated successfully", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Error verifying payment:", error);
        return errorResponse("Internal server error", 500);
    }
}
