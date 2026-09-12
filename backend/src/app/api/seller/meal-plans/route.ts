import {
    getSellerMealPlans,
    createSellerMealPlan,
    updateSellerMealPlan,
    deleteSellerMealPlan
} from "@/controllers/sellerMealPlanController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET() {
    try {
        const data = await getSellerMealPlans();
        return successResponse(data);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        return errorResponse(error.message || "Failed to fetch meal subscription plans", 500);
    }
}

export async function POST(req: Request) {
    try {
        const data = await createSellerMealPlan(req);
        return successResponse(data, "Meal subscription plan created successfully", 201);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        return errorResponse(error.message || "Failed to create meal subscription plan", 500);
    }
}

export async function PATCH(req: Request) {
    try {
        const data = await updateSellerMealPlan(req);
        return successResponse(data, "Meal subscription plan updated successfully", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        return errorResponse(error.message || "Failed to update meal subscription plan", 500);
    }
}

export async function DELETE(req: Request) {
    try {
        const data = await deleteSellerMealPlan(req);
        return successResponse(data, "Meal subscription plan deleted successfully", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        return errorResponse(error.message || "Failed to delete meal subscription plan", 500);
    }
}
