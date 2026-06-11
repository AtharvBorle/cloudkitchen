import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET(req: Request, { params }: { params: Promise<{ trackingId: string }> }) {
    try {
        const { trackingId } = await params;

        const seller = await db.sellerProfile.findUnique({
            where: { trackingId: trackingId },
            include: {
                user: true,
                foodItems: {
                    where: { isAvailable: true }
                },
                rooms: {
                    where: { isAvailable: true }
                }
            }
        });

        if (!seller || !seller.user.isActive) {
            throw new ApiError("Shop not found", 404);
        }

        return successResponse(seller);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Fetch public shop error:", error);
        return errorResponse("Internal server error", 500);
    }
}
