import { getSellerNotificationPreferences, updateSellerNotificationPreferences } from "@/controllers/sellerNotificationController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
    try {
        const data = await getSellerNotificationPreferences();
        return successResponse(data);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Error fetching notification preferences:", error);
        return errorResponse("An error occurred fetching notification preferences", 500);
    }
}

export async function PUT(req: Request) {
    try {
        const data = await updateSellerNotificationPreferences(req);
        return successResponse(data);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Error updating notification preferences:", error);
        return errorResponse("An error occurred updating notification preferences", 500);
    }
}

export async function POST(req: Request) {
    try {
        const data = await updateSellerNotificationPreferences(req);
        return successResponse(data);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Error updating notification preferences:", error);
        return errorResponse("An error occurred updating notification preferences", 500);
    }
}
