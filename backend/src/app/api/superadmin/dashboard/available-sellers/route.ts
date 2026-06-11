import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET() {
    try {
        const session = await getAuthSession();
        if (!session || !session.user || (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN")) {
            throw new ApiError("Unauthorized", 401);
        }

        let availableSellers = [];
        if (session.user.role === "SUPERADMIN") {
            availableSellers = await db.sellerProfile.findMany({
                where: { isOnline: true, verificationStatus: "APPROVED" },
                select: { id: true, businessName: true, type: true }
            });
        } else {
            const agentProfile = await db.agentProfile.findUnique({
                where: { userId: session.user.id },
                include: { assignedSellers: true }
            });
            availableSellers = agentProfile?.assignedSellers.map(s => ({ id: s.id, businessName: s.businessName, type: s.type })) || [];
        }

        return successResponse(availableSellers);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Fetch available sellers error:", error);
        return errorResponse("Internal server error", 500);
    }
}
