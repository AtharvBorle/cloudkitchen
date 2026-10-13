import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";

export const getSuperadminSellers = async (req?: Request) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to view sellers.", 401);
    }
    if (session.user.role !== "SUPERADMIN") {
        throw new ApiError("Access denied. Superadmin privileges required.", 403);
    }

    const now = new Date();

    const sellers = await db.user.findMany({
        where: {
            role: "SELLER",
            deletedAt: null,
            isPermanentlyDeleted: false
        },
        include: {
            sellerProfile: {
                include: {
                    subscriptions: {
                        where: {
                            status: "ACTIVE",
                            OR: [
                                { validUntil: null },
                                { validUntil: { gte: now } }
                            ]
                        },
                        orderBy: { validUntil: "desc" },
                        take: 1
                    }
                }
            }
        },
        orderBy: { createdAt: "desc" }
    });

    const formattedSellers = sellers.map(seller => {
        const profile = seller.sellerProfile;
        const activeSub = profile?.subscriptions?.[0] || null;
        const isApproved = (profile?.verificationStatus || "").toUpperCase() === "APPROVED";
        const isAccountActive = Boolean(seller.isActive) && !seller.deletedAt && !seller.isPermanentlyDeleted && !profile?.deletedAt;
        const isOnline = Boolean(profile?.isOnline);
        const hasActiveSubscription = Boolean(activeSub);

        // A seller is considered "Platform Active" if their account is enabled & verified
        const isPlatformActive = isApproved && isAccountActive;

        const rawFoodType = (profile?.foodType || "BOTH").trim().toUpperCase();
        let normalizedFoodType = "BOTH";
        if (rawFoodType.includes("PURE") || rawFoodType === "VEG") {
            normalizedFoodType = "VEG";
        } else if (rawFoodType.includes("NON")) {
            normalizedFoodType = "NON_VEG";
        } else {
            normalizedFoodType = "BOTH";
        }

        const rawCategory = (profile?.businessCategory || "FOOD").trim().toUpperCase();
        let normalizedCategory = "FOOD";
        if (rawCategory === "ROOM" || rawCategory === "PROPERTY") {
            normalizedCategory = "ROOM";
        } else if (rawCategory === "BOTH") {
            normalizedCategory = "BOTH";
        } else {
            normalizedCategory = "FOOD";
        }

        return {
            id: seller.id,
            sellerProfileId: profile?.id || null,
            name: seller.name,
            email: seller.email,
            phone: seller.phone,
            city: seller.city || "",
            pincode: seller.pincode || "",
            addressLocality: profile?.addressLocality || "",
            addressFlat: profile?.addressFlat || "",
            isActive: Boolean(seller.isActive),
            isPlatformActive,
            businessName: profile?.businessName || seller.name || "N/A",
            type: profile?.type || "N/A",
            verificationStatus: profile?.verificationStatus || "PENDING",
            isOnline,
            trackingId: profile?.trackingId || null,
            foodVerificationStatus: profile?.foodVerificationStatus || "NONE",
            propertyVerificationStatus: profile?.propertyVerificationStatus || "NONE",
            businessCategory: normalizedCategory,
            rawBusinessCategory: profile?.businessCategory || "FOOD",
            foodType: normalizedFoodType,
            rawFoodType: profile?.foodType || "BOTH",
            hasActiveSubscription,
            subscriptionValidUntil: activeSub?.validUntil || null,
            subscriptionId: activeSub?.id || null,
            createdAt: seller.createdAt.toISOString(),
        };
    });

    const totalSellers = formattedSellers.length;
    const activeSellers = formattedSellers.filter(s => s.isPlatformActive).length;
    const onlineSellers = formattedSellers.filter(s => s.isPlatformActive && s.isOnline).length;
    const subscribedSellers = formattedSellers.filter(s => s.hasActiveSubscription).length;
    const pendingSellers = formattedSellers.filter(s => 
        s.verificationStatus === "PENDING" || 
        s.foodVerificationStatus === "PENDING" || 
        s.propertyVerificationStatus === "PENDING"
    ).length;
    const rejectedSellers = formattedSellers.filter(s => s.verificationStatus === "REJECTED").length;
    const vegSellers = formattedSellers.filter(s => s.foodType === "VEG").length;
    const nonVegSellers = formattedSellers.filter(s => s.foodType === "NON_VEG").length;
    const bothDietarySellers = formattedSellers.filter(s => s.foodType === "BOTH").length;
    const foodCategorySellers = formattedSellers.filter(s => s.businessCategory === "FOOD").length;
    const roomCategorySellers = formattedSellers.filter(s => s.businessCategory === "ROOM").length;
    const bothCategorySellers = formattedSellers.filter(s => s.businessCategory === "BOTH").length;

    // Optional query parameter filtering if requested via URL
    let filteredList = formattedSellers;
    if (req) {
        try {
            const url = new URL(req.url);
            const statusFilter = url.searchParams.get("status")?.toLowerCase();
            const applicationFilter = url.searchParams.get("application")?.toUpperCase();
            const foodTypeFilter = url.searchParams.get("foodType")?.toUpperCase();
            const verificationFilter = url.searchParams.get("verification")?.toUpperCase();
            const search = url.searchParams.get("search")?.toLowerCase().trim();

            if (statusFilter === "active") {
                filteredList = filteredList.filter(s => s.isPlatformActive);
            } else if (statusFilter === "inactive") {
                filteredList = filteredList.filter(s => !s.isPlatformActive);
            } else if (statusFilter === "online") {
                filteredList = filteredList.filter(s => s.isPlatformActive && s.isOnline);
            } else if (statusFilter === "offline") {
                filteredList = filteredList.filter(s => !s.isOnline);
            }

            if (applicationFilter && applicationFilter !== "ALL") {
                filteredList = filteredList.filter(s => s.businessCategory === applicationFilter);
            }

            if (foodTypeFilter && foodTypeFilter !== "ALL") {
                filteredList = filteredList.filter(s => s.foodType === foodTypeFilter);
            }

            if (verificationFilter && verificationFilter !== "ALL") {
                filteredList = filteredList.filter(s => s.verificationStatus.toUpperCase() === verificationFilter);
            }

            if (search) {
                filteredList = filteredList.filter(s => 
                    s.businessName.toLowerCase().includes(search) ||
                    s.name.toLowerCase().includes(search) ||
                    s.email.toLowerCase().includes(search) ||
                    s.phone.toLowerCase().includes(search) ||
                    (s.trackingId && s.trackingId.toLowerCase().includes(search)) ||
                    s.city.toLowerCase().includes(search) ||
                    s.addressLocality.toLowerCase().includes(search)
                );
            }
        } catch {
            // URL parse failure fallback to all
        }
    }

    return {
        sellers: filteredList,
        allSellers: formattedSellers,
        metrics: {
            totalSellers,
            activeSellers,
            onlineSellers,
            subscribedSellers,
            pendingSellers,
            rejectedSellers,
            vegSellers,
            nonVegSellers,
            bothDietarySellers,
            foodCategorySellers,
            roomCategorySellers,
            bothCategorySellers
        }
    };
};
