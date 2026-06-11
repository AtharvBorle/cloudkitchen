import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET() {
    try {
        const session = await getAuthSession();
        if (!session || !session.user || session.user.role !== "SELLER") {
            throw new ApiError("Unauthorized", 401);
        }

        const sellerProfile = await db.sellerProfile.findUnique({
            where: { userId: session.user.id },
            include: {
                foodItems: true,
                rooms: true
            }
        });

        if (!sellerProfile) {
            throw new ApiError("Profile not found", 404);
        }

        const products = [
            ...sellerProfile.foodItems.map(item => ({ id: item.id, name: item.name, type: 'FOOD' })),
            ...sellerProfile.rooms.map(room => ({ id: room.id, name: room.title, type: 'ROOM' }))
        ];

        return successResponse({
            sellerId: sellerProfile.id,
            products
        });
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Fetch seller offers error:", error);
        return errorResponse("Internal server error", 500);
    }
}
