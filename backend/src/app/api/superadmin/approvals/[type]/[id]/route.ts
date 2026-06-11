import { updateApprovalStatus } from "@/controllers/superadminApprovalController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function PUT(req: Request, { params }: { params: Promise<{ type: string; id: string }> }) {
    try {
        const resolvedParams = await params;
        const data = await updateApprovalStatus(req, resolvedParams.type, resolvedParams.id);
        return successResponse(data, "Approval status updated");
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Error updating approval:", error);
        return errorResponse("An error occurred", 500);
    }
}
