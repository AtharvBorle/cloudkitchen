import { adjustDeliveryBalance } from "@/controllers/sellerDeliveryController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

export async function POST(req: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const data = await adjustDeliveryBalance(req, id);
        return successResponse(data, "Wallet adjusted successfully", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Adjust wallet error:", error);
        return errorResponse(error.message || "An error occurred while adjusting wallet", 500);
    }
}
