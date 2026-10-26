import { getSellerAddonById, updateSellerAddon, deleteSellerAddon } from "@/controllers/sellerAddonController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const addon = await getSellerAddonById(id);
        return successResponse(addon);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Seller addon GET by id error:", error);
        return errorResponse("Internal server error", 500);
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const addon = await updateSellerAddon(id, req);
        return successResponse(addon, "Add-on updated successfully");
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Seller addon PATCH error:", error);
        return errorResponse("Internal server error", 500);
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const result = await deleteSellerAddon(id);
        return successResponse(result, "Add-on deleted successfully");
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Seller addon DELETE error:", error);
        return errorResponse("Internal server error", 500);
    }
}
