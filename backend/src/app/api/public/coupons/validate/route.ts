import { validateCouponForCart } from "@/controllers/publicController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
    try {
        const data = await validateCouponForCart(req);
        const response = successResponse(data, data.message);
        response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
        response.headers.set("Pragma", "no-cache");
        response.headers.set("Expires", "0");
        return response;
    } catch (error: any) {
        if (error instanceof ApiError) {
            return errorResponse(error.message, error.statusCode);
        }
        console.error("Error validating coupon:", error);
        return errorResponse(error.message || "Failed to validate coupon", 500);
    }
}
