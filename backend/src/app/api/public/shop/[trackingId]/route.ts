import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";
import { getCategoryExpiries } from "@/lib/subscription";

export async function GET(req: Request, { params }: { params: Promise<{ trackingId: string }> }) {
    try {
        const rawParam = (await params).trackingId || "";
        const trackingId = decodeURIComponent(rawParam).trim();

        if (!trackingId) {
            throw new ApiError("Shop identifier is required", 400);
        }

        const includeRelations = {
            user: true,
            servedPincodes: true,
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
            mealPlans: {
                where: { status: "Live" },
                orderBy: { weeklyPrice: "asc" as const }
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
                orderBy: { createdAt: "desc" as const }
            }
        };

        // 1. Direct and case-insensitive match on trackingId, id, userId, or businessName
        let seller = await db.sellerProfile.findFirst({
            where: {
                OR: [
                    { trackingId: { equals: trackingId, mode: 'insensitive' } },
                    { id: trackingId },
                    { userId: trackingId },
                    { businessName: { equals: trackingId, mode: 'insensitive' } },
                    { user: { name: { equals: trackingId, mode: 'insensitive' } } }
                ]
            },
            include: includeRelations
        });

        // 2. Slug and normalized fallback matching if not found
        if (!seller) {
            const cleanSlug = trackingId.toLowerCase().replace(/[^a-z0-9]/g, "");
            const withoutKitchenPrefix = trackingId.replace(/^kitchen[-_ ]?/i, "").toLowerCase().replace(/[^a-z0-9]/g, "");

            const allSellers = await db.sellerProfile.findMany({
                where: { user: { isActive: true } },
                include: includeRelations
            });

            seller = allSellers.find((s) => {
                const sTracking = (s.trackingId || "").toLowerCase().replace(/[^a-z0-9]/g, "");
                const sBusiness = (s.businessName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
                const sUser = (s.user?.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
                const sId = (s.id || "").toLowerCase();

                return (
                    (cleanSlug && (sTracking === cleanSlug || sBusiness === cleanSlug || sUser === cleanSlug)) ||
                    sId === trackingId.toLowerCase() ||
                    (withoutKitchenPrefix && (sBusiness === withoutKitchenPrefix || sTracking === withoutKitchenPrefix))
                );
            }) || null;
        }

        if (!seller || !seller.user.isActive) {
            throw new ApiError("Shop not found", 404);
        }

        const { foodExpiry, propertyExpiry } = getCategoryExpiries(seller.subscriptions);
        const isFoodActive = foodExpiry ? foodExpiry > new Date() : false;
        const isPropertyActive = propertyExpiry ? propertyExpiry > new Date() : false;
        const isApproved = seller.verificationStatus === "APPROVED";

        if (!isFoodActive && !isPropertyActive && !isApproved) {
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

        // Process active meal subscription plans
        const processedMealPlans = (seller.mealPlans || []).map((plan: any) => {
            let parsedFeatures: string[] = [];
            try {
                parsedFeatures = typeof plan.features === "string" ? JSON.parse(plan.features) : (plan.features || []);
            } catch {
                parsedFeatures = [];
            }

            let parsedTimings: string[] = [];
            try {
                parsedTimings = typeof plan.mealTimings === "string" ? JSON.parse(plan.mealTimings) : (plan.mealTimings || []);
            } catch {
                parsedTimings = [];
            }

            return {
                ...plan,
                sellerId: seller.id,
                sellerName: seller.businessName || seller.user?.name || "Kitchen Partner",
                weeklyPrice: plan.weeklyPrice,
                monthlyPrice: plan.monthlyPrice || plan.weeklyPrice * 4,
                quarterlyPrice: plan.quarterlyPrice || plan.weeklyPrice * 12 * 0.9,
                yearlyPrice: plan.yearlyPrice || plan.weeklyPrice * 52 * 0.8,
                features: parsedFeatures,
                mealTimings: parsedTimings,
            };
        });

        // Construct response with rating stats and active meal plans
        const responseData = {
            ...seller,
            foodItems: processedFoodItems,
            mealPlans: processedMealPlans,
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
