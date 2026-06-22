import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: Request) {
    try {
        const session = await getAuthSession();
        if (!session?.user?.id) {
            return errorResponse("Unauthorized", 401);
        }

        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { pincode: true }
        });

        const addresses = await db.address.findMany({
            where: { userId: session.user.id },
            select: {
                id: true,
                type: true,
                pincode: true,
                isDefault: true
            },
            take: 5
        });

        const activeDefaultAddress = addresses.find((a: any) => a.isDefault === true);
        
        // If there is an address explicitly marked as default, AND the user's active pincode matches it
        if (activeDefaultAddress && user && user.pincode === activeDefaultAddress.pincode) {
            return successResponse(activeDefaultAddress);
        }

        // If user has set a different active location (GPS / map / manual) or has no default address marked
        if (user && user.pincode) {
            return successResponse({
                id: "virtual-gps",
                type: "Current Location",
                pincode: user.pincode,
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
