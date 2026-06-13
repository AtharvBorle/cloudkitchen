import { getPublicCategories } from "@/controllers/publicController";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET() {
    try {
        const data = await getPublicCategories();
        const response = successResponse(data);
        response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=30");
        return response;
    } catch (error) {
        console.error("Error fetching public categories:", error);
        return errorResponse("An error occurred fetching categories", 500);
    }
}
