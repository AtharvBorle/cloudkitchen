import { getPlatformReviews } from "@/controllers/adminReviewController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET() {
    try {
        const data = await getPlatformReviews();
        return successResponse(data);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Superadmin get reviews error:", error);
        return errorResponse("Internal server error", 500);
    }
}
