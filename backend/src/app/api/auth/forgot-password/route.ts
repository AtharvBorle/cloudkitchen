import { forgotPasswordRequest } from "@/controllers/authController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";
import { getClientIp, rateLimit, createRateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: Request) {
    try {
        const clientIp = getClientIp(req);
        const ipLimit = rateLimit(clientIp, { keyPrefix: "forgot_pw_ip", limit: 5, windowSeconds: 900 });
        if (!ipLimit.allowed) {
            return createRateLimitResponse(ipLimit);
        }

        const data = await forgotPasswordRequest(req);
        return successResponse(data, data.message || "OTP sent successfully", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Forgot password request error:", error);
        return errorResponse(error?.message || "Failed to process forgot password request", 500);
    }
}
