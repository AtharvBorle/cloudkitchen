import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";
import { createCoupon, updateCoupon, deleteCoupon } from "@/controllers/couponController";

export async function GET() {
    try {
        const session = await getAuthSession();
        if (!session || !session.user || session.user.role !== "SELLER") {
            throw new ApiError("Unauthorized", 401);
        }

        const sellerProfile = await db.sellerProfile.findUnique({
            where: { userId: session.user.id },
            include: {
                foodItems: true,
                rooms: true
            }
        });

        if (!sellerProfile) {
            throw new ApiError("Profile not found", 404);
        }

        const coupons = await db.coupon.findMany({
            where: {
                appliesToSellerId: sellerProfile.id
            },
            orderBy: { createdAt: "desc" }
        });

        const products = [
            ...sellerProfile.foodItems.map(item => ({ id: item.id, name: item.name, type: 'FOOD' })),
            ...sellerProfile.rooms.map(room => ({ id: room.id, name: room.title, type: 'ROOM' }))
        ];

        return successResponse({
            sellerId: sellerProfile.id,
            products,
            coupons
        });
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Fetch seller offers error:", error);
        return errorResponse("Internal server error", 500);
    }
}

export async function POST(req: Request) {
    try {
        const data = await createCoupon(req);
        return successResponse(data, "Offer created successfully", 201);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Create seller offer error:", error);
        return errorResponse("Failed to create offer", 500);
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.clone().json();
        const id = body.id || body.couponId;
        if (!id) {
            throw new ApiError("Offer ID is required for update", 400);
        }
        const data = await updateCoupon(req, id);
        return successResponse(data, "Offer updated successfully", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Update seller offer error:", error);
        return errorResponse("Failed to update offer", 500);
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) {
            throw new ApiError("Offer ID is required for deletion", 400);
        }
        await deleteCoupon(id);
        return successResponse(null, "Offer deleted successfully", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Delete seller offer error:", error);
        return errorResponse("Failed to delete offer", 500);
    }
}
