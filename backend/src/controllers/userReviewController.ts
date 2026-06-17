import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";

export const getOrderReview = async (orderId: string) => {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== "USER") {
        throw new ApiError("Unauthorized", 401);
    }

    const review = await db.review.findFirst({
        where: {
            orderId,
            userId: session.user.id
        },
        include: {
            itemRatings: true
        }
    });

    return { review };
};

export const submitOrderReview = async (orderId: string, req: Request) => {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== "USER") {
        throw new ApiError("Unauthorized", 401);
    }

    // Find the order
    const order = await db.order.findUnique({
        where: { id: orderId }
    });

    if (!order) {
        throw new ApiError("Order not found", 404);
    }

    if (order.userId !== session.user.id) {
        throw new ApiError("Unauthorized to review this order", 403);
    }

    if (order.status !== "DELIVERED") {
        throw new ApiError("Only completed orders can be reviewed", 400);
    }

    // Check if review already exists
    const existing = await db.review.findUnique({
        where: { orderId }
    });

    if (existing) {
        throw new ApiError("You have already reviewed this order", 400);
    }

    const body = await req.json();
    const { rating, comment, itemRatings } = body; 

    if (!rating || rating < 1 || rating > 5) {
        throw new ApiError("Valid overall order rating (1-5 stars) is required", 400);
    }

    // Create the review and item reviews inside a transaction
    const review = await db.$transaction(async (tx) => {
        const newReview = await tx.review.create({
            data: {
                orderId,
                userId: session.user.id,
                sellerId: order.sellerId,
                rating: parseInt(rating),
                comment: comment || null
            }
        });

        if (itemRatings && Array.isArray(itemRatings) && itemRatings.length > 0) {
            // Filter out any ratings with invalid values
            const validItemRatings = itemRatings
                .filter(ir => ir.foodItemId && ir.rating >= 1 && ir.rating <= 5)
                .map((ir: any) => ({
                    reviewId: newReview.id,
                    foodItemId: ir.foodItemId,
                    rating: parseInt(ir.rating),
                    comment: ir.comment || null
                }));

            if (validItemRatings.length > 0) {
                await tx.itemRating.createMany({
                    data: validItemRatings
                });
            }
        }

        return newReview;
    });

    return { review };
};
