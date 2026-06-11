import { createAddress } from "@/controllers/userAddressController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function POST(req: Request) {
    try {
        const data = await createAddress(req);
        return successResponse(data, "Address added successfully", 201);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        return errorResponse("An error occurred while adding the address", 500);
    }
}
