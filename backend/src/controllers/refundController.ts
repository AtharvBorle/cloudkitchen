import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";

export const createRefundRequest = async (req: Request) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to submit a refund request.", 401);
    }

    const { orderId, bookingId, reason, amount } = await req.json();

    if (!reason || !amount || amount <= 0) {
        throw new ApiError("Please provide a reason and a valid refund amount.", 400);
    }

    if (!orderId && !bookingId) {
        throw new ApiError("Either an order ID or a booking ID must be specified.", 400);
    }

    // Check for existing refund request
    if (orderId) {
        const existing = await db.refund.findUnique({ where: { orderId } });
        if (existing) {
            throw new ApiError("A refund request already exists for this order.", 400);
        }

        const order = await db.order.findUnique({ where: { id: orderId } });
        if (!order) {
            throw new ApiError("The specified order could not be found.", 404);
        }

        // Must be paid to request refund
        if (!order.isPaid) {
            throw new ApiError("Refunds can only be requested for orders that have been paid.", 400);
        }
    }

    if (bookingId) {
        const existing = await db.refund.findUnique({ where: { bookingId } });
        if (existing) {
            throw new ApiError("A refund request already exists for this booking.", 400);
        }

        const booking = await db.booking.findUnique({ where: { id: bookingId } });
        if (!booking) {
            throw new ApiError("The specified booking could not be found.", 404);
        }
    }

    const refund = await db.refund.create({
        data: {
            userId: session.user.id,
            orderId: orderId || null,
            bookingId: bookingId || null,
            amount: parseFloat(amount),
            reason,
            status: "PENDING"
        }
    });

    return refund;
};

export const listRefunds = async () => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to view refund requests.", 401);
    }

    const isSuperAdmin = session.user.role === "SUPERADMIN" || session.user.role === "SUPPORT";

    const refunds = await db.refund.findMany({
        where: isSuperAdmin ? {} : { userId: session.user.id },
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                    role: true
                }
            },
            order: {
                include: {
                    seller: {
                        select: {
                            businessName: true
                        }
                    }
                }
            },
            booking: {
                include: {
                    room: {
                        select: {
                            title: true
                        }
                    }
                }
            }
        },
        orderBy: {
            createdAt: "desc"
        }
    });

    return refunds;
};

export const updateRefundStatus = async (req: Request, refundId: string) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to process refunds.", 401);
    }
    if (session.user.role !== "SUPERADMIN" && session.user.role !== "SUPPORT") {
        throw new ApiError("Access denied. Only Superadmin or Support Admin can fulfill refunds.", 403);
    }

    const { status, transactionId, adminNote } = await req.json();

    if (!["APPROVED", "REJECTED"].includes(status)) {
        throw new ApiError("Invalid refund status. Status must be either APPROVED or REJECTED.", 400);
    }

    const refund = await db.refund.findUnique({
        where: { id: refundId }
    });

    if (!refund) {
        throw new ApiError("The requested refund record could not be found.", 404);
    }

    if (refund.status !== "PENDING") {
        throw new ApiError("This refund request has already been processed.", 400);
    }

    const updatedRefund = await db.refund.update({
        where: { id: refundId },
        data: {
            status,
            transactionId: transactionId || null,
            adminNote: adminNote || null
        }
    });

    // If approved, update status of order/booking accordingly
    if (status === "APPROVED") {
        if (refund.orderId) {
            await db.order.update({
                where: { id: refund.orderId },
                data: { isPaid: false }
            }).catch(() => {});
        }
        if (refund.bookingId) {
            await db.booking.update({
                where: { id: refund.bookingId },
                data: { status: "CANCELLED" }
            }).catch(() => {});
        }
    }

    // NC-BUG-119: Send Notification to User & Resolve Support Ticket
    try {
        const ticketRefMatch = refund.reason?.match(/\[Ticket Ref: #?([a-fA-F0-9-]+)\]/);
        let targetTicketId = ticketRefMatch ? ticketRefMatch[1] : null;

        if (!targetTicketId) {
            const existingTicket = await db.ticket.findFirst({
                where: {
                    userId: refund.userId,
                    OR: [
                        { title: { contains: refund.orderId || refund.id } },
                        { description: { contains: refund.orderId || refund.id } },
                        { category: "REFUND" }
                    ]
                },
                orderBy: { createdAt: "desc" }
            });
            if (existingTicket) {
                targetTicketId = existingTicket.id;
            }
        }

        const entityName = refund.orderId
            ? `Order #${refund.orderId.slice(0, 8)}`
            : `Booking #${refund.bookingId ? refund.bookingId.slice(0, 8) : refund.id.slice(0, 8)}`;

        const notificationMessage = status === "APPROVED"
            ? `✅ Great news! Your refund request for ₹${refund.amount} on ${entityName} has been APPROVED and processed.\n\n` +
              `• Amount: ₹${refund.amount}\n` +
              `• Reference / Transaction ID: ${transactionId || "N/A"}\n` +
              `• Note: ${adminNote || "Refund initiated to your original payment method. Please allow 3-5 business days for settlement."}`
            : `❌ Your refund request for ₹${refund.amount} on ${entityName} has been reviewed and REJECTED.\n\n` +
              `• Reason / Admin Note: ${adminNote || "The request does not meet platform refund policy guidelines."}`;

        if (targetTicketId) {
            await db.ticketMessage.create({
                data: {
                    ticketId: targetTicketId,
                    senderId: session.user.id,
                    message: notificationMessage
                }
            });
            await db.ticket.update({
                where: { id: targetTicketId },
                data: { status: status === "APPROVED" ? "RESOLVED" : "CLOSED" }
            });
        } else {
            const newTicket = await db.ticket.create({
                data: {
                    userId: refund.userId,
                    title: `Refund ${status === "APPROVED" ? "Approved" : "Rejected"} - ${entityName}`,
                    description: `Refund request of ₹${refund.amount} processed by Admin.`,
                    category: "REFUND",
                    status: status === "APPROVED" ? "RESOLVED" : "CLOSED"
                }
            });
            await db.ticketMessage.create({
                data: {
                    ticketId: newTicket.id,
                    senderId: session.user.id,
                    message: notificationMessage
                }
            });
        }

        await db.auditLog.create({
            data: {
                action: `REFUND_${status}`,
                performedBy: session.user.email || session.user.id,
                details: `Refund ID ${refundId} of ₹${refund.amount} was ${status.toLowerCase()} by Superadmin. Admin Note: ${adminNote || "None"}. Reference ID: ${transactionId || "None"}`
            }
        }).catch(() => {});
    } catch (err) {
        console.error("Failed to send user refund notification:", err);
    }

    return updatedRefund;
};
