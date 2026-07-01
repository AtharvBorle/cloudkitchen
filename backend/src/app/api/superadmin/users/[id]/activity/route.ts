import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getAuthSession();
        if (!session?.user || (session.user.role !== "SUPERADMIN" && session.user.role !== "SUPPORT")) {
            throw new ApiError("Unauthorized", 401);
        }

        const userId = (await params).id;
        if (!userId) return errorResponse("User ID is required", 400);

        // Fetch orders
        const orders = await db.order.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            include: {
                seller: {
                    select: {
                        businessName: true
                    }
                },
                refund: true
            }
        });

        // Fetch bookings
        const bookings = await db.booking.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            include: {
                room: {
                    select: {
                        title: true,
                        price: true
                    }
                },
                refund: true
            }
        });

        return successResponse({ orders, bookings });
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Get user activity error:", error);
        return errorResponse(`Internal server error: ${error.message || error}`, 500);
    }
}
