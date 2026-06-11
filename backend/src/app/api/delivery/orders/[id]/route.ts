import { updateOrderStatus } from "@/controllers/deliveryController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params;
        const data = await updateOrderStatus(req, resolvedParams.id);
        return successResponse(data, "Order status updated successfully");
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Update order status error:", error);
        return errorResponse("An error occurred while updating order status", 500);
    }
}
