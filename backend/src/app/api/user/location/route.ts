import { updateUserLocation } from "@/controllers/userController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function POST(req: Request) {
    try {
        const data = await updateUserLocation(req);
        return successResponse(data, "Location updated successfully");
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        return errorResponse("An error occurred while updating location", 500);
    }
}
