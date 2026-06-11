import { getSystemSetting, updateSystemSetting } from "@/controllers/superadminSettingController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET(req: Request) {
    try {
        const data = await getSystemSetting(req);
        return successResponse(data);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Error fetching setting:", error);
        return errorResponse("Internal server error", 500);
    }
}

export async function PUT(req: Request) {
    try {
        const data = await updateSystemSetting(req);
        return successResponse(data);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Error saving setting:", error);
        return errorResponse("Internal server error", 500);
    }
}
