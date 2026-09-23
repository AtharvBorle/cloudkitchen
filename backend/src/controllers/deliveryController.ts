import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import Razorpay from "razorpay";
import crypto from "crypto";
import { handleCodOrderDelivered } from "@/lib/delivery-wallet";
import { emitOrderUpdated } from "@/lib/realtime-events";

export const getDeliveryOrders = async () => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to access delivery partner tasks.", 401);
    }
    if (session.user.role !== "DELIVERY") {
        throw new ApiError("Access denied. Delivery partner account required.", 403);
    }

    const deliveryProfile = await db.deliveryPerson.findUnique({
        where: { userId: session.user.id }
    });

    if (!deliveryProfile) {
        throw new ApiError("Delivery partner profile could not be found. Please contact support.", 404);
    }

    const orders = await db.order.findMany({
        where: {
            deliveryPersonId: deliveryProfile.id,
            status: { in: ["PENDING", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"] }
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    city: true,
                    pincode: true
                }
            },
            seller: {
                select: {
                    id: true,
                    businessName: true,
                    addressFlat: true,
                    addressLocality: true,
                    addressLandmark: true,
                    trackingId: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return { orders };
};

export const initiateDeliveryPayment = async (orderId: string) => {
    const session = await getAuthSession();
    if (!session?.user) throw new ApiError("Please log in first to initiate delivery payment.", 401);
    if (session.user.role !== "DELIVERY") throw new ApiError("Access denied. Delivery partner account required.", 403);

    const deliveryPerson = await db.deliveryPerson.findUnique({ where: { userId: session.user.id } });
    if (!deliveryPerson) throw new ApiError("Delivery partner profile could not be found.", 404);

    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order) throw new ApiError("The requested order could not be found.", 404);

    if (order.deliveryPersonId !== deliveryPerson.id) {
        throw new ApiError("You are not assigned to collect payment for this order.", 403);
    }
    if (order.isPaid) {
        throw new ApiError("This order has already been marked as paid.", 400);
    }

    try {
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID || "",
            key_secret: process.env.RAZORPAY_KEY_SECRET || "",
        });

        const rzpOrder = await razorpay.orders.create({
            amount: Math.round(order.totalAmount * 100),
            currency: "INR",
            receipt: `del_rcpt_${Date.now()}`
        });

        await db.order.update({
            where: { id: orderId },
            data: { razorpayOrderId: rzpOrder.id }
        });

        return rzpOrder;
    } catch (error) {
        console.error("Razorpay initiation error:", error);
        throw new ApiError("Failed to initiate payment. Please try again.", 500);
    }
};

export const verifyDeliveryPayment = async (req: Request, orderId: string) => {
    const session = await getAuthSession();
    if (!session?.user) throw new ApiError("Please log in first to verify delivery payment.", 401);
    if (session.user.role !== "DELIVERY") throw new ApiError("Access denied. Delivery partner account required.", 403);

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw new ApiError("Payment verification details are missing.", 400);
    }

    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order || order.razorpayOrderId !== razorpay_order_id) {
        throw new ApiError("Order details do not match the payment record.", 400);
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || "";
    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

    if (expectedSignature !== razorpay_signature) {
        throw new ApiError("Payment signature verification failed. Please try again.", 400);
    }

    const updatedOrder = await db.order.update({
        where: { id: orderId },
        data: {
            isPaid: true,
            status: "DELIVERED",
            razorpayPaymentId: razorpay_payment_id
        }
    });

    try {
        emitOrderUpdated(updatedOrder);
    } catch (e) {
        console.error("Realtime event emission error in delivery payment:", e);
    }

    return updatedOrder;
};

export const updateOrderStatus = async (req: Request, orderId: string) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to update order delivery status.", 401);
    }
    if (session.user.role !== "DELIVERY") {
        throw new ApiError("Access denied. Delivery partner account required.", 403);
    }

    const deliveryProfile = await db.deliveryPerson.findUnique({
        where: { userId: session.user.id }
    });

    if (!deliveryProfile) {
        throw new ApiError("Delivery partner profile could not be found.", 404);
    }

    const { status } = await req.json();

    if (!["OUT_FOR_DELIVERY", "DELIVERED"].includes(status)) {
        throw new ApiError("Invalid status transition for delivery.", 400);
    }

    const order = await db.order.findFirst({
        where: { id: orderId, deliveryPersonId: deliveryProfile.id }
    });

    if (!order) {
        throw new ApiError("This order is not assigned to your delivery account.", 404);
    }

    const updatedOrder = await db.$transaction(async (tx) => {
        const uo = await tx.order.update({
            where: { id: orderId },
            data: {
                status,
                isPaid: status === "DELIVERED" && order.paymentMethod === "COD" ? true : order.isPaid
            }
        });

        if (status === "DELIVERED" && order.status !== "DELIVERED") {
            await handleCodOrderDelivered(tx, orderId);
        }

        return uo;
    });

    try {
        emitOrderUpdated(updatedOrder);
    } catch (e) {
        console.error("Realtime event emission error in delivery update:", e);
    }

    return { order: updatedOrder };
};

export const getDeliveryProfile = async () => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to view your delivery profile.", 401);
    }
    if (session.user.role !== "DELIVERY") {
        throw new ApiError("Access denied. Delivery partner account required.", 403);
    }

    const deliveryProfile = await db.deliveryPerson.findUnique({
        where: { userId: session.user.id },
        include: {
            user: {
                select: {
                    name: true,
                    phone: true,
                    email: true,
                    city: true,
                    pincode: true,
                }
            },
            seller: {
                select: {
                    businessName: true,
                    addressFlat: true,
                    addressLocality: true,
                    addressLandmark: true,
                }
            }
        }
    });

    if (!deliveryProfile) {
        throw new ApiError("Delivery partner profile could not be found.", 404);
    }

    return { profile: deliveryProfile };
};

export const updateDeliveryProfile = async (req: Request) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to update your delivery profile.", 401);
    }
    if (session.user.role !== "DELIVERY") {
        throw new ApiError("Access denied. Delivery partner account required.", 403);
    }

    const { name, phone, city, pincode } = await req.json();

    // Verify profile exists
    const deliveryProfile = await db.deliveryPerson.findUnique({
        where: { userId: session.user.id }
    });

    if (!deliveryProfile) {
        throw new ApiError("Delivery partner profile could not be found.", 404);
    }

    // Update User record
    await db.user.update({
        where: { id: session.user.id },
        data: {
            name: name || undefined,
            phone: phone || undefined,
            city: city || undefined,
            pincode: pincode || undefined,
        }
    });

    // Update Delivery Person record
    const updatedProfile = await db.deliveryPerson.update({
        where: { id: deliveryProfile.id },
        data: {
            name: name || undefined,
            phone: phone || undefined,
        },
        include: {
            user: {
                select: {
                    name: true,
                    phone: true,
                    email: true,
                    city: true,
                    pincode: true,
                }
            },
            seller: {
                select: {
                    businessName: true,
                    addressFlat: true,
                    addressLocality: true,
                    addressLandmark: true,
                }
            }
        }
    });

    return { profile: updatedProfile };
};

export const getDeliveryPersonTransactions = async () => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to view delivery transactions.", 401);
    }
    if (session.user.role !== "DELIVERY") {
        throw new ApiError("Access denied. Delivery partner account required.", 403);
    }

    const deliveryProfile = await db.deliveryPerson.findUnique({
        where: { userId: session.user.id }
    });

    if (!deliveryProfile) {
        throw new ApiError("Delivery partner profile could not be found.", 404);
    }

    const transactions = await db.deliveryTransaction.findMany({
        where: { deliveryPersonId: deliveryProfile.id },
        include: { order: true },
        orderBy: { createdAt: "desc" }
    });

    return { transactions };
};
