import { getSellerSessions, syncSellerSession, deleteSellerSessions } from "@/controllers/sellerSessionController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET(req: Request) {
    try {
        const data = await getSellerSessions(req);
        return successResponse(data);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Fetch sessions error:", error);
        return errorResponse("An error occurred while fetching login sessions", 500);
    }
}

export async function POST(req: Request) {
    try {
        const data = await syncSellerSession(req);
        return successResponse(data, "Session synced successfully", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Sync session error:", error);
        return errorResponse("An error occurred while syncing session", 500);
    }
}

export async function DELETE(req: Request) {
    try {
        const data = await deleteSellerSessions(req);
        return successResponse(data, data.message || "Session logged out", 200);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Delete session error:", error);
        return errorResponse("An error occurred while terminating session", 500);
    }
}
