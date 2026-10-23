import { registerUser } from "@/controllers/authController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";
import { getClientIp, rateLimit, createRateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: Request) {
    try {
        const clientIp = getClientIp(req);
        const ipLimit = rateLimit(clientIp, { keyPrefix: "register_ip", limit: 10, windowSeconds: 900 });
        if (!ipLimit.allowed) {
            return createRateLimitResponse(ipLimit);
        }

        const data = await registerUser(req);
        return successResponse(data, "User created successfully", 201);
    } catch (error: any) {
        if (error instanceof ApiError) {
            return errorResponse(error.message, error.statusCode);
        }
        console.error("Registration error:", error);
        return errorResponse("An error occurred during registration", 500);
    }
}
