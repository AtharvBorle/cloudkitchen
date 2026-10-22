import { getOrderDetails } from "@/controllers/userOrderController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";
import { getCorsHeaders } from "@/lib/cors";

export async function OPTIONS(req: Request) {
    return new Response(null, {
        status: 204,
        headers: getCorsHeaders(req),
    });
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const id = (await params).id;
        if (!id) return errorResponse("Order ID is required", 400);

        const order = await getOrderDetails(id, true);
        return successResponse(order);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        return errorResponse("An error occurred while fetching the order details.", 500);
    }
}
