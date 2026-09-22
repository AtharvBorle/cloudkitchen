import { updateSellerBookingStatus, getSellerBookings } from "@/controllers/sellerRoomController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET() {
    try {
        const data = await getSellerBookings();
        return successResponse(data, "Bookings retrieved successfully", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Seller get bookings error:", error);
        return errorResponse("An error occurred", 500);
    }
}

export async function PATCH(req: Request) {
    try {
        const data = await updateSellerBookingStatus(req);
        return successResponse(data, "Booking status updated successfully", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Seller update booking status error:", error);
        return errorResponse("An error occurred", 500);
    }
}
