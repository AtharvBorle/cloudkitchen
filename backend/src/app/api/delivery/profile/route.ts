import { getDeliveryProfile, updateDeliveryProfile } from "@/controllers/deliveryController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET() {
    try {
        const data = await getDeliveryProfile();
        return successResponse(data);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Fetch delivery profile error:", error);
        return errorResponse("An error occurred while fetching the delivery profile", 500);
    }
}

export async function POST(req: Request) {
    try {
        const data = await updateDeliveryProfile(req);
        return successResponse(data, "Delivery profile updated successfully", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Update delivery profile error:", error);
        return errorResponse("An error occurred while updating the delivery profile", 500);
    }
}
