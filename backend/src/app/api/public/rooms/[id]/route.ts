import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { parseRoomDescription } from "@/controllers/sellerRoomController";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        if (!id) {
            return errorResponse("Room ID is required", 400);
        }

        const room = await db.room.findUnique({
            where: { id },
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
                                comment: true,
                                createdAt: true,
                                user: {
                                    select: {
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!room) {
            return errorResponse("Room not found", 404);
        }

        const reviewList = room.seller?.reviews || [];
        const reviewCount = reviewList.length;
        const avgRating = reviewCount > 0
            ? Number((reviewList.reduce((acc, r) => acc + r.rating, 0) / reviewCount).toFixed(1))
            : 0;

        let parsedImages: string[] = [];
        try {
            parsedImages = typeof room.images === "string" ? JSON.parse(room.images) : room.images;
            if (!Array.isArray(parsedImages)) parsedImages = [room.images];
        } catch {
            parsedImages = typeof room.images === "string" && room.images.startsWith("http") ? [room.images] : [];
        }

        const { about, amenities, houseRules, floor } = parseRoomDescription(room.description);

        const formattedRoom = {
            id: room.id,
            title: room.title,
            price: room.price,
            description: about || "",
            about: about || "",
            floor: floor || "",
            amenities: amenities || [],
            houseRules: houseRules || [],
            capacity: room.capacity,
            images: parsedImages,
            isAvailable: room.isAvailable,
            sellerId: room.sellerId,
            sellerName: room.seller?.businessName || room.seller?.user?.name || "Host",
            sellerLocality: room.seller?.addressLocality || "",
            sellerCity: room.seller?.user?.city || "",
            sellerPincode: room.seller?.user?.pincode || "",
            sellerLandmark: room.seller?.addressLandmark || "",
            sellerTrackingId: room.seller?.trackingId,
            sellerIsOnline: room.seller?.isOnline !== false,
            rating: avgRating,
            reviewCount,
            reviews: reviewList.map((r, idx) => ({
                id: String(idx + 1),
                name: r.user?.name || "Verified Resident",
                avatarLetter: (r.user?.name || "V")[0].toUpperCase(),
                date: r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "",
                rating: r.rating,
                comment: r.comment || "",
            }))
        };

        return successResponse(formattedRoom, "Room details fetched successfully");
    } catch (error: any) {
        console.error("Fetch single room error:", error);
        return errorResponse("Failed to fetch room details", 500);
    }
}
