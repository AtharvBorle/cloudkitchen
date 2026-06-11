import { verifyOrderPayment } from "@/controllers/userOrderController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function POST(req: Request) {
    try {
        const data = await verifyOrderPayment(req);
        return successResponse(data, "Payment verified successfully", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Payment verification error:", error);
        return errorResponse("An error occurred while verifying the payment", 500);
    }
}
