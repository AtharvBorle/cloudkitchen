import { addServedPincode } from "@/controllers/sellerMenuController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function POST(req: Request) {
    try {
        const data = await addServedPincode(req);
        return successResponse(data, "Pincode added successfully", 201);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Error adding served pincode:", error);
        return errorResponse("An error occurred", 500);
    }
}
