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
                },
                subscriptions: {
                    where: { status: "ACTIVE" },
                    include: { plan: true }
                }
            }
        });

        if (!seller || !seller.user.isActive) {
            throw new ApiError("Shop not found", 404);
        }

        const now = new Date();
        const isFoodActive = seller.subscriptions.some(sub => 
            sub.status === "ACTIVE" && 
            (sub.validUntil === null || new Date(sub.validUntil) > now) &&
            (sub.plan?.category === "FOOD" || sub.plan?.category === "BOTH")
        );
        const isPropertyActive = seller.subscriptions.some(sub => 
            sub.status === "ACTIVE" && 
            (sub.validUntil === null || new Date(sub.validUntil) > now) &&
            (sub.plan?.category === "PROPERTY" || sub.plan?.category === "BOTH")
        );

        if (!isFoodActive && !isPropertyActive) {
            throw new ApiError("Shop is currently inactive (No active subscription)", 404);
        }

        if (!isFoodActive) {
            seller.foodItems = [];
        }
        if (!isPropertyActive) {
            seller.rooms = [];
        }

        return successResponse(seller);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Fetch public shop error:", error);
        return errorResponse("Internal server error", 500);
    }
}
