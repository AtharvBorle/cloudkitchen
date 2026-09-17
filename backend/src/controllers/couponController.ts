import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { ApiError } from "@/lib/api-error";

const prisma = new PrismaClient();

export const getAllCoupons = async () => {
    const session = await getAuthSession();
    if (!session || !session.user) {
        throw new ApiError("Unauthorized", 401);
    }

    const role = session.user.role;
    let coupons;

    if (role === "SUPERADMIN") {
        coupons = await prisma.coupon.findMany();
    }
    else if (role === "ADMIN" || role === "AGENT") {
        const agentProfile = await prisma.agentProfile.findUnique({
            where: { userId: session.user.id },
            include: { assignedSellers: true }
        });

        let sellerIds: string[] = [];
        if (agentProfile && agentProfile.assignedSellers.length > 0) {
            sellerIds = agentProfile.assignedSellers.map(s => s.id);
        }

        coupons = await prisma.coupon.findMany({
            where: {
                OR: [
                    { appliesToSellerId: null } as any,
                    { appliesToSellerId: { in: sellerIds } } as any
                ]
            }
        });
    }
    else if (role === "SELLER") {
        const sellerProfile = await prisma.sellerProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!sellerProfile) {
            throw new ApiError("Seller profile not found", 404);
        }

        coupons = await prisma.coupon.findMany({
            where: {
                appliesToSellerId: sellerProfile.id
            }
        });
    } else {
        throw new ApiError("Forbidden", 403);
    }

    return coupons;
};

export const createCoupon = async (req: Request) => {
    const session = await getAuthSession();
    if (!session || !session.user || !["SUPERADMIN", "ADMIN", "AGENT", "SELLER"].includes(session.user.role)) {
        throw new ApiError("Unauthorized", 401);
    }

    const body = await req.json();
    const {
        code,
        description,
        discountType,
        discountValue,
        discountPercentage,
        discountAmount,
        minOrderAmount,
        minimumCartValue,
        maxDiscountAmount,
        maxDiscountCap,
        appliesTo,
        customerEligibility,
        usageLimit,
        maxUsers,
        perUserLimit,
        maxUsagesPerUser,
        noExpiry,
        startDate,
        validFrom,
        expiryDate,
        validUntil,
        status,
        appliesToSellerId,
        appliesToProductId,
        category
    } = body;

    if (!code || !code.trim()) {
        throw new ApiError("Coupon code is required", 400);
    }

    // Determine discount values
    let finalDiscountType = discountType || (discountPercentage ? "PERCENTAGE" : "FLAT");
    let finalDiscountPercentage: number | null = null;
    let finalDiscountAmount: number | null = null;

    if (discountValue !== undefined && discountValue !== null && discountValue !== "") {
        const val = parseFloat(discountValue);
        if (finalDiscountType === "PERCENTAGE") {
            finalDiscountPercentage = val;
        } else {
            finalDiscountAmount = val;
        }
    } else {
        if (discountPercentage !== undefined && discountPercentage !== null) {
            finalDiscountPercentage = parseFloat(discountPercentage);
            finalDiscountType = "PERCENTAGE";
        }
        if (discountAmount !== undefined && discountAmount !== null) {
            finalDiscountAmount = parseFloat(discountAmount);
            finalDiscountType = "FLAT";
        }
    }

    if (finalDiscountPercentage === null && finalDiscountAmount === null) {
        throw new ApiError("Must provide valid discount value", 400);
    }

    const role = session.user.role;
    let finalSellerId = appliesToSellerId;
    let approvalStatus = "APPROVED";

    if (status === "Pending") {
        approvalStatus = "PENDING_APPROVAL";
    }

    if (role === "SELLER") {
        const sellerProfile = await prisma.sellerProfile.findUnique({
            where: { userId: session.user.id }
        });
        if (!sellerProfile) throw new ApiError("Seller profile required", 403);
        finalSellerId = sellerProfile.id;
    } else if (role === "AGENT") {
        const agentProfile = await prisma.agentProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!agentProfile || !agentProfile.canManageOffers) {
            throw new ApiError("You do not have permission to manage offers", 403);
        }

        if (!finalSellerId || finalSellerId === "GLOBAL") {
            approvalStatus = "PENDING_APPROVAL";
        }
    }

    const finalMinCart = minOrderAmount !== undefined ? parseFloat(minOrderAmount) : (minimumCartValue !== undefined ? parseFloat(minimumCartValue) : null);
    const finalMaxCap = maxDiscountAmount !== undefined && maxDiscountAmount !== null && maxDiscountAmount !== "" ? parseFloat(maxDiscountAmount) : (maxDiscountCap !== undefined && maxDiscountCap !== null && maxDiscountCap !== "" ? parseFloat(maxDiscountCap) : null);
    const finalUsageLimit = usageLimit !== undefined && usageLimit !== null && usageLimit !== "" ? parseInt(usageLimit) : (maxUsers !== undefined && maxUsers !== null && maxUsers !== "" ? parseInt(maxUsers) : null);
    const finalPerUserLimit = perUserLimit !== undefined && perUserLimit !== null && perUserLimit !== "" ? parseInt(perUserLimit) : (maxUsagesPerUser !== undefined && maxUsagesPerUser !== null && maxUsagesPerUser !== "" ? parseInt(maxUsagesPerUser) : 1);

    let parsedStartDate = new Date();
    if (startDate && startDate !== "Today (Immediately)") {
        const d = new Date(startDate);
        if (!isNaN(d.getTime())) parsedStartDate = d;
    } else if (validFrom) {
        const d = new Date(validFrom);
        if (!isNaN(d.getTime())) parsedStartDate = d;
    }

    let parsedEndDate: Date | null = null;
    const isNoExp = noExpiry !== undefined ? Boolean(noExpiry) : (validUntil ? false : true);
    if (!isNoExp) {
        if (expiryDate && expiryDate !== "Runs indefinitely") {
            const d = new Date(expiryDate);
            if (!isNaN(d.getTime())) parsedEndDate = d;
        } else if (validUntil) {
            const d = new Date(validUntil);
            if (!isNaN(d.getTime())) parsedEndDate = d;
        }
    }

    try {
        const couponData: any = {
            code: code.trim().toUpperCase(),
            description: description || "",
            discountType: finalDiscountType,
            discountPercentage: finalDiscountPercentage,
            discountAmount: finalDiscountAmount,
            creatorId: session.user.id,
            appliesToSellerId: finalSellerId === "GLOBAL" ? null : finalSellerId,
            appliesToProductId: appliesToProductId || null,
            appliesTo: appliesTo || (appliesToProductId ? "ITEMS" : "ALL"),
            customerEligibility: customerEligibility || "ALL",
            usageLimit: finalUsageLimit,
            perUserLimit: finalPerUserLimit,
            noExpiry: isNoExp,
            validFrom: parsedStartDate,
            validUntil: parsedEndDate,
            maxUsagesPerUser: finalPerUserLimit,
            maxUsers: finalUsageLimit,
            minimumCartValue: finalMinCart,
            maxDiscountAmount: finalMaxCap,
            isActive: status !== "Expired",
            approvalStatus,
            category: category || "BOTH"
        };

        const newCoupon = await prisma.coupon.create({
            data: couponData
        });

        return newCoupon;
    } catch (error: any) {
        if (error.code === 'P2002') {
            throw new ApiError("Coupon code already exists", 400);
        }
        throw new ApiError("An error occurred while creating coupon", 500);
    }
};

export const updateCoupon = async (req: Request, couponId: string) => {
    const session = await getAuthSession();
    if (!session || !session.user || !["SUPERADMIN", "AGENT", "SELLER"].includes(session.user.role)) {
        throw new ApiError("Unauthorized", 401);
    }

    const body = await req.json();

    const existingCoupon = await prisma.coupon.findUnique({
        where: { id: couponId }
    });

    if (!existingCoupon) {
        throw new ApiError("Coupon not found", 404);
    }

    const role = session.user.role;
    const {
        isActive,
        code,
        category,
        description,
        discountType,
        discountValue,
        discountPercentage,
        discountAmount,
        minOrderAmount,
        minimumCartValue,
        maxDiscountAmount,
        maxDiscountCap,
        appliesTo,
        customerEligibility,
        usageLimit,
        maxUsers,
        perUserLimit,
        maxUsagesPerUser,
        noExpiry,
        startDate,
        validFrom,
        expiryDate,
        validUntil,
        status,
        appliesToProductId
    } = body;

    if (role === "SELLER") {
        const sellerProfile = await prisma.sellerProfile.findUnique({
            where: { userId: session.user.id }
        });
        if (!sellerProfile || (existingCoupon as any).appliesToSellerId !== sellerProfile.id) {
            throw new ApiError("Forbidden: Cannot modify this coupon", 403);
        }
    } else if (role === "AGENT") {
        const agentProfile = await prisma.agentProfile.findUnique({
            where: { userId: session.user.id }
        });
        if (!agentProfile || !agentProfile.canManageOffers) {
            throw new ApiError("You do not have permission to manage offers", 403);
        }
    }

    if (code && code.toUpperCase() !== existingCoupon.code) {
        const codeExists = await prisma.coupon.findUnique({
            where: { code: code.toUpperCase() }
        });
        if (codeExists) {
            throw new ApiError("Coupon code already exists", 400);
        }
    }

    const updateData: any = {};

    if (code !== undefined) updateData.code = code.toUpperCase();
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (appliesTo !== undefined) updateData.appliesTo = appliesTo;
    if (appliesToProductId !== undefined) updateData.appliesToProductId = appliesToProductId;
    if (customerEligibility !== undefined) updateData.customerEligibility = customerEligibility;

    // Discount calculations
    let finalType = discountType || existingCoupon.discountType;
    if (discountType !== undefined) updateData.discountType = discountType;

    if (discountValue !== undefined && discountValue !== "") {
        const val = parseFloat(discountValue);
        if (finalType === "PERCENTAGE") {
            updateData.discountPercentage = val;
            updateData.discountAmount = null;
        } else {
            updateData.discountAmount = val;
            updateData.discountPercentage = null;
        }
    } else {
        if (discountPercentage !== undefined) updateData.discountPercentage = discountPercentage ? parseFloat(discountPercentage) : null;
        if (discountAmount !== undefined) updateData.discountAmount = discountAmount ? parseFloat(discountAmount) : null;
    }

    // Min Cart / Max Cap / Limits
    if (minOrderAmount !== undefined) {
        updateData.minimumCartValue = minOrderAmount ? parseFloat(minOrderAmount) : null;
    } else if (minimumCartValue !== undefined) {
        updateData.minimumCartValue = minimumCartValue ? parseFloat(minimumCartValue) : null;
    }

    if (maxDiscountAmount !== undefined) {
        updateData.maxDiscountAmount = maxDiscountAmount ? parseFloat(maxDiscountAmount) : null;
    } else if (maxDiscountCap !== undefined) {
        updateData.maxDiscountAmount = maxDiscountCap ? parseFloat(maxDiscountCap) : null;
    }

    if (usageLimit !== undefined) {
        updateData.usageLimit = usageLimit ? parseInt(usageLimit) : null;
        updateData.maxUsers = updateData.usageLimit;
    } else if (maxUsers !== undefined) {
        updateData.maxUsers = maxUsers ? parseInt(maxUsers) : null;
        updateData.usageLimit = updateData.maxUsers;
    }

    if (perUserLimit !== undefined) {
        updateData.perUserLimit = perUserLimit ? parseInt(perUserLimit) : 1;
        updateData.maxUsagesPerUser = updateData.perUserLimit;
    } else if (maxUsagesPerUser !== undefined) {
        updateData.maxUsagesPerUser = maxUsagesPerUser ? parseInt(maxUsagesPerUser) : 1;
        updateData.perUserLimit = updateData.maxUsagesPerUser;
    }

    if (noExpiry !== undefined) {
        updateData.noExpiry = Boolean(noExpiry);
        if (updateData.noExpiry) {
            updateData.validUntil = null;
        }
    }

    if (validUntil !== undefined) {
        updateData.validUntil = validUntil ? new Date(validUntil) : null;
        if (updateData.validUntil) updateData.noExpiry = false;
    } else if (expiryDate !== undefined && expiryDate !== "Runs indefinitely") {
        const d = new Date(expiryDate);
        if (!isNaN(d.getTime())) {
            updateData.validUntil = d;
            updateData.noExpiry = false;
        }
    }

    if (validFrom !== undefined) {
        updateData.validFrom = validFrom ? new Date(validFrom) : new Date();
    } else if (startDate !== undefined && startDate !== "Today (Immediately)") {
        const d = new Date(startDate);
        if (!isNaN(d.getTime())) updateData.validFrom = d;
    }

    if (isActive !== undefined) {
        updateData.isActive = isActive;
    }
    if (status !== undefined) {
        if (status === "Expired") {
            updateData.isActive = false;
        } else if (status === "Active") {
            updateData.isActive = true;
            updateData.approvalStatus = "APPROVED";
        } else if (status === "Pending") {
            updateData.approvalStatus = "PENDING_APPROVAL";
        }
    }

    const updatedCoupon = await prisma.coupon.update({
        where: { id: couponId },
        data: updateData
    });

    return updatedCoupon;
};

export const deleteCoupon = async (couponId: string) => {
    const session = await getAuthSession();
    if (!session || !session.user || !["SUPERADMIN", "AGENT", "SELLER"].includes(session.user.role)) {
        throw new ApiError("Unauthorized", 401);
    }

    const existingCoupon = await prisma.coupon.findUnique({
        where: { id: couponId }
    });

    if (!existingCoupon) {
        throw new ApiError("Coupon not found", 404);
    }

    const role = session.user.role;

    if (role === "SELLER") {
        const sellerProfile = await prisma.sellerProfile.findUnique({
            where: { userId: session.user.id }
        });
        if (!sellerProfile || (existingCoupon as any).appliesToSellerId !== sellerProfile.id) {
            throw new ApiError("Forbidden: Cannot delete this coupon", 403);
        }
    } else if (role === "AGENT") {
        const agentProfile = await prisma.agentProfile.findUnique({
            where: { userId: session.user.id }
        });
        if (!agentProfile || !agentProfile.canManageOffers) {
            throw new ApiError("You do not have permission to manage offers", 403);
        }
    }

    await prisma.coupon.delete({
        where: { id: couponId }
    });

    return null;
};
