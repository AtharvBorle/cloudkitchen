import { assignDeliveryPersonToOrder } from "@/controllers/sellerDeliveryController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

interface RouteParams {
    params: Promise<{
        orderId: string;
    }>;
}

export async function PATCH(req: Request, { params }: RouteParams) {
    try {
        const { orderId } = await params;
        const data = await assignDeliveryPersonToOrder(req, orderId);
        return successResponse(data, "Delivery person assigned successfully", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Assign delivery person error:", error);
        return errorResponse("An error occurred while assigning the delivery person", 500);
    }
}
