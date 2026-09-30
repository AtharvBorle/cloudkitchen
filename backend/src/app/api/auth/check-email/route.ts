import { checkEmailAvailability } from "@/controllers/authController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function POST(req: Request) {
    try {
        const data = await checkEmailAvailability(req);
        return successResponse(data, data.message, 200);
    } catch (error: any) {
        if (error instanceof ApiError) {
            return errorResponse(error.message, error.statusCode);
        }
        console.error("Check email error:", error);
        return errorResponse("An error occurred while checking email availability", 500);
    }
}

export async function GET(req: Request) {
    try {
        const data = await checkEmailAvailability(req);
        return successResponse(data, data.message, 200);
    } catch (error: any) {
        if (error instanceof ApiError) {
            return errorResponse(error.message, error.statusCode);
        }
        console.error("Check email error:", error);
        return errorResponse("An error occurred while checking email availability", 500);
    }
}
