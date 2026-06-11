import { setDefaultAddress } from "@/controllers/userAddressController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const id = (await params).id;
        if (!id) return errorResponse("Address ID required", 400);

        await setDefaultAddress(id);
        return successResponse(null, "Address set as default", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        return errorResponse("An error occurred", 500);
    }
}
