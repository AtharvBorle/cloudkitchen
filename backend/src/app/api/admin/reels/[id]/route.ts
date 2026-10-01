import { updateAdminReel, deleteAdminReel } from "@/controllers/reelsController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await updateAdminReel(id, req);
    return successResponse(data, data.message);
  } catch (error: any) {
    if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
    console.error("Error updating reel:", error);
    return errorResponse("Failed to update reel", 500);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await deleteAdminReel(id);
    return successResponse(data, data.message);
  } catch (error: any) {
    if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
    console.error("Error deleting reel:", error);
    return errorResponse("Failed to delete reel", 500);
  }
}
