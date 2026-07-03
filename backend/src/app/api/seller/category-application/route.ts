import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const session = await getAuthSession();
        if (!session || !session.user || session.user.role !== "SELLER") {
            throw new ApiError("Unauthorized", 401);
        }

        const body = await req.json();
        const { category } = body;

        if (category !== "FOOD" && category !== "PROPERTY") {
            throw new ApiError("Invalid category type. Must be FOOD or PROPERTY", 400);
        }

        const sellerProfile = await db.sellerProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!sellerProfile) {
            throw new ApiError("Seller profile not found", 404);
        }

        const updateData: any = {};
        if (category === "FOOD") {
            if (sellerProfile.foodVerificationStatus === "APPROVED") {
                throw new ApiError("Food category is already approved", 400);
            }
            updateData.foodVerificationStatus = "PENDING";
        } else if (category === "PROPERTY") {
            if (sellerProfile.propertyVerificationStatus === "APPROVED") {
                throw new ApiError("Property category is already approved", 400);
            }
            updateData.propertyVerificationStatus = "PENDING";
        }

        const updatedProfile = await db.sellerProfile.update({
            where: { id: sellerProfile.id },
            data: updateData
        });

        return successResponse(updatedProfile, "Category application submitted successfully");
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Category application error:", error);
        return errorResponse("Internal server error", 500);
    }
}
