import { deleteSellerBanner } from "@/controllers/adminController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function DELETE(req: Request) {
    try {
        const data = await deleteSellerBanner(req);
        return successResponse(data, "Banner successfully removed", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Banner deletion error:", error);
        return errorResponse("An error occurred while processing the request.", 500);
    }
}
