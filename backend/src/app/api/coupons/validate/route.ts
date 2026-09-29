import { validateCouponForCart } from "@/controllers/publicController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function POST(req: Request) {
    try {
        const data = await validateCouponForCart(req);
        return successResponse(data, data.message);
    } catch (error: any) {
        if (error instanceof ApiError) {
            return errorResponse(error.message, error.statusCode);
        }
        console.error("Error validating coupon:", error);
        return errorResponse(error.message || "Failed to validate coupon", 500);
    }
}
