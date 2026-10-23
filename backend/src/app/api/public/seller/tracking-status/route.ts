import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const rawParam = searchParams.get("trackingId") || "";
        const trackingId = decodeURIComponent(rawParam).trim();

        if (!trackingId) {
            return errorResponse("Tracking ID is required", 400);
        }

        const seller = await db.sellerProfile.findFirst({
            where: {
                OR: [
                    { trackingId: { equals: trackingId, mode: "insensitive" } },
                    { id: trackingId },
                ],
            },
            select: {
                id: true,
                trackingId: true,
                businessName: true,
                verificationStatus: true,
                verificationNote: true,
                businessCategory: true,
                foodVerificationStatus: true,
                propertyVerificationStatus: true,
                user: {
                    select: {
                        createdAt: true,
                    },
                },
            },
        });

        if (!seller) {
            return errorResponse("No application found with the provided Tracking ID", 404);
        }

        return successResponse(
            {
                trackingId: seller.trackingId,
                businessName: seller.businessName,
                verificationStatus: seller.verificationStatus,
                verificationNote: seller.verificationNote,
                businessCategory: seller.businessCategory,
                foodVerificationStatus: seller.foodVerificationStatus,
                propertyVerificationStatus: seller.propertyVerificationStatus,
                createdAt: seller.user?.createdAt || null,
            },
            "Application status retrieved successfully"
        );
    } catch (error: any) {
        console.error("Error fetching seller tracking status:", error);
        return errorResponse("Failed to fetch application status", 500);
    }
}
