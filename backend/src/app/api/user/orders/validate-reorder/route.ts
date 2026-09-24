import { validateReorder } from "@/controllers/userOrderController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { orderId } = body;
        if (!orderId) {
            return errorResponse("Order ID is required", 400);
        }

        const data = await validateReorder(orderId);
        return successResponse(data);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Validate reorder error:", error);
        return errorResponse(error?.message || "An error occurred while validating the reorder.", 500);
    }
}
