import { sendTicketMessage } from "@/controllers/ticketController";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/api-error";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const id = (await params).id;
        if (!id) return errorResponse("Ticket ID is required", 400);

        const message = await sendTicketMessage(id, req);
        return successResponse(message, "Message sent successfully", 201);
    } catch (error: any) {
        if (error instanceof ApiError) return errorResponse(error.message, error.statusCode);
        console.error("Send ticket message error:", error);
        return errorResponse(`Internal server error: ${error.message || error} ${error.stack || ""}`, 500);
    }
}
