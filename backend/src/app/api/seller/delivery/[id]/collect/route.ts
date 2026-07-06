import { collectDeliveryCash } from "@/controllers/sellerDeliveryController";
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
        const data = await collectDeliveryCash(req, id);
        return successResponse(data, "Cash collected successfully", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Collect cash error:", error);
        return errorResponse(error.message || "An error occurred while collecting cash", 500);
    }
}
