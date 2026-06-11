import { getPendingApprovals, updateApprovalStatus } from "@/controllers/superadminApprovalController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET() {
    try {
        const data = await getPendingApprovals();
        return successResponse(data);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Error fetching approvals:", error);
        return errorResponse("An error occurred", 500);
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { type, id, action, adminNote } = body;

        // Wrap req logic since the controller expects request with body but we already parsed it.
        // Actually it's easier to just pass the raw request and let the controller parse it.
        return errorResponse("Use /[type]/[id] route instead", 400);
    } catch (error: any) {
        return errorResponse("An error occurred", 500);
    }
}
