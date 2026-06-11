import { getSellerOrders } from "@/controllers/sellerOrderController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET() {
    try {
        const data = await getSellerOrders();
        return successResponse(data);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Error fetching orders:", error);
        return errorResponse("An error occurred", 500);
    }
}
