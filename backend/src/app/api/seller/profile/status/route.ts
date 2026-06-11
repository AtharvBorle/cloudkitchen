import { updateSellerStatus } from "@/controllers/sellerProfileController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function PUT(req: Request) {
    try {
        const data = await updateSellerStatus(req);
        return successResponse(data, "Store status updated successfully");
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Error updating store status:", error);
        return errorResponse("Internal server error", 500);
    }
}
