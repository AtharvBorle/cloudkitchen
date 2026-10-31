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
                include: {
                    itemRatings: true,
                    foodCategory: true,
                    foodSubCategory: true
                }
            },
            addons: {
                orderBy: { name: "asc" as const }
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

        if (!isFoodActive && !isApproved) {
            seller.foodItems = [];
        }
        if (!isPropertyActive && !isApproved) {
            seller.rooms = [];
        }

        // Calculate seller's average rating
        const totalReviews = seller.reviews.length;
        const sumRating = seller.reviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = totalReviews > 0 ? parseFloat((sumRating / totalReviews).toFixed(1)) : 0;

        const sellerAddonsMap = new Map<string, any>();
        if (Array.isArray(seller.addons)) {
            seller.addons.forEach((a: any) => {
                if (a && a.id) sellerAddonsMap.set(String(a.id), a);
                if (a && a.name) sellerAddonsMap.set(String(a.name).trim().toLowerCase(), a);
            });
        }

        // Process food items with their average rating and live addon stock
        const rawSellerFoodType = String(seller.foodType || "").toUpperCase().replace(/[\s-]/g, "_").trim();
        const isPureVegSeller = rawSellerFoodType === "PURE_VEG" || rawSellerFoodType === "VEG" || rawSellerFoodType === "VEG_ONLY" || rawSellerFoodType === "PUREVEG";
        const NON_VEG_REGEX = /\b(chicken|murgh?|mutton|gosht|egg|eggs|anda|fish|prawns?|shrimps?|meat|beef|pork|seafood|crab|keema|kheema|haleem|wings?|shawarma|non[\s-_]?veg)\b/i;

        const filteredFoodItems = (seller.foodItems || []).filter((item: any) => {
            if (isPureVegSeller) {
                const itemType = String(item.itemType || "").toUpperCase();
                if (itemType.includes("NON_VEG") || item.isVeg === false) return false;
                const text = `${item.name || ""} ${item.description || ""}`.toLowerCase();
                if (NON_VEG_REGEX.test(text)) return false;
            }
            return true;
        });

        const processedFoodItems = filteredFoodItems.map((item: any) => {
            let enrichedAddonsStr = item.addons;
            if (item.addons) {
                try {
                    const parsed = typeof item.addons === "string" ? JSON.parse(item.addons) : item.addons;
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        const enriched = parsed.map((a: any, idx: number) => {
                            const cleanId = String(a.id || `addon_${idx + 1}`);
                            const cleanName = String(a.name || "").trim().toLowerCase();
                            const live = sellerAddonsMap.get(cleanId) || sellerAddonsMap.get(cleanName);
                            return {
                                id: live ? live.id : cleanId,
                                name: live ? String(live.name).trim() : String(a.name || "").trim(),
                                price: live ? Number(live.price) : (Number(a.price) || 0),
                                stockQuantity: live ? Number(live.stockQuantity) : (a.stockQuantity !== undefined ? Number(a.stockQuantity) : 0),
                                lowStockThreshold: live ? Number(live.lowStockThreshold) : (Number(a.lowStockThreshold) || 5),
                                isActive: live ? Boolean(live.isActive) : (a.isActive !== false),
                                imageUrl: (live && live.imageUrl) ? live.imageUrl : (a.imageUrl || null),
                                description: (live && live.description !== undefined) ? live.description : (a.description || "")
                            };
                        });
                        enrichedAddonsStr = JSON.stringify(enriched);
                    }
                } catch {}
            }
            const ratings = item.itemRatings || [];
            const totalRatings = ratings.length;
            const sumItemRating = ratings.reduce((sum: number, r: any) => sum + r.rating, 0);
            const avgRating = totalRatings > 0 ? parseFloat((sumItemRating / totalRatings).toFixed(1)) : 0;

            return {
                ...item,
                addons: enrichedAddonsStr,
                averageRating: avgRating,
                totalRatings: totalRatings,
                rating: avgRating > 0 ? avgRating : 0,
                reviewsCount: totalRatings,
                itemRatings: ratings
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

            const isWeekly = (plan.duration || "1 Week").toLowerCase().includes("week");
            return {
                ...plan,
                sellerId: seller.id,
                sellerName: seller.businessName || seller.user?.name || "Kitchen Partner",
                weeklyPrice: plan.weeklyPrice,
                monthlyPrice: plan.monthlyPrice || (isWeekly ? null : plan.weeklyPrice),
                quarterlyPrice: plan.quarterlyPrice || null,
                yearlyPrice: plan.yearlyPrice || null,
                features: parsedFeatures,
                mealTimings: parsedTimings,
            };
        });

        // Construct response with rating stats and active meal plans
        const responseData = {
            ...seller,
            foodItems: processedFoodItems,
            addons: seller.addons || [],
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
