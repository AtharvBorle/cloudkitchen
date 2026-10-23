import { loginUser } from "@/controllers/authController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";
import { getClientIp, rateLimit, createRateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: Request) {
    try {
        const clientIp = getClientIp(req);
        const ipLimit = rateLimit(clientIp, { keyPrefix: "login_ip", limit: 15, windowSeconds: 900 });
        if (!ipLimit.allowed) {
            return createRateLimitResponse(ipLimit);
        }

        const data = await loginUser(req);
        return successResponse(data, "Login successful", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Mobile login error:", error);
        return errorResponse("An error occurred during login", 500);
    }
}
