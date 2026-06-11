import { cancelOrder } from "@/controllers/userOrderController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const id = (await params).id;
        if (!id) return errorResponse("Order ID is required", 400);

        await cancelOrder(id);
        return successResponse(null, "Order cancelled successfully", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        return errorResponse("An error occurred while cancelling the order.", 500);
    }
}
