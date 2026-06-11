import { getPublicCategories } from "@/controllers/publicController";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET() {
    try {
        const data = await getPublicCategories();
        return successResponse(data);
    } catch (error) {
        console.error("Error fetching public categories:", error);
        return errorResponse("An error occurred fetching categories", 500);
    }
}
