import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";

export const getSuperadminSellers = async () => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to view sellers.", 401);
    }
    if (session.user.role !== "SUPERADMIN") {
        throw new ApiError("Access denied. Superadmin privileges required.", 403);
    }

    const sellers = await db.user.findMany({
        where: { role: "SELLER" },
        include: {
            sellerProfile: {
                include: {
                    subscriptions: {
                        where: { status: "ACTIVE" },
                        orderBy: { validUntil: "desc" },
                        take: 1
                    }
                }
            }
        },
        orderBy: { createdAt: "desc" }
    });

    const formattedSellers = sellers.map(seller => ({
        id: seller.id,
        name: seller.name,
        email: seller.email,
        phone: seller.phone,
        isActive: seller.isActive,
        businessName: seller.sellerProfile?.businessName || "N/A",
        type: seller.sellerProfile?.type || "N/A",
        verificationStatus: seller.sellerProfile?.verificationStatus || "PENDING",
        isOnline: seller.sellerProfile?.isOnline || false,
        trackingId: seller.sellerProfile?.trackingId || null,
        foodVerificationStatus: seller.sellerProfile?.foodVerificationStatus || "NONE",
        propertyVerificationStatus: seller.sellerProfile?.propertyVerificationStatus || "NONE",
        businessCategory: seller.sellerProfile?.businessCategory || "FOOD",
        hasActiveSubscription: (seller.sellerProfile?.subscriptions?.length ?? 0) > 0,
        subscriptionValidUntil: seller.sellerProfile?.subscriptions?.[0]?.validUntil || null
    }));

    return { sellers: formattedSellers };
};
