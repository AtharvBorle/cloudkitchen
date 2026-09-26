import { forgotPasswordRequest } from "@/controllers/authController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function POST(req: Request) {
    try {
        const data = await forgotPasswordRequest(req);
        return successResponse(data, data.message || "OTP sent successfully", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Forgot password request error:", error);
        return errorResponse(error?.message || "Failed to process forgot password request", 500);
    }
}
