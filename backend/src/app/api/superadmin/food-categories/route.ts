import { getFoodCategories, createFoodCategory } from "@/controllers/superadminFoodCategoryController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET() {
    try {
        const data = await getFoodCategories();
        return successResponse(data);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Error fetching food categories:", error);
        return errorResponse("An error occurred", 500);
    }
}

export async function POST(req: Request) {
    try {
        const data = await createFoodCategory(req);
        return successResponse(data, "Food category created", 201);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Error creating food category:", error);
        return errorResponse("An error occurred", 500);
    }
}
