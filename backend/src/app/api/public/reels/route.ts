import { getPublicCuratedReels } from "@/controllers/reelsController";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET() {
  try {
    const reels = await getPublicCuratedReels();
    return successResponse({ reels });
  } catch (error: any) {
    console.error("Error fetching public reels:", error);
    return errorResponse("Failed to fetch reels", 500);
  }
}
