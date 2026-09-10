import { updateHomeBanner, deleteHomeBanner } from "@/controllers/homePromoBannerController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const data = await updateHomeBanner(req, id);
        return successResponse(data, "Banner updated successfully");
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Error updating promo banner:", error);
        return errorResponse("An error occurred", 500);
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const data = await deleteHomeBanner(id);
        return successResponse(data, "Banner deleted successfully");
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Error deleting promo banner:", error);
        return errorResponse("An error occurred", 500);
    }
}
