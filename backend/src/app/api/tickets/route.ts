import { createTicket, listTickets } from "@/controllers/ticketController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function POST(req: Request) {
    try {
        const ticket = await createTicket(req);
        return successResponse(ticket, "Ticket raised successfully", 201);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Create ticket error:", error);
        return errorResponse("Internal server error", 500);
    }
}

export async function GET() {
    try {
        const tickets = await listTickets();
        return successResponse(tickets);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("List tickets error:", error);
        return errorResponse("Internal server error", 500);
    }
}
