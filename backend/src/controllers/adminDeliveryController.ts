import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";

export const getAdminDeliveryPersons = async () => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to view delivery partners.", 401);
    }
    if (!["ADMIN", "SUPERADMIN", "AGENT"].includes(session.user.role)) {
        throw new ApiError("Access denied. Admin privileges required.", 403);
    }

    const deliveryPersons = await db.deliveryPerson.findMany({
        include: {
            user: true,
            seller: true
        },
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
        sellerBusinessName: dp.seller?.businessName || "Unknown Seller",
        createdAt: dp.createdAt,
        updatedAt: dp.updatedAt
    }));

    return { deliveryPersons: formatted };
};
