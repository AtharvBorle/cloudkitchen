import { updateRefundStatus } from "@/controllers/refundController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const id = (await params).id;
        if (!id) return errorResponse("Refund ID is required", 400);

        const refund = await updateRefundStatus(req, id);
        return successResponse(refund, "Refund status updated successfully");
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Update refund status error:", error);
        return errorResponse(`Internal server error: ${error.message || error}`, 500);
    }
}
