import { getPublicSystemSettings } from "@/controllers/superadminSettingController";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET() {
    try {
        const data = await getPublicSystemSettings();
        const response = successResponse(data);
        response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
        return response;
    } catch (error) {
        console.error("Error fetching public system settings:", error);
        return errorResponse("An error occurred", 500);
    }
}
