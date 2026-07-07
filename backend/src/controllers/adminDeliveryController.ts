import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";

export const getAdminDeliveryPersons = async () => {
    const session = await getAuthSession();
    if (!session?.user || !["ADMIN", "SUPERADMIN", "AGENT"].includes(session.user.role)) {
        throw new ApiError("Unauthorized", 401);
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
