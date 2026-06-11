import { getCategories, createCategory } from "@/controllers/superadminCategoryController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET() {
    try {
        const data = await getCategories();
        return successResponse(data);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Error fetching categories:", error);
        return errorResponse("An error occurred", 500);
    }
}

export async function POST(req: Request) {
    try {
        const data = await createCategory(req);
        return successResponse(data, "Category created", 201);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Error creating category:", error);
        return errorResponse("An error occurred", 500);
    }
}
