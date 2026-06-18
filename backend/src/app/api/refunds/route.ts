import { createRefundRequest, listRefunds } from "@/controllers/refundController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function POST(req: Request) {
    try {
        const refund = await createRefundRequest(req);
        return successResponse(refund, "Refund request submitted successfully", 201);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Create refund request error:", error);
        return errorResponse(`Internal server error: ${error.message || error}`, 500);
    }
}

export async function GET() {
    try {
        const refunds = await listRefunds();
        return successResponse(refunds);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("List refunds error:", error);
        return errorResponse(`Internal server error: ${error.message || error}`, 500);
    }
}
