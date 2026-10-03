import { exportSellerBusinessData } from "@/controllers/sellerProfileController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET() {
    try {
        const data = await exportSellerBusinessData();
        return successResponse(data, "Seller business data exported successfully");
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Export seller business data error:", error);
        return errorResponse("An error occurred while exporting business data", 500);
    }
}
