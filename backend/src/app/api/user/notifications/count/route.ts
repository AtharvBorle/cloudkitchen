import { getUserNotifications } from "@/controllers/userNotificationController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
    return new NextResponse(null, { status: 204 });
}

export async function GET(req: Request) {
    try {
        const data = await getUserNotifications(req);
        return successResponse(
            {
                unreadCount: data.unreadCount,
                totalCount: data.totalCount,
                countsByCategory: data.countsByCategory,
            },
            "Customer unread notification count fetched successfully",
            200
        );
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        return errorResponse(error.message || "Failed to fetch notification count", 500);
    }
}
