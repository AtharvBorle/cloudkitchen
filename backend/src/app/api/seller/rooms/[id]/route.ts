import { updateSellerRoom, deleteSellerRoom, getSellerRoomById } from "@/controllers/sellerRoomController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const resolvedParams = await Promise.resolve(params);
        const { id } = resolvedParams;
        const data = await getSellerRoomById(id);
        return successResponse(data, "Room retrieved successfully", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Error retrieving room:", error);
        return errorResponse("An error occurred while retrieving room", 500);
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const resolvedParams = await Promise.resolve(params);
        const { id } = resolvedParams;
        const data = await updateSellerRoom(req, id);
        return successResponse(data, "Room updated successfully", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Error updating room:", error);
        return errorResponse("An error occurred while updating room", 500);
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const resolvedParams = await Promise.resolve(params);
        const { id } = resolvedParams;
        const data = await updateSellerRoom(req, id);
        return successResponse(data, "Room updated successfully", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Error updating room:", error);
        return errorResponse("An error occurred while updating room", 500);
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const resolvedParams = await Promise.resolve(params);
        const { id } = resolvedParams;
        const data = await deleteSellerRoom(req);
        return successResponse(data, "Room deleted successfully", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Error deleting room:", error);
        return errorResponse("An error occurred while deleting room", 500);
    }
}
