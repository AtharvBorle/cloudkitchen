import { getSellerOrderById, updateSellerOrder } from "@/controllers/sellerOrderController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
    try {
        const { orderId } = await params;
        const data = await getSellerOrderById(orderId);
        return successResponse(data);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Error getting seller order:", error);
        return errorResponse("An error occurred", 500);
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
    try {
        const { orderId } = await params;
        const data = await updateSellerOrder(req, orderId);
        return successResponse(data, "Order updated successfully");
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Error updating order:", error);
        return errorResponse("An error occurred", 500);
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
    return PUT(req, { params });
}

