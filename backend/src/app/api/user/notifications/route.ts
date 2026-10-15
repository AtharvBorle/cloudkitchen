import { getUserNotifications, markAllUserNotificationsRead, clearAllUserNotifications } from "@/controllers/userNotificationController";
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
        return successResponse(data, "Customer notifications fetched successfully", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        return errorResponse(error.message || "Failed to fetch customer notifications", 500);
    }
}

export async function PATCH() {
    try {
        const data = await markAllUserNotificationsRead();
        return successResponse(data, data.message, 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        return errorResponse(error.message || "Failed to mark notifications as read", 500);
    }
}

export async function DELETE() {
    try {
        const data = await clearAllUserNotifications();
        return successResponse(data, data.message, 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        return errorResponse(error.message || "Failed to clear notifications", 500);
    }
}
