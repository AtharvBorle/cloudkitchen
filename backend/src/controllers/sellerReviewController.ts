import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";

export const getSellerReviews = async () => {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== "SELLER") {
        throw new ApiError("Unauthorized", 401);
    }

    const sellerProfile = await db.sellerProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!sellerProfile) {
        throw new ApiError("Seller profile not found", 404);
    }

    // Fetch all reviews for this seller
    const reviews = await db.review.findMany({
        where: { sellerId: sellerProfile.id },
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

    return {
        stats: {
            averageRating,
            totalReviews,
            ratingDistribution
        },
        reviews,
        foodItemStats
    };
};
