import { getSuperadminSellers } from "@/controllers/superadminSellerController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET() {
    try {
        const data = await getSuperadminSellers();
        return successResponse(data);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Error fetching sellers:", error);
        return errorResponse("An error occurred", 500);
    }
}
