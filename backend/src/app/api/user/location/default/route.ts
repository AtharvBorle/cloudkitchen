import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getPincodeCoordinates } from "@/lib/geo-distance";

export async function GET(req: Request) {
    try {
        const session = await getAuthSession();
        if (!session?.user?.id) {
            return errorResponse("Unauthorized", 401);
        }

        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { pincode: true, city: true }
        });

        const addresses = await db.address.findMany({
            where: { userId: session.user.id },
            select: {
                id: true,
                type: true,
                houseNumber: true,
                street: true,
                landmark: true,
                pincode: true,
                latitude: true,
                longitude: true,
                isDefault: true
            },
            orderBy: { createdAt: "desc" },
            take: 10
        });

        const activeDefaultAddress = addresses.find((a: any) => a.isDefault === true);
        
        // If there is an address explicitly marked as default, AND the user's active pincode matches it
        if (activeDefaultAddress && user && user.pincode === activeDefaultAddress.pincode) {
            return successResponse(activeDefaultAddress);
        }

        // If user has set a different active location (GPS / map / manual) or has no default address marked
        if (user && user.pincode) {
            const fallbackCoords = getPincodeCoordinates(user.pincode);
            const matchedAddr = addresses.find((a: any) => a.pincode === user.pincode && a.latitude && a.longitude);

            return successResponse({
                id: matchedAddr?.id || "virtual-gps",
                type: "Current Location",
                pincode: user.pincode,
                locality: fallbackCoords?.locality || "Current Location",
                city: user.city || fallbackCoords?.city || "Pune",
                latitude: matchedAddr?.latitude ?? fallbackCoords?.lat ?? null,
                longitude: matchedAddr?.longitude ?? fallbackCoords?.lng ?? null,
                isDefault: true
            });
        }

        // Fallback: If no GPS/user pincode is set but we have addresses, pick the first address and sync it
        if (addresses.length > 0) {
            const fallbackAddr = addresses[0];
            await db.$transaction([
                db.address.update({
                    where: { id: fallbackAddr.id },
                    data: { isDefault: true }
                }),
                db.user.update({
                    where: { id: session.user.id },
                    data: { pincode: fallbackAddr.pincode }
                })
            ]);
            fallbackAddr.isDefault = true;
            return successResponse(fallbackAddr);
        }

        return successResponse(null);
    } catch (error) {
        console.error("GET /api/user/location/default error:", error);
        return errorResponse("Internal Server Error", 500);
    }
}
