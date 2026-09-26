import { toggleSellerMealPlanStatus } from "@/controllers/sellerMealPlanController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const data = await toggleSellerMealPlanStatus(req, id);
        return successResponse(data, data.message || "Meal subscription plan status updated successfully", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Error toggling meal plan status:", error);
        return errorResponse(error.message || "Failed to toggle meal subscription plan status", 500);
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    return PATCH(req, { params });
}
