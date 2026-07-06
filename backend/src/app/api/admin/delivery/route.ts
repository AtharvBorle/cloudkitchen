import { getAdminDeliveryPersons } from "@/controllers/adminDeliveryController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET(req: Request) {
    try {
        const data = await getAdminDeliveryPersons();
        return successResponse(data);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Admin fetch delivery staff error:", error);
        return errorResponse("An error occurred while fetching delivery staff", 500);
    }
}
