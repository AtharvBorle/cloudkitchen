import { initiateBookingPayment } from "@/controllers/userBookingController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const id = (await params).id;
        if (!id) return errorResponse("Booking ID is required", 400);

        const data = await initiateBookingPayment(req, id);
        return successResponse(data, "Booking payment initiated successfully", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Initiate booking payment error:", error);
        return errorResponse("An error occurred", 500);
    }
}
