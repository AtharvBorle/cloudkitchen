import { getPublicCoupons } from "@/controllers/publicController";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const sellerId = searchParams.get("sellerId");

        const data = await getPublicCoupons(sellerId);
        return successResponse(data);
    } catch (error: any) {
        console.error("Error fetching public coupons:", error);
        if (error.message === "sellerId is required") return errorResponse(error.message, 400);
        return errorResponse("An error occurred fetching coupons", 500);
    }
}
