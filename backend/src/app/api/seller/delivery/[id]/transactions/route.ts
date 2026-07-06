import { getDeliveryTransactions } from "@/controllers/sellerDeliveryController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

export async function GET(req: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const data = await getDeliveryTransactions(id);
        return successResponse(data);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Fetch transactions error:", error);
        return errorResponse("An error occurred while fetching transactions", 500);
    }
}
