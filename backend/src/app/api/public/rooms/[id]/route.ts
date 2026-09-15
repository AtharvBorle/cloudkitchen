import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";

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

        const formattedRoom = {
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
            reviews: room.seller?.reviews?.map((r, idx) => ({
                id: String(idx + 1),
                name: r.user?.name || "Resident",
                avatarLetter: (r.user?.name || "R")[0].toUpperCase(),
                date: r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "Recent",
                rating: r.rating,
                comment: r.comment || "Clean, comfortable and well maintained space.",
            })) || []
        };

        return successResponse(formattedRoom, "Room details fetched successfully");
    } catch (error: any) {
        console.error("Fetch single room error:", error);
        return errorResponse("Failed to fetch room details", 500);
    }
}
