import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";

export const createRefundRequest = async (req: Request) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Unauthorized", 401);
    }

    const { orderId, bookingId, reason, amount } = await req.json();

    if (!reason || !amount || amount <= 0) {
        throw new ApiError("Reason and valid amount are required", 400);
    }

    if (!orderId && !bookingId) {
        throw new ApiError("Either orderId or bookingId must be specified", 400);
    }

    // Check for existing refund request
    if (orderId) {
        const existing = await db.refund.findUnique({ where: { orderId } });
        if (existing) {
            throw new ApiError("A refund request already exists for this order", 400);
        }

        const order = await db.order.findUnique({ where: { id: orderId } });
        if (!order) {
            throw new ApiError("Order not found", 404);
        }

        // Must be paid to request refund
        if (!order.isPaid) {
            throw new ApiError("Only paid orders can be refunded", 400);
        }
    }

    if (bookingId) {
        const existing = await db.refund.findUnique({ where: { bookingId } });
        if (existing) {
            throw new ApiError("A refund request already exists for this booking", 400);
        }

        const booking = await db.booking.findUnique({ where: { id: bookingId } });
        if (!booking) {
            throw new ApiError("Booking not found", 404);
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
        throw new ApiError("Unauthorized", 401);
    }

    const isSuperAdmin = session.user.role === "SUPERADMIN";

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
    if (!session?.user || session.user.role !== "SUPERADMIN") {
        throw new ApiError("Unauthorized. Only Superadmin can fulfill refunds", 403);
    }

    const { status, transactionId, adminNote } = await req.json();

    if (!["APPROVED", "REJECTED"].includes(status)) {
        throw new ApiError("Invalid refund status. Must be APPROVED or REJECTED", 400);
    }

    const refund = await db.refund.findUnique({
        where: { id: refundId }
    });

    if (!refund) {
        throw new ApiError("Refund request not found", 404);
    }

    if (refund.status !== "PENDING") {
        throw new ApiError("Refund request has already been processed", 400);
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
            });
        }
        if (refund.bookingId) {
            await db.booking.update({
                where: { id: refund.bookingId },
                data: { status: "CANCELLED" }
            });
        }
    }

    return updatedRefund;
};
