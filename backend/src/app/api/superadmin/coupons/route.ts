import { getCoupons, createCoupon } from "@/controllers/superadminCouponController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET() {
    try {
        const data = await getCoupons();
        return successResponse(data);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Error fetching coupons/subscriptions:", error);
        return errorResponse("An error occurred", 500);
    }
}

export async function POST(req: Request) {
    try {
        const data = await createCoupon(req);
        return successResponse(data, "Coupon created", 201);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Error creating coupon:", error);
        return errorResponse("An error occurred", 500);
    }
}
