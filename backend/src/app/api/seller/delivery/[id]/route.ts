import { updateSellerDeliveryPerson, deleteSellerDeliveryPerson } from "@/controllers/sellerDeliveryController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

export async function PUT(req: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const data = await updateSellerDeliveryPerson(req, id);
        return successResponse(data, "Delivery person updated successfully", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Update delivery person error:", error);
        return errorResponse("An error occurred while updating the delivery person", 500);
    }
}

export async function PATCH(req: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const data = await updateSellerDeliveryPerson(req, id);
        return successResponse(data, "Delivery person updated successfully", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Patch delivery person error:", error);
        return errorResponse("An error occurred while updating the delivery person", 500);
    }
}

export async function DELETE(req: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const data = await deleteSellerDeliveryPerson(id);
        return successResponse(data, "Delivery person deleted successfully", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Delete delivery person error:", error);
        return errorResponse("An error occurred while deleting the delivery person", 500);
    }
}
