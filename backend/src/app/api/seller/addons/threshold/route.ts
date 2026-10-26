import { updateCentralizedThreshold } from "@/controllers/sellerAddonController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function PATCH(req: Request) {
    try {
        const result = await updateCentralizedThreshold(req);
        return successResponse(result, "Centralized threshold updated successfully");
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Seller addon threshold PATCH error:", error);
        return errorResponse("Failed to update centralized threshold", 500);
    }
}
