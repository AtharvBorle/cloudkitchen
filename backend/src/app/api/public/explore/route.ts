import { getPublicExploreData } from "@/controllers/publicController";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET() {
    try {
        const data = await getPublicExploreData();
        const response = successResponse(data);
        response.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=15");
        return response;
    } catch (error) {
        console.error("Error fetching public explore data:", error);
        return errorResponse("An error occurred", 500);
    }
}
