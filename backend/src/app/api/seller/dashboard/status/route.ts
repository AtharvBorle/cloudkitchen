import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";
import { getCategoryExpiries } from "@/lib/subscription";
import { validateUpiId } from "@/lib/upi-validation";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getAuthSession();
        if (!session?.user) {
            throw new ApiError("Please log in first to view dashboard status.", 401);
        }
        if (session.user.role !== "SELLER") {
            throw new ApiError("Access denied. Seller account required.", 403);
        }

        let sellerProfile = await db.sellerProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!sellerProfile) {
            throw new ApiError("Seller profile could not be found. Please complete your registration.", 404);
        }

        // Auto-heal / sync category verification statuses if seller application is APPROVED
        if (sellerProfile.verificationStatus === "APPROVED") {
            const needsFoodSync =
                (sellerProfile.businessCategory === "FOOD" || sellerProfile.businessCategory === "BOTH") &&
                sellerProfile.foodVerificationStatus !== "APPROVED";
            const needsPropertySync =
                (sellerProfile.businessCategory === "PROPERTY" || sellerProfile.businessCategory === "BOTH") &&
                sellerProfile.propertyVerificationStatus !== "APPROVED";

            if (needsFoodSync || needsPropertySync) {
                const updateData: any = {};
                if (needsFoodSync) updateData.foodVerificationStatus = "APPROVED";
                if (needsPropertySync) updateData.propertyVerificationStatus = "APPROVED";

                sellerProfile = await db.sellerProfile.update({
                    where: { id: sellerProfile.id },
                    data: updateData
                });
            }
        }

        const activeSubs = await db.subscription.findMany({
            where: {
                sellerId: sellerProfile.id,
                status: "ACTIVE",
                validUntil: {
                    gt: new Date()
                }
            },
            include: {
                plan: true
            },
            orderBy: {
                createdAt: "asc"
            }
        });

        const roomSetting = await db.systemSettings.findUnique({
            where: { key: "ENABLE_ROOM_MODULE" }
        });
        const isRoomEnabled = roomSetting?.value === "true";

        const isFoodCategoryApproved =
            sellerProfile.verificationStatus === "APPROVED" &&
            (sellerProfile.businessCategory === "FOOD" ||
                sellerProfile.businessCategory === "BOTH" ||
                sellerProfile.foodVerificationStatus === "APPROVED");

        const isPropertyCategoryApproved =
            isRoomEnabled &&
            sellerProfile.verificationStatus === "APPROVED" &&
            (sellerProfile.businessCategory === "PROPERTY" ||
                sellerProfile.businessCategory === "BOTH" ||
                sellerProfile.propertyVerificationStatus === "APPROVED");

        const { foodExpiry, propertyExpiry } = getCategoryExpiries(activeSubs);
        const isFoodActive = (foodExpiry ? foodExpiry > new Date() : false) && isFoodCategoryApproved;
        const isPropertyActive = isRoomEnabled && (propertyExpiry ? propertyExpiry > new Date() : false) && isPropertyCategoryApproved;

        // Readiness to get started checklist calculations
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
        const hasUpi = Boolean(sellerProfile.upiId && validateUpiId(sellerProfile.upiId).isValid);
        const hasDeliveryPerson = deliveryPersonsCount > 0;
        const hasMenuItems = foodItemsCount > 0;

        const checklist = [
            { id: "card_photo", step: 1, title: "Kitchen card grid photo upload", isCompleted: hasCardImage, value: sellerProfile.cardImageUrl || null },
            { id: "cover_image", step: 2, title: "Storefront cover image upload", isCompleted: hasBannerImage, value: sellerProfile.bannerImageUrl || null },
            { id: "delivery_radius", step: 3, title: "Review delivery radius", isCompleted: hasDeliveryRadius, value: sellerProfile.deliveryRadiusKm ?? 5.0 },
            { id: "operating_hours", step: 4, title: "Review operating hrs", isCompleted: hasOperatingHours, value: sellerProfile.operatingHours || "[]" },
            { id: "upi_payment", step: 5, title: "Add upi to get payments", isCompleted: hasUpi, value: sellerProfile.upiId || null },
            { id: "delivery_person", step: 6, title: "Add delivery person", isCompleted: hasDeliveryPerson, count: deliveryPersonsCount },
            { id: "menu_items", step: 7, title: "Add Items in Menu", isCompleted: hasMenuItems, count: foodItemsCount },
        ];

        const completedCount = checklist.filter((c) => c.isCompleted).length;
        const isReadinessCompleted = completedCount === 7 || Boolean(sellerProfile.isReadinessCompleted);

        if (completedCount === 7 && !sellerProfile.isReadinessCompleted) {
            await db.sellerProfile.update({
                where: { id: sellerProfile.id },
                data: { isReadinessCompleted: true }
            });
            sellerProfile.isReadinessCompleted = true;
        }

        return successResponse({
            sellerProfile,
            hasActiveSub: activeSubs.length > 0,
            activeSubs,
            foodExpiry,
            propertyExpiry: isRoomEnabled ? propertyExpiry : null,
            isFoodActive,
            isPropertyActive,
            isRoomEnabled,
            isReadinessCompleted,
            readiness: {
                isCompleted: isReadinessCompleted,
                completedCount,
                totalCount: 7,
                checklist
            }
        });
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Dashboard status fetch error:", error);
        return errorResponse("Internal server error", 500);
    }
}
