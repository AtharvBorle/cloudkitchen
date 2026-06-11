import { getSellerDeliveryPersons, createSellerDeliveryPerson } from "@/controllers/sellerDeliveryController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET() {
    try {
        const data = await getSellerDeliveryPersons();
        return successResponse(data);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Fetch delivery persons error:", error);
        return errorResponse("An error occurred while fetching delivery persons", 500);
    }
}

export async function POST(req: Request) {
    try {
        const data = await createSellerDeliveryPerson(req);
        return successResponse(data, "Delivery person created successfully", 201);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Create delivery person error:", error);
        return errorResponse(error.message || "An error occurred while creating the delivery person", 500);
    }
}
