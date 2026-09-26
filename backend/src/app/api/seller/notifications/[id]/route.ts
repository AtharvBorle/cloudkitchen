import { getAuthenticatedSeller } from "@/controllers/sellerNotificationController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export async function PATCH(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await getAuthenticatedSeller();
        const { id } = await params;

        return successResponse({
            success: true,
            message: `Notification ${id} marked as read`,
            notificationId: id,
            isRead: true
        });
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Error marking notification read:", error);
        return errorResponse("An error occurred updating notification", 500);
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await getAuthenticatedSeller();
        const { id } = await params;

        return successResponse({
            success: true,
            message: `Notification ${id} dismissed`,
            notificationId: id,
            dismissed: true
        });
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Error dismissing notification:", error);
        return errorResponse("An error occurred dismissing notification", 500);
    }
}
