import { updateAddress, deleteAddress } from "@/controllers/userAddressController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const id = (await params).id;
        if (!id) return errorResponse("Address ID required", 400);

        const data = await updateAddress(req, id);
        return successResponse(data, "Address updated");
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        return errorResponse("An error occurred", 500);
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const id = (await params).id;
        if (!id) return errorResponse("Address ID required", 400);

        await deleteAddress(id);
        return successResponse(null, "Address deleted", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        return errorResponse("An error occurred", 500);
    }
}
