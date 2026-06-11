import { createBooking } from "@/controllers/userBookingController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
    try {
        const session = await getAuthSession();
        if (!session?.user || session.user.role !== "USER") {
            throw new ApiError("Unauthorized", 401);
        }

        const bookings = await db.booking.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
            include: {
                room: {
                    include: { seller: { include: { user: true } } }
                }
            }
        });

        return successResponse(bookings);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Fetch user bookings error:", error);
        return errorResponse("Internal server error", 500);
    }
}

export async function POST(req: Request) {
    try {
        const data = await createBooking(req);
        return successResponse(data, "Room booked successfully", 201);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        return errorResponse("An error occurred during booking", 500);
    }
}
