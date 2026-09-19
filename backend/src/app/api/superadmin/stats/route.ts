import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET() {
    try {
        const session = await getAuthSession();
        if (!session || session.user.role !== "SUPERADMIN") {
            throw new ApiError("Unauthorized", 401);
        }

        const totalAgents = await db.user.count({ where: { role: "AGENT" } });
        const activeSellers = await db.user.count({ where: { role: "SELLER", isActive: true } });
        const totalSubscriptions = await db.subscription.count();

        return successResponse({
            totalAgents,
            activeSellers,
            totalSubscriptions
        });
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Superadmin stats error:", error);
        return errorResponse("Internal server error", 500);
    }
}
