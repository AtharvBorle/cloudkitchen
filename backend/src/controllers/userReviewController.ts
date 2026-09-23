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

export const submitAppFeedback = async (req: Request) => {
    const session = await getAuthSession();
    
    // Resolve user ID from session or fallback to default user if unauthenticated
    let userId = session?.user?.id;
    if (!userId) {
        const defaultUser = await db.user.findFirst({
            where: { role: "USER" }
        }) || await db.user.findFirst();

        if (defaultUser) {
            userId = defaultUser.id;
        } else {
            throw new ApiError("Please log in to submit your feedback", 401);
        }
    }

    const body = await req.json();
    const { rating, comment, aspects, tags, sentiment, sellerId: explicitSellerId } = body;

    const parsedRating = parseInt(rating, 10);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        throw new ApiError("Valid rating between 1 and 5 is required", 400);
    }

    // Determine seller to link to if not provided
    let sellerId = explicitSellerId || null;

    if (!sellerId) {
        // Find latest order for user to associate seller
        const latestOrder = await db.order.findFirst({
            where: { userId },
            orderBy: { createdAt: "desc" }
        });

        if (latestOrder) {
            sellerId = latestOrder.sellerId;
        } else {
            // Find first available approved seller in the system so feedback is linked
            const defaultSeller = await db.sellerProfile.findFirst({
                where: { verificationStatus: "APPROVED" }
            }) || await db.sellerProfile.findFirst();

            if (defaultSeller) {
                sellerId = defaultSeller.id;
            }
        }
    }

    const aspectsJson = Array.isArray(aspects) ? JSON.stringify(aspects) : typeof aspects === "string" ? aspects : "[]";
    const tagsJson = Array.isArray(tags) ? JSON.stringify(tags) : typeof tags === "string" ? tags : "[]";

    // Rate Our App creates general experience reviews without unique order constraint
    const newReview = await db.review.create({
        data: {
            userId: userId,
            sellerId: sellerId,
            orderId: null as any,
            rating: parsedRating,
            comment: comment ? String(comment).trim() : null,
            aspects: aspectsJson,
            tags: tagsJson,
            sentiment: sentiment ? String(sentiment).trim() : null
        } as any,
        include: {
            user: {
                select: { name: true, email: true }
            },
            seller: {
                select: { id: true, businessName: true }
            }
        }
    });

    return {
        success: true,
        review: newReview
    };
};

export const getAppFeedback = async () => {
    const session = await getAuthSession();
    let userId = session?.user?.id;
    if (!userId) {
        const defaultUser = await db.user.findFirst({
            where: { role: "USER" }
        }) || await db.user.findFirst();
        userId = defaultUser?.id;
    }

    if (!userId) {
        return { reviews: [] };
    }

    const reviews = await db.review.findMany({
        where: { userId },
        include: {
            seller: {
                select: { id: true, businessName: true }
            }
        },
        orderBy: { createdAt: "desc" },
        take: 20
    });

    const parseJsonArray = (val: string | null | undefined): string[] => {
        if (!val) return [];
        try {
            const parsed = JSON.parse(val);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    };

    const formattedReviews = reviews.map((r) => ({
        ...r,
        aspects: parseJsonArray((r as any).aspects),
        tags: parseJsonArray((r as any).tags),
        sentiment: (r as any).sentiment || null,
        managerResponse: r.sellerReply ? {
            text: r.sellerReply,
            createdAt: r.repliedAt || r.updatedAt,
            date: r.repliedAt || r.updatedAt
        } : null
    }));

    return { reviews: formattedReviews };
};

