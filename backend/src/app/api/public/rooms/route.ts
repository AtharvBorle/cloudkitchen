import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const location = searchParams.get("location") || "";
        const query = searchParams.get("query") || "";
        const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
        const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
        const capacity = searchParams.get("capacity") ? Number(searchParams.get("capacity")) : undefined;

        const whereClause: any = {
            isAvailable: true,
        };

        const orConditions: any[] = [];

        if (query.trim()) {
            orConditions.push(
                { title: { contains: query.trim(), mode: "insensitive" } },
                { description: { contains: query.trim(), mode: "insensitive" } },
                { seller: { businessName: { contains: query.trim(), mode: "insensitive" } } },
                { seller: { addressLocality: { contains: query.trim(), mode: "insensitive" } } },
                { seller: { user: { city: { contains: query.trim(), mode: "insensitive" } } } }
            );
        }

        if (
            location.trim() &&
            location.toLowerCase() !== "all" &&
            location.toLowerCase() !== "all locations" &&
            location.toLowerCase() !== "all pune"
        ) {
            orConditions.push(
                { seller: { addressLocality: { contains: location.trim(), mode: "insensitive" } } },
                { seller: { addressLandmark: { contains: location.trim(), mode: "insensitive" } } },
                { seller: { user: { city: { contains: location.trim(), mode: "insensitive" } } } },
                { seller: { user: { pincode: { contains: location.trim(), mode: "insensitive" } } } }
            );
        }

        if (orConditions.length > 0) {
            whereClause.OR = orConditions;
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            whereClause.price = {};
            if (minPrice !== undefined && !isNaN(minPrice)) whereClause.price.gte = minPrice;
            if (maxPrice !== undefined && !isNaN(maxPrice)) whereClause.price.lte = maxPrice;
        }

        if (capacity !== undefined && !isNaN(capacity)) {
            if (capacity >= 3) {
                whereClause.capacity = { gte: 3 };
            } else {
                whereClause.capacity = capacity;
            }
        }

        const rooms = await db.room.findMany({
            where: whereClause,
            include: {
                seller: {
                    select: {
                        id: true,
                        businessName: true,
                        addressFlat: true,
                        addressLocality: true,
                        addressLandmark: true,
                        trackingId: true,
                        isOnline: true,
                        user: {
                            select: {
                                name: true,
                                city: true,
                                pincode: true,
                                phone: true,
                            }
                        },
                        reviews: {
                            select: {
                                rating: true,
                            }
                        }
                    }
                }
            },
            orderBy: { id: "desc" }
        });

        // Format and compute rating and city fields
        const formattedRooms = rooms.map(room => {
            const reviewCount = room.seller?.reviews?.length || 0;
            const avgRating = reviewCount > 0
                ? Number((room.seller.reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount).toFixed(1))
                : 4.8;

            let parsedImages: string[] = [];
            try {
                parsedImages = typeof room.images === "string" ? JSON.parse(room.images) : room.images;
                if (!Array.isArray(parsedImages)) parsedImages = [room.images];
            } catch {
                parsedImages = typeof room.images === "string" && room.images.startsWith("http") ? [room.images] : [];
            }

            return {
                id: room.id,
                title: room.title,
                price: room.price,
                description: room.description,
                capacity: room.capacity,
                images: parsedImages,
                isAvailable: room.isAvailable,
                sellerId: room.sellerId,
                sellerName: room.seller?.businessName || room.seller?.user?.name || "Verified Host",
                sellerLocality: room.seller?.addressLocality || "Kothrud",
                sellerCity: room.seller?.user?.city || "Pune",
                sellerPincode: room.seller?.user?.pincode || "411038",
                sellerLandmark: room.seller?.addressLandmark || "",
                sellerTrackingId: room.seller?.trackingId,
                sellerIsOnline: room.seller?.isOnline !== false,
                rating: avgRating,
                reviewCount,
            };
        });

        return successResponse(formattedRooms, "Rooms fetched successfully");
    } catch (error: any) {
        console.error("Fetch public rooms error:", error);
        return errorResponse("Failed to fetch available rooms", 500);
    }
}
