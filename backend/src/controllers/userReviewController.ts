import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";

export const getOrderReview = async (orderId: string) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to view your order review.", 401);
    }
    if (session.user.role !== "USER") {
        throw new ApiError("Access denied. Customer account required.", 403);
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
    if (!session?.user) {
        throw new ApiError("Please log in first to submit a review.", 401);
    }
    if (session.user.role !== "USER") {
        throw new ApiError("Access denied. Customer account required.", 403);
    }

    // Find the order
    const order = await db.order.findUnique({
        where: { id: orderId }
    });

    if (!order) {
        throw new ApiError("Order not found", 404);
    }

    if (order.userId !== session.user.id) {
        throw new ApiError("Access denied. You can only review orders placed from your own account.", 403);
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

    const parsedRating = parseInt(String(rating), 10);

    // Parse items from the order
    let parsedOrderItems: any[] = [];
    try {
        parsedOrderItems = typeof order.items === "string" ? JSON.parse(order.items) : (order.items || []);
    } catch {
        parsedOrderItems = [];
    }

    // Lookup seller food items for ID resolution
    const sellerFoodItems = await db.foodItem.findMany({
        where: {
            OR: [
                { sellerId: order.sellerId },
                ...(order.sellerId ? [{ seller: { trackingId: order.sellerId } }] : [])
            ]
        }
    });

    const foodItemMap = new Map<string, any>();
    const foodItemByName = new Map<string, any>();
    sellerFoodItems.forEach(fi => {
        foodItemMap.set(fi.id, fi);
        foodItemByName.set(fi.name.toLowerCase().trim(), fi);
    });

    const finalItemRatings: Array<{ foodItemId: string; rating: number; comment?: string | null }> = [];
    const ratedFoodItemIds = new Set<string>();

    if (itemRatings && Array.isArray(itemRatings) && itemRatings.length > 0) {
        for (const ir of itemRatings) {
            const rawId = String(ir.foodItemId || ir.id || "").trim();
            const cleanId = rawId.includes("_") ? rawId.split("_")[0] : rawId;
            const parsedItemRate = parseInt(String(ir.rating), 10);
            if (isNaN(parsedItemRate) || parsedItemRate < 1 || parsedItemRate > 5) continue;

            let matched = foodItemMap.get(rawId) || foodItemMap.get(cleanId);
            if (!matched && ir.name) {
                matched = foodItemByName.get(String(ir.name).toLowerCase().trim());
            }

            if (matched && !ratedFoodItemIds.has(matched.id)) {
                finalItemRatings.push({
                    foodItemId: matched.id,
                    rating: parsedItemRate,
                    comment: ir.comment || null
                });
                ratedFoodItemIds.add(matched.id);
            }
        }
    }

    // For any ordered items not explicitly rated individually, assign the overall order rating
    for (const orderedItem of parsedOrderItems) {
        const rawId = String(orderedItem.foodItemId || orderedItem.id || "").trim();
        const cleanId = rawId.includes("_") ? rawId.split("_")[0] : rawId;

        let matched = foodItemMap.get(rawId) || foodItemMap.get(cleanId);
        if (!matched && orderedItem.name) {
            matched = foodItemByName.get(String(orderedItem.name).toLowerCase().trim());
        }

        if (matched && !ratedFoodItemIds.has(matched.id)) {
            finalItemRatings.push({
                foodItemId: matched.id,
                rating: parsedRating,
                comment: null
            });
            ratedFoodItemIds.add(matched.id);
        }
    }

    // Create the review and item reviews inside a transaction
    const review = await db.$transaction(async (tx) => {
        const newReview = await tx.review.create({
            data: {
                orderId,
                userId: session.user.id,
                sellerId: order.sellerId,
                rating: parsedRating,
                comment: comment || null
            }
        });

        if (finalItemRatings.length > 0) {
            await tx.itemRating.createMany({
                data: finalItemRatings.map(fir => ({
                    reviewId: newReview.id,
                    foodItemId: fir.foodItemId,
                    rating: fir.rating,
                    comment: fir.comment || null
                }))
            });
        }

        return tx.review.findUnique({
            where: { id: newReview.id },
            include: { itemRatings: true }
        });
    });

    return { review };
};

export const submitAppFeedback = async (req: Request) => {
    const body = await req.json().catch(() => ({}));
    const { rating } = body;

    const parsedRating = parseInt(rating, 10);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        throw new ApiError("Valid rating between 1 and 5 is required", 400);
    }

    // App reviews are for app store feedback and do not alter kitchen/seller ratings or records
    return {
        success: true,
        message: "Thank you for your rating & feedback! Your review has been recorded."
    };
};

export const getAppFeedback = async () => {
    // App feedback is not tied to kitchen order reviews
    return { reviews: [] };
};

