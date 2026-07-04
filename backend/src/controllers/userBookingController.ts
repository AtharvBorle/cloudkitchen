import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import Razorpay from "razorpay";
import crypto from "crypto";

export const createBooking = async (req: Request) => {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== "USER") {
        throw new ApiError("Unauthorized", 401);
    }

    const { roomId, startDate, endDate, totalAmount, paymentMethod } = await req.json();

    if (!roomId || !startDate || !endDate) {
        throw new ApiError("Missing required booking details", 400);
    }

    const room = await db.room.findUnique({
        where: { id: roomId },
        include: {
            seller: {
                include: {
                    subscriptions: {
                        where: { status: "ACTIVE" },
                        include: { plan: true }
                    }
                }
            }
        }
    });

    if (!room || !room.isAvailable) {
        throw new ApiError("Room is no longer available", 400);
    }

    const now = new Date();
    const hasActivePropertySub = room.seller.subscriptions.some((sub: any) => 
        sub.status === "ACTIVE" && 
        (sub.validUntil === null || new Date(sub.validUntil) > now) &&
        (sub.plan?.category === "PROPERTY" || sub.plan?.category === "BOTH")
    );

    if (!hasActivePropertySub) {
        throw new ApiError("This property is currently not accepting bookings (No active subscription).", 400);
    }

    const requestedStart = new Date(startDate);
    const requestedEnd = new Date(endDate);

    const overlappingBookings = await db.booking.findFirst({
        where: {
            roomId: roomId,
            status: { in: ["CONFIRMED", "PENDING"] },
            AND: [
                { startDate: { lt: requestedEnd } },
                { endDate: { gt: requestedStart } }
            ]
        }
    });

    if (overlappingBookings) {
        throw new ApiError("These dates are already booked by someone else.", 400);
    }

    const booking = await db.booking.create({
        data: {
            roomId: roomId,
            userId: session.user.id,
            startDate: requestedStart,
            endDate: requestedEnd,
            status: "PENDING",
            paymentMethod: paymentMethod || "COD",
            totalAmount: totalAmount ? parseFloat(totalAmount) : 0,
            isPaid: false
        }
    });

    return { booking };
};

export const initiateBookingPayment = async (req: Request, bookingId: string) => {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== "USER") {
        throw new ApiError("Unauthorized", 401);
    }

    const booking = await db.booking.findUnique({
        where: { id: bookingId }
    });

    if (!booking) {
        throw new ApiError("Booking not found", 404);
    }

    if (booking.userId !== session.user.id) {
        throw new ApiError("Unauthorized access to booking", 403);
    }

    if (booking.status !== "CONFIRMED") {
        throw new ApiError("Only confirmed bookings can be paid online after approval", 400);
    }

    if (booking.isPaid) {
        throw new ApiError("Booking is already paid", 400);
    }

    let razorpayOrderData = null;
    try {
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID || "",
            key_secret: process.env.RAZORPAY_KEY_SECRET || "",
        });

        const rzpOrder = await razorpay.orders.create({
            amount: Math.round(booking.totalAmount * 100), // in paise
            currency: "INR",
            receipt: `booking_rcpt_${booking.id}`
        });

        razorpayOrderData = rzpOrder;
    } catch (error) {
        console.error("Razorpay error for booking:", error);
        throw new ApiError("Failed to initiate online payment for booking", 500);
    }

    const updatedBooking = await db.booking.update({
        where: { id: bookingId },
        data: {
            razorpayOrderId: razorpayOrderData.id
        }
    });

    return {
        booking: updatedBooking,
        razorpayOrder: razorpayOrderData
    };
};

export const verifyBookingPayment = async (req: Request, bookingId: string) => {
    const session = await getAuthSession();
    if (!session || !session.user || session.user.role !== "USER") {
        throw new ApiError("Unauthorized", 401);
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw new ApiError("Missing payment verification details", 400);
    }

    const booking = await db.booking.findUnique({
        where: { id: bookingId }
    });

    if (!booking) {
        throw new ApiError("Booking not found", 404);
    }

    if (booking.userId !== session.user.id) {
        throw new ApiError("Unauthorized access to booking", 403);
    }

    if (booking.razorpayOrderId !== razorpay_order_id) {
        throw new ApiError("Order ID mismatch", 400);
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || "";
    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

    if (expectedSignature !== razorpay_signature) {
        throw new ApiError("Invalid payment signature", 400);
    }

    const updatedBooking = await db.booking.update({
        where: { id: bookingId },
        data: {
            isPaid: true,
            razorpayPaymentId: razorpay_payment_id
        }
    });

    return { booking: updatedBooking };
};
