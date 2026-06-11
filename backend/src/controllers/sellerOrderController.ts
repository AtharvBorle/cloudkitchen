import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";

export const getSellerOrders = async () => {
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

    const orders = await db.order.findMany({
        where: { sellerId: sellerProfile.id },
        include: { user: true },
        orderBy: { createdAt: 'desc' }
    });

    return { orders };
};

export const updateSellerOrder = async (req: Request, orderId: string) => {
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

    const { status, isPaid } = await req.json();

    const existingOrder = await db.order.findFirst({
        where: {
            id: orderId,
            sellerId: sellerProfile.id
        }
    });

    if (!existingOrder) {
        throw new ApiError("Order not found", 404);
    }

    const updatedOrder = await db.order.update({
        where: { id: orderId },
        data: {
            status: status || existingOrder.status,
            isPaid: typeof isPaid === 'boolean' ? isPaid : existingOrder.isPaid
        }
    });

    return { order: updatedOrder };
};
