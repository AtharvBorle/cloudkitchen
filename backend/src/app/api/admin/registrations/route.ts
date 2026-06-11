import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET() {
    try {
        const session = await getAuthSession();
        if (!session || !session.user || (session.user.role !== "AGENT" && session.user.role !== "SUPERADMIN")) {
            throw new ApiError("Unauthorized", 401);
        }

        const pendingProfiles = await db.sellerProfile.findMany({
            where: { verificationStatus: { in: ["PENDING", "REVISION"] } },
            include: { user: true },
            orderBy: {
                user: { createdAt: "desc" }
            }
        });

        const applications = pendingProfiles.map(profile => ({
            id: profile.id,
            businessName: profile.businessName || profile.user.name,
            type: profile.type,
            ownerName: profile.user.name,
            email: profile.user.email,
            phone: profile.user.phone,
            kitchenAddress: `${profile.addressFlat || ""}, ${profile.addressLocality || ""}${profile.addressLandmark ? `, ${profile.addressLandmark}` : ""}`,
            adhaarUrl: profile.adhaarUrl,
            fssaiUrl: profile.fssaiUrl,
            kitchenImages: (profile as any).kitchenImages ? JSON.parse((profile as any).kitchenImages) : [],
            cuisineImages: (profile as any).cuisineImages ? JSON.parse((profile as any).cuisineImages) : [],
            createdAt: profile.user.createdAt.toISOString(),
            verificationStatus: profile.verificationStatus,
        }));

        return successResponse(applications);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Fetch pending registrations error:", error);
        return errorResponse("Internal server error", 500);
    }
}
