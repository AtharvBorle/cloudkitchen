import { getAllCoupons, createCoupon } from "@/controllers/couponController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET(req: Request) {
    try {
        const data = await getAllCoupons();
        return successResponse(data);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Fetch coupons error:", error);
        return errorResponse("An error occurred while fetching coupons", 500);
    }
}

export async function POST(req: Request) {
    try {
        const data = await createCoupon(req);
        return successResponse(data, "Coupon created successfully", 201);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Create coupon error:", error);
        return errorResponse("An error occurred while creating coupon", 500);
    }
}
