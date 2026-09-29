import { validateCouponForCart } from "@/controllers/publicController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function POST(req: Request) {
    try {
        const data = await validateCouponForCart(req);
        return successResponse({
            ...data,
            valid: true,
            coupon: data
        }, data.message);
    } catch (error: any) {
        if (error instanceof ApiError) {
            return errorResponse(error.message, error.statusCode);
        }
        console.error("Error validating coupon:", error);
        return errorResponse(error.message || "Failed to validate coupon", 500);
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const code = searchParams.get("code") || "";
        const sellerId = searchParams.get("sellerId") || undefined;
        const subtotal = parseFloat(searchParams.get("subtotal") || "0");

        const mockReq = {
            json: async () => ({ code, sellerId, subtotal, items: [] })
        } as Request;

        const data = await validateCouponForCart(mockReq);
        return successResponse({
            ...data,
            valid: true,
            coupon: data
        }, data.message);
    } catch (error: any) {
        if (error instanceof ApiError) {
            return errorResponse(error.message, error.statusCode);
        }
        console.error("Error validating coupon:", error);
        return errorResponse(error.message || "Failed to validate coupon", 500);
    }
}
