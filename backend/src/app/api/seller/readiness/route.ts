import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getAuthSession();
        if (!session?.user) {
            throw new ApiError("Please log in first to view readiness checklist.", 401);
        }
        if (session.user.role !== "SELLER") {
            throw new ApiError("Access denied. Seller account required.", 403);
        }

        const sellerProfile = await db.sellerProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!sellerProfile) {
            throw new ApiError("Seller profile not found. Please complete registration.", 404);
        }

        const deliveryPersonsCount = await db.deliveryPerson.count({
            where: { sellerId: sellerProfile.id }
        });
        const foodItemsCount = await db.foodItem.count({
            where: { sellerId: sellerProfile.id }
        });

        const hasCardImage = Boolean(sellerProfile.cardImageUrl && sellerProfile.cardImageUrl.trim() !== "");
        const hasBannerImage = Boolean(sellerProfile.bannerImageUrl && sellerProfile.bannerImageUrl.trim() !== "");
        const hasDeliveryRadius = Boolean(sellerProfile.deliveryRadiusReviewed);
        const hasOperatingHours = Boolean(sellerProfile.operatingHoursReviewed);
        const hasUpi = Boolean(sellerProfile.upiId && sellerProfile.upiId.trim().includes("@"));
        const hasDeliveryPerson = deliveryPersonsCount > 0;
        const hasMenuItems = foodItemsCount > 0;

        const checklist = [
            { id: "card_photo", step: 1, title: "Kitchen card grid photo upload", isCompleted: hasCardImage, value: sellerProfile.cardImageUrl || null },
            { id: "cover_image", step: 2, title: "Storefront cover image upload", isCompleted: hasBannerImage, value: sellerProfile.bannerImageUrl || null },
            { id: "delivery_radius", step: 3, title: "Review delivery radius", isCompleted: hasDeliveryRadius, value: sellerProfile.deliveryRadiusKm ?? 5.0 },
            { id: "operating_hours", step: 4, title: "Review operating hrs", isCompleted: hasOperatingHours, value: sellerProfile.operatingHours || "[]" },
            { id: "upi_payment", step: 5, title: "Add upi to get payments", isCompleted: hasUpi, value: sellerProfile.upiId || null },
            { id: "delivery_person", step: 6, title: "Add delivery person", isCompleted: hasDeliveryPerson, count: deliveryPersonsCount },
            { id: "menu_items", step: 7, title: "Add Items in menue", isCompleted: hasMenuItems, count: foodItemsCount },
        ];

        const completedCount = checklist.filter((c) => c.isCompleted).length;
        const isReadinessCompleted = completedCount === 7 || Boolean(sellerProfile.isReadinessCompleted);

        if (completedCount === 7 && !sellerProfile.isReadinessCompleted) {
            await db.sellerProfile.update({
                where: { id: sellerProfile.id },
                data: { isReadinessCompleted: true }
            });
        }

        return successResponse({
            isReadinessCompleted,
            completedCount,
            totalCount: 7,
            checklist,
            sellerProfile: {
                id: sellerProfile.id,
                businessName: sellerProfile.businessName,
                trackingId: sellerProfile.trackingId,
                cardImageUrl: sellerProfile.cardImageUrl,
                bannerImageUrl: sellerProfile.bannerImageUrl,
                deliveryRadiusKm: sellerProfile.deliveryRadiusKm,
                deliveryRadiusReviewed: sellerProfile.deliveryRadiusReviewed,
                operatingHours: sellerProfile.operatingHours,
                operatingHoursReviewed: sellerProfile.operatingHoursReviewed,
                upiId: sellerProfile.upiId,
                deliveryPersonsCount,
                foodItemsCount,
                isReadinessCompleted
            }
        });
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Seller readiness fetch error:", error);
        return errorResponse("Internal server error", 500);
    }
}

export async function POST(req: Request) {
    try {
        const session = await getAuthSession();
        if (!session?.user) {
            throw new ApiError("Please log in first to update readiness.", 401);
        }
        if (session.user.role !== "SELLER") {
            throw new ApiError("Access denied. Seller account required.", 403);
        }

        const sellerProfile = await db.sellerProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!sellerProfile) {
            throw new ApiError("Seller profile not found.", 404);
        }

        const body = await req.json();
        const updateData: any = {};

        if (body.step === "delivery_radius" || body.deliveryRadiusKm !== undefined) {
            const rawRadius = parseFloat(String(body.deliveryRadiusKm));
            if (!isNaN(rawRadius)) {
                updateData.deliveryRadiusKm = Math.min(15, Math.max(1, rawRadius));
            }
            updateData.deliveryRadiusReviewed = true;
        }

        if (body.step === "operating_hours" || body.operatingHours !== undefined) {
            updateData.operatingHours = typeof body.operatingHours === "string" ? body.operatingHours : JSON.stringify(body.operatingHours);
            updateData.operatingHoursReviewed = true;
        }

        if (body.step === "upi_payment" || body.upiId !== undefined) {
            const cleanUpi = String(body.upiId || "").trim();
            if (!cleanUpi || !cleanUpi.includes("@")) {
                throw new ApiError("Please enter a valid UPI ID (e.g. yourname@okhdfcbank)", 400);
            }
            updateData.upiId = cleanUpi;
        }

        if (body.isReadinessCompleted !== undefined) {
            updateData.isReadinessCompleted = Boolean(body.isReadinessCompleted);
        }

        const updated = await db.sellerProfile.update({
            where: { id: sellerProfile.id },
            data: updateData
        });

        const deliveryPersonsCount = await db.deliveryPerson.count({
            where: { sellerId: updated.id }
        });
        const foodItemsCount = await db.foodItem.count({
            where: { sellerId: updated.id }
        });

        const hasCardImage = Boolean(updated.cardImageUrl && updated.cardImageUrl.trim() !== "");
        const hasBannerImage = Boolean(updated.bannerImageUrl && updated.bannerImageUrl.trim() !== "");
        const hasDeliveryRadius = Boolean(updated.deliveryRadiusReviewed);
        const hasOperatingHours = Boolean(updated.operatingHoursReviewed);
        const hasUpi = Boolean(updated.upiId && updated.upiId.trim().includes("@"));
        const hasDeliveryPerson = deliveryPersonsCount > 0;
        const hasMenuItems = foodItemsCount > 0;

        const checklist = [
            { id: "card_photo", step: 1, title: "Kitchen card grid photo upload", isCompleted: hasCardImage, value: updated.cardImageUrl || null },
            { id: "cover_image", step: 2, title: "Storefront cover image upload", isCompleted: hasBannerImage, value: updated.bannerImageUrl || null },
            { id: "delivery_radius", step: 3, title: "Review delivery radius", isCompleted: hasDeliveryRadius, value: updated.deliveryRadiusKm ?? 5.0 },
            { id: "operating_hours", step: 4, title: "Review operating hrs", isCompleted: hasOperatingHours, value: updated.operatingHours || "[]" },
            { id: "upi_payment", step: 5, title: "Add upi to get payments", isCompleted: hasUpi, value: updated.upiId || null },
            { id: "delivery_person", step: 6, title: "Add delivery person", isCompleted: hasDeliveryPerson, count: deliveryPersonsCount },
            { id: "menu_items", step: 7, title: "Add Items in menue", isCompleted: hasMenuItems, count: foodItemsCount },
        ];

        const completedCount = checklist.filter((c) => c.isCompleted).length;
        const isReadinessCompleted = completedCount === 7 || Boolean(updated.isReadinessCompleted);

        if (completedCount === 7 && !updated.isReadinessCompleted) {
            await db.sellerProfile.update({
                where: { id: updated.id },
                data: { isReadinessCompleted: true }
            });
        }

        return successResponse({
            isReadinessCompleted,
            completedCount,
            totalCount: 7,
            checklist,
            sellerProfile: {
                id: updated.id,
                businessName: updated.businessName,
                trackingId: updated.trackingId,
                cardImageUrl: updated.cardImageUrl,
                bannerImageUrl: updated.bannerImageUrl,
                deliveryRadiusKm: updated.deliveryRadiusKm,
                deliveryRadiusReviewed: updated.deliveryRadiusReviewed,
                operatingHours: updated.operatingHours,
                operatingHoursReviewed: updated.operatingHoursReviewed,
                upiId: updated.upiId,
                deliveryPersonsCount,
                foodItemsCount,
                isReadinessCompleted
            }
        }, "Readiness status updated successfully");
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Seller readiness update error:", error);
        return errorResponse("Internal server error", 500);
    }
}
