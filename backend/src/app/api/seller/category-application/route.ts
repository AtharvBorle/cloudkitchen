import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";
import { uploadImage } from "@/lib/upload";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const session = await getAuthSession();
        if (!session || !session.user || session.user.role !== "SELLER") {
            throw new ApiError("Unauthorized", 401);
        }

        const formData = await req.formData();
        const category = formData.get("category") as string;

        if (category !== "FOOD" && category !== "PROPERTY") {
            throw new ApiError("Invalid category type. Must be FOOD or PROPERTY", 400);
        }

        const sellerProfile = await db.sellerProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!sellerProfile) {
            throw new ApiError("Seller profile not found", 404);
        }

        const saveFile = async (file: File | null) => {
            if (!file || typeof file === "string" || file.size === 0) return null;
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            return await uploadImage(buffer, file.type, file.name, "sellers");
        };

        const updateData: any = {};

        if (category === "FOOD") {
            if (sellerProfile.foodVerificationStatus === "APPROVED") {
                throw new ApiError("Food category is already approved", 400);
            }

            const fssaiFile = formData.get("fssaiFile") as File | null;
            const kitchenFiles: File[] = [];
            for (let i = 0; i < 3; i++) {
                const kFile = formData.get(`kitchenImage_${i}`) as File | null;
                if (kFile) kitchenFiles.push(kFile);
            }
            const cuisineFiles: File[] = [];
            for (let i = 0; i < 3; i++) {
                const cFile = formData.get(`cuisineImage_${i}`) as File | null;
                if (cFile) cuisineFiles.push(cFile);
            }

            if (!fssaiFile && !sellerProfile.fssaiUrl) {
                throw new ApiError("FSSAI Certificate is required for Food verification", 400);
            }
            if (kitchenFiles.length === 0 && (!sellerProfile.kitchenImages || JSON.parse(sellerProfile.kitchenImages).length === 0)) {
                throw new ApiError("At least one Kitchen image is required for Food verification", 400);
            }
            if (cuisineFiles.length === 0 && (!sellerProfile.cuisineImages || JSON.parse(sellerProfile.cuisineImages).length === 0)) {
                throw new ApiError("At least one Cuisine image is required for Food verification", 400);
            }

            const [savedFssai, resolvedKitchen, resolvedCuisine] = await Promise.all([
                saveFile(fssaiFile),
                Promise.all(kitchenFiles.map(saveFile)),
                Promise.all(cuisineFiles.map(saveFile))
            ]);

            if (savedFssai) {
                updateData.fssaiUrl = savedFssai;
            }
            const newKitchenUrls = resolvedKitchen.filter(Boolean) as string[];
            if (newKitchenUrls.length > 0) {
                updateData.kitchenImages = JSON.stringify(newKitchenUrls);
            }
            const newCuisineUrls = resolvedCuisine.filter(Boolean) as string[];
            if (newCuisineUrls.length > 0) {
                updateData.cuisineImages = JSON.stringify(newCuisineUrls);
            }

            updateData.foodVerificationStatus = "PENDING";

        } else if (category === "PROPERTY") {
            if (sellerProfile.propertyVerificationStatus === "APPROVED") {
                throw new ApiError("Property category is already approved", 400);
            }

            const roomFiles: File[] = [];
            for (let i = 0; i < 3; i++) {
                const rFile = formData.get(`roomImage_${i}`) as File | null;
                if (rFile) roomFiles.push(rFile);
            }

            if (roomFiles.length === 0 && (!sellerProfile.roomImages || JSON.parse(sellerProfile.roomImages).length === 0)) {
                throw new ApiError("At least one Room photo is required for Property verification", 400);
            }

            const resolvedRooms = await Promise.all(roomFiles.map(saveFile));
            const newRoomUrls = resolvedRooms.filter(Boolean) as string[];
            if (newRoomUrls.length > 0) {
                updateData.roomImages = JSON.stringify(newRoomUrls);
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
