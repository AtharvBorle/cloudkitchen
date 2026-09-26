import { getSellerNotifications, markSellerNotificationRead } from "@/controllers/sellerNotificationController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
    try {
        const data = await getSellerNotifications(req);
        const res = successResponse(data);
        res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.headers.set("Pragma", "no-cache");
        res.headers.set("Expires", "0");
        return res;
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Error fetching seller notifications:", error);
        return errorResponse("An error occurred fetching notifications", 500);
    }
}

export async function PATCH(req: Request) {
    try {
        const data = await markSellerNotificationRead(req);
        return successResponse(data);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Error updating seller notification status:", error);
        return errorResponse("An error occurred updating notification status", 500);
    }
}
