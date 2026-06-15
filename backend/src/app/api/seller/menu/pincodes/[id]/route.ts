import { deleteServedPincode } from "@/controllers/sellerMenuController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const id = (await params).id;
        await deleteServedPincode(id);
        return successResponse(null, "Pincode deleted successfully");
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Error deleting served pincode:", error);
        return errorResponse("An error occurred", 500);
    }
}
