import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import bcrypt from "bcryptjs";

export const getSellerDeliveryPersons = async () => {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== "SELLER") {
        throw new ApiError("Unauthorized", 401);
    }

    const sellerProfile = await db.sellerProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!sellerProfile) {
        throw new ApiError("Seller profile not found", 404);
    }

    const deliveryPersons = await db.deliveryPerson.findMany({
        where: { sellerId: sellerProfile.id },
        include: { user: true },
        orderBy: { createdAt: 'desc' }
    });

    const formatted = deliveryPersons.map(dp => ({
        id: dp.id,
        userId: dp.userId,
        name: dp.name,
        phone: dp.phone,
        email: dp.user?.email || "",
        isActive: dp.isActive,
        outstandingBalance: dp.outstandingBalance,
        createdAt: dp.createdAt,
        updatedAt: dp.updatedAt
    }));

    return { deliveryPersons: formatted };
};

export const createSellerDeliveryPerson = async (req: Request) => {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== "SELLER") {
        throw new ApiError("Unauthorized", 401);
    }

    const sellerProfile = await db.sellerProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!sellerProfile) {
        throw new ApiError("Seller profile not found", 404);
    }

    const body = await req.json();
    console.log("Creating delivery person with payload:", body);
    const { name, phone, email, password, city, pincode } = body;

    if (!name || !phone || !email || !password) {
        console.error("Missing required fields for delivery person");
        throw new ApiError("Name, phone, email, and password are required", 400);
    }

    const normalizedEmail = email.toLowerCase();

    // Check if user already exists
    const existingUser = await db.user.findUnique({
        where: { email: normalizedEmail }
    });

    if (existingUser) {
        console.error("Email already in use:", normalizedEmail);
        throw new ApiError("Email already in use", 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const sellerUser = await db.user.findUnique({
        where: { id: sellerProfile.userId }
    });

    try {
        const result = await db.$transaction(async (tx) => {
            // 1. Create User
            const user = await tx.user.create({
                data: {
                    email: normalizedEmail,
                    passwordHash,
                    name,
                    phone,
                    role: "DELIVERY",
                    city: city || sellerUser?.city || "Default City",
                    pincode: pincode || sellerUser?.pincode || "000000",
                    isActive: true
                }
            });

            // 2. Create DeliveryPerson profile
            const deliveryPerson = await tx.deliveryPerson.create({
                data: {
                    userId: user.id,
                    name,
                    phone,
                    sellerId: sellerProfile.id,
                    isActive: true
                }
            });

            return { user, deliveryPerson };
        });

        return {
            deliveryPerson: {
                ...result.deliveryPerson,
                email: result.user.email
            }
        };
    } catch (error: any) {
        console.error("Database error during delivery person creation:", error);
        throw error;
    }
};

export const updateSellerDeliveryPerson = async (req: Request, id: string) => {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== "SELLER") {
        throw new ApiError("Unauthorized", 401);
    }

    const sellerProfile = await db.sellerProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!sellerProfile) {
        throw new ApiError("Seller profile not found", 404);
    }

    const { name, phone, isActive } = await req.json();

    const existing = await db.deliveryPerson.findFirst({
        where: { id, sellerId: sellerProfile.id }
    });

    if (!existing) {
        throw new ApiError("Delivery person not found", 404);
    }

    const updated = await db.deliveryPerson.update({
        where: { id },
        include: { user: true },
        data: {
            name: name || existing.name,
            phone: phone || existing.phone,
            isActive: typeof isActive === 'boolean' ? isActive : existing.isActive
        }
    });

    return {
        deliveryPerson: {
            id: updated.id,
            userId: updated.userId,
            name: updated.name,
            phone: updated.phone,
            email: updated.user?.email || "",
            isActive: updated.isActive,
            createdAt: updated.createdAt,
            updatedAt: updated.updatedAt
        }
    };
};

export const deleteSellerDeliveryPerson = async (id: string) => {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== "SELLER") {
        throw new ApiError("Unauthorized", 401);
    }

    const sellerProfile = await db.sellerProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!sellerProfile) {
        throw new ApiError("Seller profile not found", 404);
    }

    const existing = await db.deliveryPerson.findFirst({
        where: { id, sellerId: sellerProfile.id }
    });

    if (!existing) {
        throw new ApiError("Delivery person not found", 404);
    }

    await db.deliveryPerson.delete({
        where: { id }
    });

    return { success: true };
};

export const assignDeliveryPersonToOrder = async (req: Request, orderId: string) => {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== "SELLER") {
        throw new ApiError("Unauthorized", 401);
    }

    const sellerProfile = await db.sellerProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!sellerProfile) {
        throw new ApiError("Seller profile not found", 404);
    }

    const { deliveryPersonId } = await req.json();

    const order = await db.order.findFirst({
        where: { id: orderId, sellerId: sellerProfile.id }
    });

    if (!order) {
        throw new ApiError("Order not found", 404);
    }

    if (deliveryPersonId) {
        const dp = await db.deliveryPerson.findFirst({
            where: { id: deliveryPersonId, sellerId: sellerProfile.id }
        });
        if (!dp) throw new ApiError("Delivery person not found", 404);
    }

    const updatedOrder = await db.order.update({
        where: { id: orderId },
        data: {
            deliveryPersonId: deliveryPersonId || null,
            status: deliveryPersonId ? "OUT_FOR_DELIVERY" : order.status
        }
    });

    return { order: updatedOrder };
};

export const collectDeliveryCash = async (req: Request, deliveryPersonId: string) => {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== "SELLER") {
        throw new ApiError("Unauthorized", 401);
    }

    const sellerProfile = await db.sellerProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!sellerProfile) {
        throw new ApiError("Seller profile not found", 404);
    }

    const deliveryPerson = await db.deliveryPerson.findFirst({
        where: { id: deliveryPersonId, sellerId: sellerProfile.id }
    });

    if (!deliveryPerson) {
        throw new ApiError("Delivery person not found or not assigned to this seller", 404);
    }

    const { amount } = await req.json();
    const collectAmount = parseFloat(amount);

    if (isNaN(collectAmount) || collectAmount <= 1) {
        throw new ApiError("Collection amount must be greater than ₹1", 400);
    }

    if (collectAmount > deliveryPerson.outstandingBalance) {
        throw new ApiError("Collection amount cannot exceed outstanding balance", 400);
    }

    const updated = await db.$transaction(async (tx) => {
        const dp = await tx.deliveryPerson.update({
            where: { id: deliveryPersonId },
            data: {
                outstandingBalance: { decrement: collectAmount }
            }
        });

        await tx.deliveryTransaction.create({
            data: {
                deliveryPersonId,
                type: "SETTLEMENT",
                amount: collectAmount,
                description: `Cash collected by seller from delivery boy`,
                status: "COMPLETED"
            }
        });

        return dp;
    });

    return { outstandingBalance: updated.outstandingBalance };
};

export const getDeliveryTransactions = async (deliveryPersonId: string) => {
    const session = await getAuthSession();
    if (!session?.user || !["SELLER", "ADMIN", "SUPERADMIN", "AGENT"].includes(session.user.role)) {
        throw new ApiError("Unauthorized", 401);
    }

    const transactions = await db.deliveryTransaction.findMany({
        where: { deliveryPersonId },
        include: { order: true },
        orderBy: { createdAt: "desc" }
    });

    return { transactions };
};

export const adjustDeliveryBalance = async (req: Request, deliveryPersonId: string) => {
    const session = await getAuthSession();
    if (!session?.user || !["SELLER", "ADMIN", "SUPERADMIN", "AGENT"].includes(session.user.role)) {
        throw new ApiError("Unauthorized", 401);
    }

    const { amount, type, description } = await req.json(); // type: "INCREMENT" or "DECREMENT"
    const adjAmount = parseFloat(amount);

    if (isNaN(adjAmount) || adjAmount <= 1) {
        throw new ApiError("Adjustment amount must be greater than ₹1", 400);
    }

    const deliveryPerson = await db.deliveryPerson.findUnique({
        where: { id: deliveryPersonId }
    });

    if (!deliveryPerson) {
        throw new ApiError("Delivery person not found", 404);
    }

    const isDecrement = type === "DECREMENT";
    const finalAmount = isDecrement ? -adjAmount : adjAmount;

    if (isDecrement && adjAmount > deliveryPerson.outstandingBalance) {
        throw new ApiError("Adjustment would make outstanding balance negative", 400);
    }

    const updated = await db.$transaction(async (tx) => {
        const dp = await tx.deliveryPerson.update({
            where: { id: deliveryPersonId },
            data: {
                outstandingBalance: isDecrement ? { decrement: adjAmount } : { increment: adjAmount }
            }
        });

        await tx.deliveryTransaction.create({
            data: {
                deliveryPersonId,
                type: "ADJUSTMENT",
                amount: finalAmount,
                description: description || `Balance adjustment by ${session.user.role.toLowerCase()}`,
                status: "COMPLETED"
            }
        });

        return dp;
    });

    return { outstandingBalance: updated.outstandingBalance };
};
