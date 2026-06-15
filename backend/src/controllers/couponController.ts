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
                OR: [
                    { appliesToSellerId: null } as any,
                    { appliesToSellerId: sellerProfile.id } as any
                ]
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
        discountPercentage,
        discountAmount,
        appliesToSellerId,
        appliesToProductId,
        validFrom,
        validUntil,
        maxUsagesPerUser,
        maxUsers,
        minimumCartValue,
        category
    } = body;

    if (!code) {
        throw new ApiError("Coupon code is required", 400);
    }
    if (discountPercentage === undefined && discountAmount === undefined) {
        throw new ApiError("Must provide either discountPercentage or discountAmount", 400);
    }

    const role = session.user.role;
    let finalSellerId = appliesToSellerId;
    let approvalStatus = "APPROVED";

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

    try {
        const couponData: any = {
            code: code.toUpperCase(),
            description: description || "",
            discountPercentage: discountPercentage ? parseFloat(discountPercentage) : null,
            discountAmount: discountAmount ? parseFloat(discountAmount) : null,
            creatorId: session.user.id,
            appliesToSellerId: finalSellerId === "GLOBAL" ? null : finalSellerId,
            appliesToProductId: appliesToProductId || null,
            validFrom: validFrom ? new Date(validFrom) : new Date(),
            validUntil: validUntil ? new Date(validUntil) : null,
            maxUsagesPerUser: maxUsagesPerUser ? parseInt(maxUsagesPerUser) : null,
            maxUsers: maxUsers ? parseInt(maxUsers) : null,
            minimumCartValue: minimumCartValue ? parseFloat(minimumCartValue) : null,
            isActive: true,
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
    const { isActive, description, validUntil, discountPercentage, discountAmount, appliesToProductId, maxUsagesPerUser, maxUsers, minimumCartValue } = body;

    if (role === "SELLER") {
        const sellerProfile = await prisma.sellerProfile.findUnique({
            where: { userId: session.user.id }
        });
        if (!sellerProfile || (existingCoupon as any).appliesToSellerId !== sellerProfile.id) {
            throw new ApiError("Forbidden: Cannot modify this coupon", 403);
        }
    }

    const updateData: any = {
        description: description !== undefined ? description : (existingCoupon as any).description,
        isActive: isActive !== undefined ? isActive : (existingCoupon as any).isActive,
        validUntil: validUntil !== undefined ? (validUntil ? new Date(validUntil) : null) : (existingCoupon as any).validUntil,
        discountPercentage: discountPercentage !== undefined ? (discountPercentage ? parseFloat(discountPercentage) : null) : (existingCoupon as any).discountPercentage,
        discountAmount: discountAmount !== undefined ? (discountAmount ? parseFloat(discountAmount) : null) : (existingCoupon as any).discountAmount,
        appliesToProductId: appliesToProductId !== undefined ? appliesToProductId : (existingCoupon as any).appliesToProductId,
        maxUsagesPerUser: maxUsagesPerUser !== undefined ? (maxUsagesPerUser ? parseInt(maxUsagesPerUser) : null) : (existingCoupon as any).maxUsagesPerUser,
        maxUsers: maxUsers !== undefined ? (maxUsers ? parseInt(maxUsers) : null) : (existingCoupon as any).maxUsers,
        minimumCartValue: minimumCartValue !== undefined ? (minimumCartValue ? parseFloat(minimumCartValue) : null) : (existingCoupon as any).minimumCartValue
    };

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
    }

    await prisma.coupon.delete({
        where: { id: couponId }
    });

    return null;
};
