import { getReelSellersAndDishes } from "@/controllers/reelsController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET() {
  try {
    const data = await getReelSellersAndDishes();
    return successResponse(data);
  } catch (error: any) {
    if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
    console.error("Error fetching sellers and dishes for curation:", error);
    return errorResponse("Failed to fetch sellers and dishes", 500);
  }
}
