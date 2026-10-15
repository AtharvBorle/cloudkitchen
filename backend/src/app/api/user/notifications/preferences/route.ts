import { getUserNotificationPreferences, updateUserNotificationPreferences } from "@/controllers/userNotificationController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
    return new NextResponse(null, { status: 204 });
}

export async function GET() {
    try {
        const data = await getUserNotificationPreferences();
        return successResponse(data, "Customer notification preferences fetched successfully", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        return errorResponse(error.message || "Failed to fetch notification preferences", 500);
    }
}

export async function PUT(req: Request) {
    try {
        const data = await updateUserNotificationPreferences(req);
        return successResponse(data, data.message, 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        return errorResponse(error.message || "Failed to update notification preferences", 500);
    }
}
