import { replyToReview } from "@/controllers/sellerReviewController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const data = await replyToReview(id, req);
        return successResponse(data, "Reply submitted successfully", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Submit review reply error:", error);
        return errorResponse("Internal server error", 500);
    }
}
