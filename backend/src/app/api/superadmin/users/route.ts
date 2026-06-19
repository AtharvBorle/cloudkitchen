import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
    try {
        const session = await getAuthSession();
        if (!session?.user || session.user.role !== "SUPERADMIN") {
            throw new ApiError("Unauthorized", 401);
        }

        const users = await db.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            },
            orderBy: {
                name: "asc"
            }
        });

        return successResponse(users);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Get superadmin users list error:", error);
        return errorResponse(`Internal server error: ${error.message || error}`, 500);
    }
}
