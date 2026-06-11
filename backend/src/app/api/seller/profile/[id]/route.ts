import { getSellerById } from "@/controllers/sellerProfileController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const id = (await params).id;
        const data = await getSellerById(id);
        return successResponse(data);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Seller fetch error:", error);
        return errorResponse("An error occurred while fetching seller details", 500);
    }
}
