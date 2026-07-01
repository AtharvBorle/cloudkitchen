import { createFoodSubCategory } from "@/controllers/superadminFoodCategoryController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function POST(req: Request) {
    try {
        const data = await createFoodSubCategory(req);
        return successResponse(data, "Food sub-category created", 201);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Error creating food sub-category:", error);
        return errorResponse("An error occurred", 500);
    }
}
