import { getSellerNotificationCount } from "@/controllers/sellerNotificationController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
    try {
        const data = await getSellerNotificationCount();
        const res = successResponse(data);
        res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.headers.set("Pragma", "no-cache");
        res.headers.set("Expires", "0");
        return res;
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Error fetching notification count:", error);
        return errorResponse("An error occurred fetching notification count", 500);
    }
}
