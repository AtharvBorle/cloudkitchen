import { getPublicRoomAvailability } from "@/controllers/publicController";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const data = await getPublicRoomAvailability(id);
        return successResponse(data);
    } catch (error: any) {
        console.error("Failed to fetch availability:", error);
        if (error.message === "Room ID is required") return errorResponse(error.message, 400);
        return errorResponse("An error occurred", 500);
    }
}
