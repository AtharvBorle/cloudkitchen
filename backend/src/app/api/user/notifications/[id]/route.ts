import { markUserNotificationRead, dismissUserNotification } from "@/controllers/userNotificationController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
    return new NextResponse(null, { status: 204 });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        let isRead = true;
        try {
            const body = await req.json();
            if (typeof body?.isRead === "boolean") {
                isRead = body.isRead;
            }
        } catch {}

        const data = await markUserNotificationRead(id, isRead);
        return successResponse(data, data.message, 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        return errorResponse(error.message || "Failed to update notification status", 500);
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const data = await dismissUserNotification(id);
        return successResponse(data, data.message, 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        return errorResponse(error.message || "Failed to dismiss notification", 500);
    }
}
