import { createAddress, getUserAddresses } from "@/controllers/userAddressController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET() {
    try {
        const data = await getUserAddresses();
        return successResponse(data, "Addresses fetched successfully");
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        return errorResponse("An error occurred while fetching addresses", 500);
    }
}

export async function POST(req: Request) {
    try {
        const data = await createAddress(req);
        return successResponse(data, "Address added successfully", 201);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        return errorResponse("An error occurred while adding the address", 500);
    }
}
