import { syncAdminReels } from "@/controllers/reelsController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function POST() {
  try {
    const data = await syncAdminReels();
    return successResponse(data, data.message);
  } catch (error: any) {
    if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
    console.error("Error syncing Instagram reels:", error);
    return errorResponse("Failed to sync Instagram reels", 500);
  }
}
