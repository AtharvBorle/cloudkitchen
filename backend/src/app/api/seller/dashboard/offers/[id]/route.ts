import { updateCoupon, deleteCoupon } from "@/controllers/couponController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: couponId } = await params;
        const data = await updateCoupon(req, couponId);
        return successResponse(data, "Offer updated successfully", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Update seller offer error:", error);
        return errorResponse("Failed to update offer", 500);
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: couponId } = await params;
        await deleteCoupon(couponId);
        return successResponse(null, "Offer deleted successfully", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Delete seller offer error:", error);
        return errorResponse("Failed to delete offer", 500);
    }
}
