import { requestSellerRevision } from "@/controllers/sellerRevisionController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function POST(req: Request) {
    try {
        await requestSellerRevision(req);
        return successResponse(null, "Documents updated successfully!");
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Revision submit error:", error);
        return errorResponse("An error occurred while uploading documents", 500);
    }
}
