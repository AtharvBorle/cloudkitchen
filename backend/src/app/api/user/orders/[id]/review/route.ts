import { getOrderReview, submitOrderReview } from "@/controllers/userReviewController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const data = await getOrderReview(id);
        return successResponse(data);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Get order review error:", error);
        return errorResponse("Internal server error", 500);
    }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const data = await submitOrderReview(id, req);
        return successResponse(data, "Review submitted successfully", 201);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Submit order review error:", error);
        return errorResponse("Internal server error", 500);
    }
}
