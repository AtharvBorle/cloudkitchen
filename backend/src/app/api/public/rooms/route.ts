import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const location = searchParams.get("location") || "";
        const query = searchParams.get("query") || "";

        const rooms = await db.room.findMany({
            where: {
                isAvailable: true,
                ...(query ? {
                    OR: [
                        { title: { contains: query, mode: "insensitive" } },
                        { description: { contains: query, mode: "insensitive" } },
                    ]
                } : {})
            },
            include: {
                seller: {
                    select: {
                        id: true,
                        businessName: true,
                        addressLocality: true,
                        addressCity: true,
                        isOnline: true,
                        rating: true,
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return successResponse(rooms, "Rooms fetched successfully");
    } catch (error: any) {
        console.error("Fetch public rooms error:", error);
        return errorResponse("Failed to fetch available rooms", 500);
    }
}
