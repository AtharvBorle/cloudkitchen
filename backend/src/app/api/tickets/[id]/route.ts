import { getTicketDetails, updateTicketStatus } from "@/controllers/ticketController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const id = (await params).id;
        if (!id) return errorResponse("Ticket ID is required", 400);

        const ticket = await getTicketDetails(id);
        return successResponse(ticket);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Get ticket details error:", error);
        return errorResponse("Internal server error", 500);
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const id = (await params).id;
        if (!id) return errorResponse("Ticket ID is required", 400);

        const ticket = await updateTicketStatus(id, req);
        return successResponse(ticket, "Ticket status updated successfully");
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Update ticket status error:", error);
        return errorResponse("Internal server error", 500);
    }
}
