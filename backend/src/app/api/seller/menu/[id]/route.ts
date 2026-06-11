import { updateMenuItem, deleteMenuItem } from "@/controllers/sellerMenuController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const id = (await params).id;
        const data = await updateMenuItem(req, id);
        return successResponse(data, "Updated successfully");
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        return errorResponse("Internal server error", 500);
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const id = (await params).id;
        await deleteMenuItem(id);
        return successResponse(null, "Food item deleted successfully");
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        return errorResponse("Internal server error", 500);
    }
}
