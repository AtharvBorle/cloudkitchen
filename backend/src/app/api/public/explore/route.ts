import { getPublicExploreData } from "@/controllers/publicController";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET() {
    try {
        const data = await getPublicExploreData();
        return successResponse(data);
    } catch (error) {
        console.error("Error fetching public explore data:", error);
        return errorResponse("An error occurred", 500);
    }
}
