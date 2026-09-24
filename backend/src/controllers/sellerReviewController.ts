import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";

export const getSellerReviews = async () => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to view customer reviews.", 401);
    }
    if (session.user.role !== "SELLER") {
        throw new ApiError("Access denied. Seller account required.", 403);
    }

    const sellerProfile = await db.sellerProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!sellerProfile) {
        throw new ApiError("Seller profile could not be found. Please complete your registration.", 404);
    }

    // Fetch all reviews for this seller (including platform reviews)
    const reviews = await db.review.findMany({
        where: {
            OR: [
                { sellerId: sellerProfile.id },
                { sellerId: null as any }
            ]
        },
        include: {
            user: {
                select: { name: true, email: true }
            },
            itemRatings: {
                include: {
                    foodItem: {
                        select: { name: true }
                    }
                }
            }
        },
        orderBy: { createdAt: "desc" }
    });

    // Calculate stats
    const totalReviews = reviews.length;
    let sumRating = 0;
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    reviews.forEach((r) => {
        sumRating += r.rating;
        const ratingKey = r.rating as 1 | 2 | 3 | 4 | 5;
        if (ratingDistribution[ratingKey] !== undefined) {
            ratingDistribution[ratingKey]++;
        }
    });

    const averageRating = totalReviews > 0 ? parseFloat((sumRating / totalReviews).toFixed(1)) : 0;

    // Fetch item-specific rating aggregates for items owned by this seller
    const foodItems = await db.foodItem.findMany({
        where: { sellerId: sellerProfile.id },
        include: {
            itemRatings: {
                include: {
                    review: {
                        include: {
                            user: {
                                select: { name: true }
                            }
                        }
                    }
                }
            }
        }
    });

    const foodItemStats = foodItems.map((item) => {
        const itemRatings = item.itemRatings;
        const totalItemRatings = itemRatings.length;
        const sumItemRating = itemRatings.reduce((sum, ir) => sum + ir.rating, 0);
        const avgItemRating = totalItemRatings > 0 ? parseFloat((sumItemRating / totalItemRatings).toFixed(1)) : 0;

        return {
            id: item.id,
            name: item.name,
            imageUrl: item.imageUrl,
            price: item.price,
            averageRating: avgItemRating,
            totalRatings: totalItemRatings,
            ratings: itemRatings.map(ir => ({
                id: ir.id,
                rating: ir.rating,
                comment: ir.comment,
                createdAt: ir.createdAt,
                userName: ir.review.user.name
            }))
        };
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

    return {
        stats: {
            averageRating,
            totalReviews,
            ratingDistribution
        },
        reviews: formattedReviews,
        foodItemStats
    };
};

export const replyToReview = async (reviewId: string, req: Request) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to reply to reviews.", 401);
    }
    if (session.user.role !== "SELLER") {
        throw new ApiError("Access denied. Seller account required.", 403);
    }

    const sellerProfile = await db.sellerProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!sellerProfile) {
        throw new ApiError("Seller profile could not be found. Please complete your registration.", 404);
    }

    const review = await db.review.findUnique({
        where: { id: reviewId }
    });

    if (!review) {
        throw new ApiError("The requested review could not be found.", 404);
    }

    if (review.sellerId && review.sellerId !== sellerProfile.id) {
        throw new ApiError("Access denied. You cannot reply to reviews for another seller.", 403);
    }

    const body = await req.json();
    const { replyText, response, text, comment } = body;
    const finalReply = replyText || response || text || comment;

    if (!finalReply || !finalReply.trim()) {
        throw new ApiError("Reply content cannot be empty.", 400);
    }

    const updated = await db.review.update({
        where: { id: reviewId },
        data: {
            sellerId: review.sellerId || sellerProfile.id,
            sellerReply: finalReply.trim(),
            repliedAt: new Date()
        },
        include: {
            user: {
                select: { name: true, email: true }
            },
            itemRatings: {
                include: {
                    foodItem: {
                        select: { name: true }
                    }
                }
            }
        }
    });

    return {
        ...updated,
        managerResponse: {
            text: updated.sellerReply,
            createdAt: updated.repliedAt,
            date: updated.repliedAt
        }
    };
};
