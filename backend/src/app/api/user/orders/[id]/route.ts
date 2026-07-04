import { cancelOrder, getOrderDetails } from "@/controllers/userOrderController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const id = (await params).id;
        if (!id) return errorResponse("Order ID is required", 400);

        const order = await getOrderDetails(id);
        return successResponse(order);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        return errorResponse("An error occurred while fetching the order details.", 500);
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const id = (await params).id;
        if (!id) return errorResponse("Order ID is required", 400);

        let ticketId: string | undefined = undefined;
        try {
            const body = await req.json();
            ticketId = body?.ticketId;
        } catch (e) {
            // Body might be empty or invalid JSON, ignore
        }

        await cancelOrder(id, ticketId);
        return successResponse(null, "Order cancelled successfully", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        return errorResponse("An error occurred while cancelling the order.", 500);
    }
}
