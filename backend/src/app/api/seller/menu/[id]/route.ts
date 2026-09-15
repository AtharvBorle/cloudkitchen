import { updateMenuItem, deleteMenuItem } from "@/controllers/sellerMenuController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const resolvedParams = await Promise.resolve(params);
        const { id } = resolvedParams;
        const data = await updateMenuItem(req, id);
        return successResponse(data, "Menu item updated successfully", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Error updating menu item:", error);
        return errorResponse("An error occurred while updating menu item", 500);
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const resolvedParams = await Promise.resolve(params);
        const { id } = resolvedParams;
        const data = await deleteMenuItem(id);
        return successResponse(data, "Menu item deleted successfully", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Error deleting menu item:", error);
        return errorResponse("An error occurred while deleting menu item", 500);
    }
}
