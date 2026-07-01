import { deleteFoodSubCategory } from "@/controllers/superadminFoodCategoryController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const data = await deleteFoodSubCategory(id);
        return successResponse(data, "Food sub-category deleted", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Error deleting food sub-category:", error);
        return errorResponse("An error occurred", 500);
    }
}
