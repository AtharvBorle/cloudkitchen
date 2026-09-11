import { getSellerRooms, createSellerRoom, updateSellerRoom, deleteSellerRoom } from "@/controllers/sellerRoomController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET() {
    try {
        const data = await getSellerRooms();
        return successResponse(data);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        return errorResponse("An error occurred", 500);
    }
}

export async function POST(req: Request) {
    try {
        const data = await createSellerRoom(req);
        return successResponse(data, "Room created successfully", 201);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        return errorResponse("An error occurred", 500);
    }
}

export async function PATCH(req: Request) {
    try {
        const data = await updateSellerRoom(req);
        return successResponse(data, "Room updated successfully", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        return errorResponse("An error occurred", 500);
    }
}

export async function DELETE(req: Request) {
    try {
        const data = await deleteSellerRoom(req);
        return successResponse(data, "Room deleted successfully", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        return errorResponse("An error occurred", 500);
    }
}
