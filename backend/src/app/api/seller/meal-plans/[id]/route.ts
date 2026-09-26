import {
    getSellerMealPlanById,
    updateSellerMealPlan,
    deleteSellerMealPlan
} from "@/controllers/sellerMealPlanController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const data = await getSellerMealPlanById(id);
        return successResponse(data);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        return errorResponse(error.message || "Failed to fetch meal subscription plan", 500);
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const data = await updateSellerMealPlan(req);
        return successResponse(data, "Meal subscription plan updated successfully", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        return errorResponse(error.message || "Failed to update meal subscription plan", 500);
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const data = await deleteSellerMealPlan(req, id);
        return successResponse(data, "Meal subscription plan deleted successfully", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        return errorResponse(error.message || "Failed to delete meal subscription plan", 500);
    }
}
