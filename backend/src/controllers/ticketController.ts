import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";

export const createTicket = async (req: Request) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to create a support ticket.", 401);
    }

    const { title, description, category, userId } = await req.json();
    if (!title || !description || !category) {
        throw new ApiError("Missing required fields", 400);
    }

    const isSuperAdmin = session.user.role === "SUPERADMIN" || session.user.role === "ADMIN" || session.user.role === "SUPPORT";
    const ticketUserId = (isSuperAdmin && userId) ? userId : session.user.id;

    const ticket = await db.ticket.create({
        data: {
            userId: ticketUserId,
            title,
            description,
            category,
            status: "OPEN"
        }
    });

    // Create initial message
    await db.ticketMessage.create({
        data: {
            ticketId: ticket.id,
            senderId: session.user.id,
            message: description
        }
    });

    return ticket;
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
                    role: true
                }
            }
        },
        orderBy: {
            updatedAt: "desc"
        }
    });

    return tickets;
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
                    role: true
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

    return ticket;
};

export const updateTicketStatus = async (id: string, req: Request) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to update ticket status.", 401);
    }

    const { status } = await req.json();
    if (!status || !["OPEN", "IN_PROGRESS", "CLOSED", "RESOLVED"].includes(status)) {
        throw new ApiError("Invalid status value", 400);
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

    if (!isAdmin && status !== "RESOLVED" && status !== "OPEN") {
        throw new ApiError("Forbidden status change for ticket owner", 403);
    }

    const updatedTicket = await db.ticket.update({
        where: { id },
        data: { status }
    });

    return updatedTicket;
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
