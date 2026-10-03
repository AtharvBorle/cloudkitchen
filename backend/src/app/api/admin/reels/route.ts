import { getAdminReels } from "@/controllers/reelsController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET(req: Request) {
  try {
    const data = await getAdminReels(req);
    return successResponse(data);
  } catch (error: any) {
    if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
    console.error("Error fetching reels:", error);
    return errorResponse("Failed to fetch reels", 500);
  }
}
