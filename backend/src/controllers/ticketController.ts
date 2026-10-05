import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";

export function resolveTicketPriority(ticket: any): "High" | "Medium" | "Low" {
    if (!ticket) return "Medium";
    if (ticket.priority && typeof ticket.priority === "string") {
        const p = ticket.priority.toUpperCase();
        if (p === "HIGH" || p === "URGENT" || p === "CRITICAL") return "High";
        if (p === "LOW") return "Low";
        if (p === "MEDIUM") return "Medium";
    }

    const desc = ticket.description || "";
    const title = ticket.title || "";
    const category = ticket.category || "";

    // Check for explicit [Priority: High/Medium/Low]
    const tagMatch = desc.match(/\[Priority:\s*(High|Medium|Low)\]/i);
    if (tagMatch) {
        const val = tagMatch[1].toLowerCase();
        if (val === "high") return "High";
        if (val === "low") return "Low";
        return "Medium";
    }

    // Check messages history for priority changes
    if (Array.isArray(ticket.messages)) {
        for (let i = ticket.messages.length - 1; i >= 0; i--) {
            const msg = ticket.messages[i]?.message || "";
            const msgMatch = msg.match(/Priority\s+(?:is\s+|updated\s+to\s+|set\s+to\s+)?(High|Medium|Low)/i);
            if (msgMatch) {
                const val = msgMatch[1].toLowerCase();
                if (val === "high") return "High";
                if (val === "low") return "Low";
                return "Medium";
            }
        }
    }

    const allText = `${title} ${desc} ${category}`.toLowerCase();

    // High Priority heuristics: Cancellation, Out for Delivery, Delivery Delay, Refund, Critical, Urgent
    if (
        /\b(cancel|cancellation|request cancellation|out_for_delivery|out for delivery|not answering|delayed|delay|emergency|urgent|critical|refund|deduction|missing|wrong item|spoiled|contaminated)\b/i.test(allText)
    ) {
        return "High";
    }

    // Low Priority heuristics
    if (
        /\b(faq|general query|inquiry|feedback|suggestion|feature request|menu info|profile info)\b/i.test(allText)
    ) {
        return "Low";
    }

    return "Medium";
}

export const createTicket = async (req: Request) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to create a support ticket.", 401);
    }

    const { title, description, category, userId, priority } = await req.json();
    if (!title || !description || !category) {
        throw new ApiError("Missing required fields", 400);
    }

    const isSuperAdmin = session.user.role === "SUPERADMIN" || session.user.role === "ADMIN" || session.user.role === "SUPPORT";
    const ticketUserId = (isSuperAdmin && userId) ? userId : session.user.id;

    const normalizedPriority = priority
        ? (String(priority).toUpperCase() === "HIGH" ? "High" : String(priority).toUpperCase() === "LOW" ? "Low" : "Medium")
        : resolveTicketPriority({ title, description, category });

    const finalDescription = description.includes("[Priority:")
        ? description
        : `[Priority: ${normalizedPriority}]\n${description}`;

    const ticket = await db.ticket.create({
        data: {
            userId: ticketUserId,
            title,
            description: finalDescription,
            category,
            status: "OPEN"
        }
    });

    // Create initial message
    await db.ticketMessage.create({
        data: {
            ticketId: ticket.id,
            senderId: session.user.id,
            message: finalDescription
        }
    });

    return { ...ticket, priority: normalizedPriority };
};

export const listTickets = async () => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to view your support tickets.", 401);
    }

    const isSuperAdmin = session.user.role === "SUPERADMIN" || session.user.role === "ADMIN" || session.user.role === "SUPPORT";

    const tickets = await db.ticket.findMany({
        where: isSuperAdmin ? {} : { userId: session.user.id },
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                    role: true,
                    sellerProfile: {
                        select: {
                            id: true,
                            businessName: true,
                            type: true,
                            businessCategory: true
                        }
                    }
                }
            }
        },
        orderBy: {
            updatedAt: "desc"
        }
    });

    return tickets.map((t) => ({
        ...t,
        priority: resolveTicketPriority(t)
    }));
};

export const getTicketDetails = async (id: string) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to view ticket details.", 401);
    }

    const ticket = await db.ticket.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                    role: true,
                    sellerProfile: {
                        select: {
                            id: true,
                            businessName: true,
                            type: true,
                            businessCategory: true
                        }
                    }
                }
            },
            messages: {
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                            role: true
                        }
                    }
                },
                orderBy: {
                    createdAt: "asc"
                }
            }
        }
    });

    if (!ticket) {
        throw new ApiError("Ticket not found", 404);
    }

    const isSuperAdmin = session.user.role === "SUPERADMIN" || session.user.role === "ADMIN" || session.user.role === "SUPPORT";
    if (!isSuperAdmin && ticket.userId !== session.user.id) {
        throw new ApiError("Access denied. You do not have permission to view this ticket.", 403);
    }

    return {
        ...ticket,
        priority: resolveTicketPriority(ticket)
    };
};

export const updateTicketStatus = async (id: string, req: Request) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to update ticket status.", 401);
    }

    const body = await req.json();
    const { status, priority } = body;

    if (!status && !priority) {
        throw new ApiError("Missing status or priority value to update", 400);
    }

    const ticket = await db.ticket.findUnique({
        where: { id }
    });

    if (!ticket) {
        throw new ApiError("Ticket not found", 404);
    }

    const isAdmin = session.user.role === "SUPERADMIN" || session.user.role === "ADMIN" || session.user.role === "SUPPORT";
    const isOwner = ticket.userId === session.user.id;

    if (!isAdmin && !isOwner) {
        throw new ApiError("Access denied. You do not have permission to update this ticket.", 403);
    }

    const updateData: any = {};

    if (status) {
        if (!["OPEN", "IN_PROGRESS", "CLOSED", "RESOLVED"].includes(status)) {
            throw new ApiError("Invalid status value", 400);
        }
        if (!isAdmin && status !== "RESOLVED" && status !== "OPEN") {
            throw new ApiError("Forbidden status change for ticket owner", 403);
        }
        updateData.status = status;
    }

    let updatedPriority: "High" | "Medium" | "Low" | null = null;
    if (priority) {
        const normPri = String(priority).toUpperCase() === "HIGH" ? "High" : String(priority).toUpperCase() === "LOW" ? "Low" : "Medium";
        updatedPriority = normPri;
        
        let newDesc = ticket.description;
        if (/\[Priority:\s*(High|Medium|Low)\]/i.test(newDesc)) {
            newDesc = newDesc.replace(/\[Priority:\s*(High|Medium|Low)\]/i, `[Priority: ${normPri}]`);
        } else {
            newDesc = `[Priority: ${normPri}]\n${newDesc}`;
        }
        updateData.description = newDesc;

        await db.ticketMessage.create({
            data: {
                ticketId: id,
                senderId: session.user.id,
                message: `Priority updated to ${normPri}`
            }
        });
    }

    const updatedTicket = await db.ticket.update({
        where: { id },
        data: updateData
    });

    return {
        ...updatedTicket,
        priority: updatedPriority || resolveTicketPriority(updatedTicket)
    };
};

export const sendTicketMessage = async (id: string, req: Request) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to send a reply.", 401);
    }

    const ticket = await db.ticket.findUnique({ where: { id } });
    if (!ticket) {
        throw new ApiError("Ticket not found", 404);
    }

    if (ticket.status === "CLOSED") {
        throw new ApiError("Cannot reply to a closed ticket", 400);
    }

    const isSuperAdmin = session.user.role === "SUPERADMIN" || session.user.role === "ADMIN" || session.user.role === "SUPPORT";
    if (!isSuperAdmin && ticket.userId !== session.user.id) {
        throw new ApiError("Access denied. You do not have permission to reply to this ticket.", 403);
    }

    const { message } = await req.json();
    if (!message || !message.trim()) {
        throw new ApiError("Message cannot be empty", 400);
    }

    const ticketMessage = await db.ticketMessage.create({
        data: {
            ticketId: id,
            senderId: session.user.id,
            message: message.trim()
        },
        include: {
            sender: {
                select: {
                    id: true,
                    name: true,
                    role: true
                }
            }
        }
    });

    // Update ticket's updatedAt timestamp
    await db.ticket.update({
        where: { id },
        data: { updatedAt: new Date() }
    });

    return ticketMessage;
};
