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

        const activeSellers = await db.sellerProfile.findMany({
            where: { verificationStatus: "APPROVED" },
            select: { id: true, businessName: true },
            orderBy: { businessName: "asc" }
        });

        return successResponse(activeSellers);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Fetch banners active sellers error:", error);
        return errorResponse("Internal server error", 500);
    }
}
