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

        const defaultAddr = addresses.find((a: any) => a.isDefault === true) || addresses[0];
        
        if (defaultAddr) {
            return successResponse(defaultAddr);
        }

        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { pincode: true }
        });

        if (user && user.pincode) {
            return successResponse({
                id: "virtual-gps",
                type: "Current Area",
                pincode: user.pincode,
                isDefault: true
            });
        }

        return successResponse(null);
    } catch (error) {
        console.error("GET /api/user/location/default error:", error);
        return errorResponse("Internal Server Error", 500);
    }
}
