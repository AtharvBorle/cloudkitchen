import { resetPasswordWithOtp } from "@/controllers/authController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";
import { getClientIp, rateLimit, createRateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: Request) {
    try {
        const clientIp = getClientIp(req);
        const ipLimit = rateLimit(clientIp, { keyPrefix: "reset_pw_ip", limit: 5, windowSeconds: 900 });
        if (!ipLimit.allowed) {
            return createRateLimitResponse(ipLimit);
        }

        const data = await resetPasswordWithOtp(req);
        return successResponse(data, data.message || "Password reset successfully", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Reset password error:", error);
        return errorResponse(error?.message || "Failed to reset password", 500);
    }
}
