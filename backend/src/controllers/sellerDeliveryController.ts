import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { emitOrderUpdated, emitSellerDashboardRefresh } from "@/lib/realtime-events";
import { validateEmail } from "@/lib/email-validation";
import bcrypt from "bcryptjs";

export const getSellerDeliveryPersons = async (req?: Request) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to manage delivery personnel.", 401);
    }
    if (session.user.role !== "SELLER") {
        throw new ApiError("Access denied. Seller account required.", 403);
    }

    const sellerProfile = await db.sellerProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!sellerProfile) {
        throw new ApiError("Seller profile not found. Please complete seller registration.", 404);
    }

    // Support date query param: ?date=YYYY-MM-DD or ?from=ISO&to=ISO
    let startDate: Date;
    let endDate: Date;
    let isToday = false;
    let dateStr = "";

    if (req) {
        try {
            const { searchParams } = new URL(req.url);
            const dateQuery = searchParams.get("date");
            const fromQuery = searchParams.get("from");
            const toQuery = searchParams.get("to");

            if (fromQuery && toQuery) {
                startDate = new Date(fromQuery);
                endDate = new Date(toQuery);
                const now = new Date();
                isToday = (
                    startDate.getFullYear() === now.getFullYear() &&
                    startDate.getMonth() === now.getMonth() &&
                    startDate.getDate() === now.getDate()
                );
                dateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`;
            } else if (dateQuery && /^\d{4}-\d{2}-\d{2}$/.test(dateQuery)) {
                const [y, m, d] = dateQuery.split("-").map(Number);
                startDate = new Date(y, m - 1, d, 0, 0, 0, 0);
                endDate = new Date(y, m - 1, d, 23, 59, 59, 999);
                const now = new Date();
                isToday = (
                    now.getFullYear() === y &&
                    now.getMonth() === m - 1 &&
                    now.getDate() === d
                );
                dateStr = dateQuery;
            } else {
                const now = new Date();
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
                endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                isToday = true;
                dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
            }
        } catch {
            const now = new Date();
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            isToday = true;
            dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        }
    } else {
        const now = new Date();
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        isToday = true;
        dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    }

    const deliveryPersons = await db.deliveryPerson.findMany({
        where: { sellerId: sellerProfile.id },
        include: {
            user: true,
            orders: {
                where: {
                    status: { in: ["PENDING", "ACCEPTED", "PREPARING", "OUT_FOR_DELIVERY", "CONFIRMED"] }
                },
                select: { id: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    const dpIds = deliveryPersons.map(dp => dp.id);

    // 1. Total COD Outstanding currently in active rider wallets
    const totalCodOutstanding = deliveryPersons.reduce((sum, dp) => sum + (dp.outstandingBalance || 0), 0);

    // 2. Total COD Cash collected by delivery persons on the selected date
    const codTransactions = await db.deliveryTransaction.findMany({
        where: {
            deliveryPersonId: { in: dpIds },
            type: "COD_COLLECTION",
            status: "COMPLETED",
            createdAt: {
                gte: startDate,
                lte: endDate
            }
        }
    });
    const txCodCollected = codTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);

    // Also check delivered COD orders for this seller within the selected date range
    const deliveredCodOrders = await db.order.findMany({
        where: {
            sellerId: sellerProfile.id,
            paymentMethod: "COD",
            status: { in: ["DELIVERED", "COMPLETED"] },
            OR: [
                {
                    updatedAt: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                {
                    createdAt: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            ]
        }
    });
    const orderCodCollected = deliveredCodOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const cashCollectedToday = Math.max(txCodCollected, orderCodCollected);

    // 3. Cash settlements collected by kitchen owner from delivery riders on that date
    const daySettlements = await db.deliveryTransaction.findMany({
        where: {
            deliveryPersonId: { in: dpIds },
            type: "SETTLEMENT",
            status: "COMPLETED",
            createdAt: {
                gte: startDate,
                lte: endDate
            }
        }
    });
    const cashSettledToday = daySettlements.reduce((sum, tx) => sum + (tx.amount || 0), 0);

    const activeSquadCount = deliveryPersons.filter(dp => dp.isActive).length;

    const formatted = deliveryPersons.map(dp => ({
        id: dp.id,
        userId: dp.userId,
        name: dp.name,
        phone: dp.phone,
        email: dp.user?.email || "",
        vehicleType: dp.vehicleType || "Motorcycle / Scooter",
        vehicleNumber: dp.vehicleNumber || "",
        isActive: dp.isActive,
        outstandingBalance: dp.outstandingBalance,
        pendingDeliveriesCount: dp.orders.length,
        createdAt: dp.createdAt,
        updatedAt: dp.updatedAt
    }));

    return {
        deliveryPersons: formatted,
        metrics: {
            totalCodOutstanding,
            cashCollectedToday,
            cashSettledToday,
            activeSquadCount,
            selectedDate: dateStr,
            isToday
        }
    };
};

export const createSellerDeliveryPerson = async (req: Request) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to add a delivery agent.", 401);
    }
    if (session.user.role !== "SELLER") {
        throw new ApiError("Access denied. Seller account required.", 403);
    }

    const sellerProfile = await db.sellerProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!sellerProfile) {
        throw new ApiError("Seller profile not found. Please complete seller registration.", 404);
    }

    const body = await req.json();
    console.log("Creating delivery person with payload:", body);
    const { name, phone, email, password, city, pincode, vehicleType, vehicleNumber } = body;

    if (!name || !phone || !email || !password) {
        console.error("Missing required fields for delivery person");
        throw new ApiError("Name, phone, email, and password are required", 400);
    }

    const rawDigits = String(phone).replace(/\D/g, "");
    const phoneDigits = rawDigits.length > 10 ? rawDigits.slice(-10) : rawDigits;
    if (phoneDigits.length !== 10) {
        throw new ApiError("Phone number must be exactly 10 digits", 400);
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
        throw new ApiError(emailValidation.error || "Please enter a valid email address.", 400);
    }
    const normalizedEmail = emailValidation.normalizedEmail;

    // Check if user already exists
    const existingUser = await db.user.findUnique({
        where: { email: normalizedEmail }
    });

    if (existingUser) {
        console.error("Email already in use:", normalizedEmail);
        throw new ApiError("An account with this email address already exists. Please use a different email.", 409);
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
                    name: name.trim(),
                    phone: phoneDigits,
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
                    name: name.trim(),
                    phone: phoneDigits,
                    sellerId: sellerProfile.id,
                    vehicleType: vehicleType || "Motorcycle / Scooter",
                    vehicleNumber: vehicleNumber || null,
                    isActive: true
                }
            });

            return { user, deliveryPerson };
        });

        return {
            deliveryPerson: {
                id: result.deliveryPerson.id,
                userId: result.deliveryPerson.userId,
                name: result.deliveryPerson.name,
                phone: result.deliveryPerson.phone,
                email: result.user.email,
                vehicleType: result.deliveryPerson.vehicleType || "Motorcycle / Scooter",
                vehicleNumber: result.deliveryPerson.vehicleNumber || "",
                isActive: result.deliveryPerson.isActive,
                outstandingBalance: result.deliveryPerson.outstandingBalance,
                pendingDeliveriesCount: 0,
                createdAt: result.deliveryPerson.createdAt,
                updatedAt: result.deliveryPerson.updatedAt
            }
        };
    } catch (error: any) {
        console.error("Database error during delivery person creation:", error);
        throw error;
    }
};

export const updateSellerDeliveryPerson = async (req: Request, id: string) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to update delivery person.", 401);
    }
    if (session.user.role !== "SELLER") {
        throw new ApiError("Access denied. Seller account required.", 403);
    }

    const sellerProfile = await db.sellerProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!sellerProfile) {
        throw new ApiError("Seller profile not found. Please complete seller registration.", 404);
    }

    const existing = await db.deliveryPerson.findFirst({
        where: { id, sellerId: sellerProfile.id },
        include: { user: true }
    });

    if (!existing) {
        throw new ApiError("Delivery person not found", 404);
    }

    const body = await req.json();
    const { name, phone, email, password, vehicleType, vehicleNumber, isActive } = body;

    let cleanPhone = existing.phone;
    if (phone !== undefined && phone !== null && String(phone).trim() !== "") {
        const rawPhone = String(phone).replace(/\D/g, "");
        const phoneDigits = rawPhone.length > 10 ? rawPhone.slice(-10) : rawPhone;
        if (phoneDigits.length !== 10) {
            throw new ApiError("Phone number must be exactly 10 digits", 400);
        }
        cleanPhone = phoneDigits;
    }

    let cleanEmail = existing.user?.email;
    if (email !== undefined && email !== null && String(email).trim() !== "") {
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
            throw new ApiError(emailValidation.error || "Please enter a valid email address.", 400);
        }
        cleanEmail = emailValidation.normalizedEmail;

        if (cleanEmail !== existing.user?.email) {
            const emailInUse = await db.user.findFirst({
                where: {
                    email: cleanEmail,
                    id: { not: existing.userId }
                }
            });
            if (emailInUse) {
                throw new ApiError("Email address is already in use by another account.", 409);
            }
        }
    }

    let newPasswordHash: string | undefined = undefined;
    if (password !== undefined && password !== null && String(password).trim() !== "") {
        if (String(password).length < 6) {
            throw new ApiError("Password must be at least 6 characters long", 400);
        }
        newPasswordHash = await bcrypt.hash(String(password), 10);
    }

    const updated = await db.$transaction(async (tx) => {
        // Update user record if needed
        if (existing.userId) {
            const userDataToUpdate: any = {};
            if (name !== undefined && name !== null && String(name).trim() !== "") userDataToUpdate.name = String(name).trim();
            if (cleanPhone) userDataToUpdate.phone = cleanPhone;
            if (cleanEmail) userDataToUpdate.email = cleanEmail;
            if (newPasswordHash) userDataToUpdate.passwordHash = newPasswordHash;
            if (isActive !== undefined) userDataToUpdate.isActive = Boolean(isActive);

            if (Object.keys(userDataToUpdate).length > 0) {
                await tx.user.update({
                    where: { id: existing.userId },
                    data: userDataToUpdate
                });
            }
        }

        // Update delivery person profile
        const dpDataToUpdate: any = {};
        if (name !== undefined && name !== null && String(name).trim() !== "") dpDataToUpdate.name = String(name).trim();
        if (cleanPhone !== undefined) dpDataToUpdate.phone = cleanPhone;
        if (vehicleType !== undefined) dpDataToUpdate.vehicleType = vehicleType;
        if (vehicleNumber !== undefined) dpDataToUpdate.vehicleNumber = vehicleNumber;
        if (isActive !== undefined) dpDataToUpdate.isActive = Boolean(isActive);

        return await tx.deliveryPerson.update({
            where: { id },
            include: { user: true },
            data: dpDataToUpdate
        });
    });

    const pendingCount = await db.order.count({
        where: {
            deliveryPersonId: id,
            status: { in: ["PENDING", "ACCEPTED", "PREPARING", "OUT_FOR_DELIVERY", "CONFIRMED"] }
        }
    });

    return {
        deliveryPerson: {
            id: updated.id,
            userId: updated.userId,
            name: updated.name,
            phone: updated.phone,
            email: updated.user?.email || "",
            vehicleType: updated.vehicleType || "Motorcycle / Scooter",
            vehicleNumber: updated.vehicleNumber || "",
            isActive: updated.isActive,
            outstandingBalance: updated.outstandingBalance,
            pendingDeliveriesCount: pendingCount,
            createdAt: updated.createdAt,
            updatedAt: updated.updatedAt
        }
    };
};

export const deleteSellerDeliveryPerson = async (id: string) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to delete delivery person.", 401);
    }
    if (session.user.role !== "SELLER") {
        throw new ApiError("Access denied. Seller account required.", 403);
    }

    const sellerProfile = await db.sellerProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!sellerProfile) {
        throw new ApiError("Seller profile not found. Please complete seller registration.", 404);
    }

    const existing = await db.deliveryPerson.findFirst({
        where: { id, sellerId: sellerProfile.id }
    });

    if (!existing) {
        throw new ApiError("Delivery person not found", 404);
    }

    // 1. Check outstanding balance
    if (existing.outstandingBalance > 0) {
        throw new ApiError(`Cannot delete delivery agent: agent has an outstanding COD balance of ₹${existing.outstandingBalance.toLocaleString("en-IN")}. Please collect and settle cash balance first, or mark the agent as Inactive.`, 400);
    }

    // 2. Check pending deliveries
    const pendingOrdersCount = await db.order.count({
        where: {
            deliveryPersonId: id,
            status: { in: ["PENDING", "ACCEPTED", "PREPARING", "OUT_FOR_DELIVERY", "CONFIRMED"] }
        }
    });

    if (pendingOrdersCount > 0) {
        throw new ApiError(`Cannot delete delivery agent: agent currently has ${pendingOrdersCount} active pending deliver${pendingOrdersCount === 1 ? "y" : "ies"}. Please reassign or complete pending deliveries first, or mark the agent as Inactive.`, 400);
    }

    // 3. Perform clean deletion in transaction
    await db.$transaction(async (tx) => {
        // Unlink historical completed/cancelled orders to prevent foreign key errors
        await tx.order.updateMany({
            where: { deliveryPersonId: id },
            data: { deliveryPersonId: null }
        });

        // Delete delivery person record
        await tx.deliveryPerson.delete({
            where: { id }
        });

        // Delete associated user login account if applicable
        if (existing.userId) {
            await tx.user.delete({
                where: { id: existing.userId }
            }).catch(() => {});
        }
    });

    return {
        success: true,
        message: `Delivery agent ${existing.name} deleted successfully.`
    };
};

export const assignDeliveryPersonToOrder = async (req: Request, orderId: string) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to assign delivery person.", 401);
    }
    if (session.user.role !== "SELLER") {
        throw new ApiError("Access denied. Seller account required.", 403);
    }

    const sellerProfile = await db.sellerProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!sellerProfile) {
        throw new ApiError("Seller profile not found. Please complete seller registration.", 404);
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

    try {
        emitOrderUpdated(updatedOrder);
    } catch (e) {
        console.error("Realtime event emission error:", e);
    }

    return { order: updatedOrder };
};

export const collectDeliveryCash = async (req: Request, deliveryPersonId: string) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to collect cash.", 401);
    }
    if (session.user.role !== "SELLER") {
        throw new ApiError("Access denied. Seller account required.", 403);
    }

    const sellerProfile = await db.sellerProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!sellerProfile) {
        throw new ApiError("Seller profile not found. Please complete seller registration.", 404);
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

    try {
        emitSellerDashboardRefresh(sellerProfile.id);
    } catch (e) {
        console.error("Dashboard refresh emission error on settlement:", e);
    }

    return { outstandingBalance: updated.outstandingBalance };
};

export const getDeliveryTransactions = async (deliveryPersonId: string) => {
    const session = await getAuthSession();
    if (!session?.user || !["SELLER", "ADMIN", "SUPERADMIN", "AGENT"].includes(session.user.role)) {
        throw new ApiError("Please log in first to view delivery transactions.", 401);
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
    if (!session?.user || !["ADMIN", "SUPERADMIN", "AGENT"].includes(session.user.role)) {
        throw new ApiError("Please log in first with admin credentials to adjust balance.", 401);
    }

    const { amount, type, description } = await req.json(); // type: "INCREMENT" or "DECREMENT"
    if (typeof amount === "string" && !/^\d+(\.\d+)?$/.test(amount.trim())) {
        throw new ApiError("Please provide a valid numeric adjustment amount.", 400);
    }
    const adjAmount = parseFloat(amount);

    if (isNaN(adjAmount) || adjAmount <= 0) {
        throw new ApiError("Adjustment amount must be a positive number greater than ₹0", 400);
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
