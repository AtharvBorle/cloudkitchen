import { submitAppFeedback, getAppFeedback } from "@/controllers/userReviewController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function POST(req: Request) {
    try {
        const data = await submitAppFeedback(req);
        return successResponse(data, "Rating & feedback submitted successfully", 201);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Submit app feedback error:", error);
        return errorResponse("Internal server error", 500);
    }
}

export async function GET() {
    try {
        const data = await getAppFeedback();
        return successResponse(data);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Get app feedback error:", error);
        return errorResponse("Internal server error", 500);
    }
}
