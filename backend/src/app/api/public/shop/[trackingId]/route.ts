import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";
import { getCategoryExpiries } from "@/lib/subscription";

export async function GET(req: Request, { params }: { params: Promise<{ trackingId: string }> }) {
    try {
        const { trackingId } = await params;

        const seller = await db.sellerProfile.findUnique({
            where: { trackingId: trackingId },
            include: {
                user: true,
                foodItems: {
                    where: { isAvailable: true },
                    include: {
                        itemRatings: true,
                        foodCategory: true,
                        foodSubCategory: true
                    }
                },
                rooms: {
                    where: { isAvailable: true }
                },
                subscriptions: {
                    where: { status: "ACTIVE" },
                    include: { plan: true }
                },
                reviews: {
                    include: {
                        user: {
                            select: { name: true }
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
                }
            }
        });

        if (!seller || !seller.user.isActive) {
            throw new ApiError("Shop not found", 404);
        }

        const { foodExpiry, propertyExpiry } = getCategoryExpiries(seller.subscriptions);
        const isFoodActive = foodExpiry ? foodExpiry > new Date() : false;
        const isPropertyActive = propertyExpiry ? propertyExpiry > new Date() : false;

        if (!isFoodActive && !isPropertyActive) {
            throw new ApiError("Shop is currently inactive (No active subscription)", 404);
        }

        if (!isFoodActive) {
            seller.foodItems = [];
        }
        if (!isPropertyActive) {
            seller.rooms = [];
        }

        // Calculate seller's average rating
        const totalReviews = seller.reviews.length;
        const sumRating = seller.reviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = totalReviews > 0 ? parseFloat((sumRating / totalReviews).toFixed(1)) : 0;

        // Process food items with their average rating
        const processedFoodItems = seller.foodItems.map((item: any) => {
            const ratings = item.itemRatings || [];
            const totalRatings = ratings.length;
            const sumItemRating = ratings.reduce((sum: number, r: any) => sum + r.rating, 0);
            const avgRating = totalRatings > 0 ? parseFloat((sumItemRating / totalRatings).toFixed(1)) : 0;

            return {
                ...item,
                averageRating: avgRating,
                totalRatings: totalRatings,
                itemRatings: undefined // Remove raw ratings array
            };
        });

        // Construct response with rating stats
        const responseData = {
            ...seller,
            foodItems: processedFoodItems,
            averageRating,
            totalReviews
        };

        return successResponse(responseData);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Fetch public shop error:", error);
        return errorResponse("Internal server error", 500);
    }
}
