import { getDeliveryOrders } from "@/controllers/deliveryController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET() {
    try {
        const data = await getDeliveryOrders();
        return successResponse(data);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Fetch delivery orders error:", error);
        return errorResponse("An error occurred while fetching orders", 500);
    }
}
