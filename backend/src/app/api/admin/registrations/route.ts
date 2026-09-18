import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";
import { updateSellerRegistrationStatus } from "@/controllers/adminController";

export async function GET(req: Request) {
    try {
        const session = await getAuthSession();
        if (!session || !session.user || (session.user.role !== "AGENT" && session.user.role !== "SUPERADMIN")) {
            throw new ApiError("Unauthorized", 401);
        }

        const url = new URL(req.url);
        const view = url.searchParams.get("view"); // "pending" | "history" | "all"

        let whereClause: any = {};
        if (view === "pending") {
            whereClause = {
                OR: [
                    { verificationStatus: { in: ["PENDING", "REVISION"] } },
                    { foodVerificationStatus: { in: ["PENDING", "REVISION"] } },
                    { propertyVerificationStatus: { in: ["PENDING", "REVISION"] } }
                ]
            };
        } else if (view === "history") {
            whereClause = {
                verificationStatus: { notIn: ["PENDING"] }
            };
        }

        const profiles = await db.sellerProfile.findMany({
            where: whereClause,
            include: {
                user: true,
                agent: {
                    include: {
                        user: {
                            select: { name: true, email: true }
                        }
                    }
                }
            },
            orderBy: {
                user: { createdAt: "desc" }
            }
        });

        const safeParseArray = (val: any) => {
            if (!val) return [];
            if (Array.isArray(val)) return val;
            try {
                const parsed = JSON.parse(val);
                return Array.isArray(parsed) ? parsed : [parsed];
            } catch {
                return typeof val === 'string' && val.length > 0 ? [val] : [];
            }
        };

        const applications = profiles.map(profile => ({
            id: profile.id,
            businessName: profile.businessName || profile.user.name,
            trackingId: profile.trackingId,
            type: profile.type,
            businessCategory: profile.businessCategory,
            foodType: profile.foodType,
            ownerName: profile.user.name,
            email: profile.user.email,
            phone: profile.user.phone,
            kitchenAddress: `${profile.addressFlat || ""}, ${profile.addressLocality || ""}${profile.addressLandmark ? `, ${profile.addressLandmark}` : ""}`.trim().replace(/^,\s*/, ""),
            addressFlat: profile.addressFlat,
            addressLocality: profile.addressLocality,
            addressLandmark: profile.addressLandmark,
            adhaarUrl: profile.adhaarUrl,
            fssaiUrl: profile.fssaiUrl,
            lightBillUrl: profile.lightBillUrl,
            passbookUrl: profile.passbookUrl,
            kitchenImages: safeParseArray((profile as any).kitchenImages),
            cuisineImages: safeParseArray((profile as any).cuisineImages),
            roomImages: safeParseArray((profile as any).roomImages),
            createdAt: profile.user.createdAt.toISOString(),
            updatedAt: profile.user.updatedAt ? profile.user.updatedAt.toISOString() : profile.user.createdAt.toISOString(),
            verificationStatus: profile.verificationStatus,
            verificationNote: profile.verificationNote,
            foodVerificationStatus: profile.foodVerificationStatus,
            propertyVerificationStatus: profile.propertyVerificationStatus,
            agentName: profile.agent?.user?.name || null,
            isOnline: profile.isOnline,
            isActive: profile.user.isActive,
        }));

        return successResponse(applications);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Fetch registrations error:", error);
        return errorResponse("Internal server error", 500);
    }
}

export async function POST(req: Request) {
    try {
        const data = await updateSellerRegistrationStatus(req);
        return successResponse(data, "Status updated successfully");
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Update seller registration status error:", error);
        return errorResponse("An error occurred", 500);
    }
}
