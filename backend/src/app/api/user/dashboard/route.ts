import { getUserDashboard } from "@/controllers/userController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET() {
    try {
        const data = await getUserDashboard();
        return successResponse(data, "Dashboard data fetched successfully");
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        return errorResponse("An error occurred while fetching dashboard data", 500);
    }
}
