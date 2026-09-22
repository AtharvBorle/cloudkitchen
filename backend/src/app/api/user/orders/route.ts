import { createOrder } from "@/controllers/userOrderController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
    try {
        const session = await getAuthSession();
        if (!session?.user || session.user.role !== "USER") {
            throw new ApiError("Unauthorized", 401);
        }

        const orders = await db.order.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
            include: {
                seller: true,
                deliveryPerson: true,
                refund: true,
                review: {
                    include: {
                        itemRatings: true
                    }
                }
            }
        });

        return successResponse(orders);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Fetch user orders error:", error);
        return errorResponse("Internal server error", 500);
    }
}

export async function POST(req: Request) {
    try {
        const data = await createOrder(req);
        return successResponse(data, "Order placed successfully", 201);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Checkout internal error:", error);
        return errorResponse("An error occurred during checkout", 500);
    }
}
