import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { revalidateTag, revalidatePath } from "next/cache";

export function validateCouponCodeFormat(code: any): string {
    if (!code || typeof code !== "string" || !code.trim()) {
        throw new ApiError("Please enter a valid coupon code.", 400);
    }
    const clean = code.trim().toUpperCase();
    if (clean.length > 20) {
        throw new ApiError("Coupon code cannot exceed 20 characters.", 400);
    }
    if (!/^[A-Z0-9_-]+$/.test(clean)) {
        throw new ApiError("Coupon code can only contain letters, numbers, hyphens, and underscores.", 400);
    }
    return clean;
}


export const getAllCoupons = async () => {
    const session = await getAuthSession();
    if (!session || !session.user) {
        throw new ApiError("Please log in first to view discount coupons.", 401);
    }

    const role = session.user.role;
    let coupons;

    if (role === "SUPERADMIN") {
        coupons = await db.coupon.findMany();
    }
    else if (role === "SELLER") {
        const sellerProfile = await db.sellerProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!sellerProfile) {
            throw new ApiError("Seller profile could not be found.", 404);
        }

        coupons = await db.coupon.findMany({
            where: {
                appliesToSellerId: sellerProfile.id
            }
        });
    } else {
        throw new ApiError("Access denied. You do not have permission to view coupons.", 403);
    }

    return coupons;
};

export const createCoupon = async (req: Request) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to create coupons.", 401);
    }
    if (!["SUPERADMIN", "SELLER"].includes(session.user.role)) {
        throw new ApiError("Access denied. You do not have permission to create coupons.", 403);
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
        category,
        isAutoApply,
        autoApply
    } = body;

    const cleanCode = validateCouponCodeFormat(code);

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

    if (finalDiscountType === "PERCENTAGE") {
        if (finalDiscountPercentage === null || isNaN(finalDiscountPercentage)) {
            throw new ApiError("Please provide a valid discount percentage.", 400);
        }
        if (finalDiscountPercentage < 0) {
            throw new ApiError("Percentage discount cannot be negative.", 400);
        }
        if (finalDiscountPercentage === 0) {
            throw new ApiError("Percentage discount must be greater than 0%.", 400);
        }
        if (finalDiscountPercentage > 100) {
            throw new ApiError("Percentage discount cannot exceed 100%.", 400);
        }
    } else {
        if (finalDiscountAmount === null || isNaN(finalDiscountAmount)) {
            throw new ApiError("Please provide a valid flat discount amount.", 400);
        }
        if (finalDiscountAmount < 0) {
            throw new ApiError("Discount amount cannot be negative.", 400);
        }
        if (finalDiscountAmount === 0) {
            throw new ApiError("Flat discount amount must be greater than 0.", 400);
        }
    }

    const finalMinCart = minOrderAmount !== undefined && minOrderAmount !== null && minOrderAmount !== "" ? parseFloat(minOrderAmount) : (minimumCartValue !== undefined && minimumCartValue !== null && minimumCartValue !== "" ? parseFloat(minimumCartValue) : null);
    if (finalMinCart !== null) {
        if (isNaN(finalMinCart) || finalMinCart < 0) {
            throw new ApiError("Minimum order value cannot be negative.", 400);
        }
    }

    const finalMaxCap = maxDiscountAmount !== undefined && maxDiscountAmount !== null && maxDiscountAmount !== "" ? parseFloat(maxDiscountAmount) : (maxDiscountCap !== undefined && maxDiscountCap !== null && maxDiscountCap !== "" ? parseFloat(maxDiscountCap) : null);
    if (finalMaxCap !== null) {
        if (isNaN(finalMaxCap) || finalMaxCap <= 0) {
            throw new ApiError("Max discount cap must be greater than 0.", 400);
        }
    }

    const finalUsageLimit = usageLimit !== undefined && usageLimit !== null && usageLimit !== "" ? parseInt(usageLimit) : (maxUsers !== undefined && maxUsers !== null && maxUsers !== "" ? parseInt(maxUsers) : null);
    if (finalUsageLimit !== null) {
        if (isNaN(finalUsageLimit) || finalUsageLimit <= 0) {
            throw new ApiError("Usage limit must be a positive number greater than 0.", 400);
        }
    }

    const finalPerUserLimit = perUserLimit !== undefined && perUserLimit !== null && perUserLimit !== "" ? parseInt(perUserLimit) : (maxUsagesPerUser !== undefined && maxUsagesPerUser !== null && maxUsagesPerUser !== "" ? parseInt(maxUsagesPerUser) : 1);
    if (finalPerUserLimit !== null) {
        if (isNaN(finalPerUserLimit) || finalPerUserLimit <= 0) {
            throw new ApiError("Per-user limit must be a positive number greater than 0.", 400);
        }
    }

    const role = session.user.role;
    let finalSellerId = appliesToSellerId;
    const isDraft = status === "Draft" || status === "DRAFT" || body.isActive === false;
    let approvalStatus = isDraft ? "DRAFT" : "APPROVED";

    if (status === "Pending") {
        approvalStatus = "PENDING_APPROVAL";
    }

    if (role === "SELLER") {
        const sellerProfile = await db.sellerProfile.findUnique({
            where: { userId: session.user.id }
        });
        if (!sellerProfile) throw new ApiError("A valid seller profile is required to create seller coupons.", 403);
        finalSellerId = sellerProfile.id;
    }

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
            code: cleanCode,
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
            isActive: !isDraft && status !== "Expired" && status !== "Paused" && status !== "Pending",
            approvalStatus,
            category: category || "BOTH",
            isAutoApply: isAutoApply !== undefined ? Boolean(isAutoApply) : (autoApply !== undefined ? Boolean(autoApply) : false)
        };

        const newCoupon = await db.coupon.create({
            data: couponData
        });

        try {
            revalidateTag("coupons");
            revalidateTag("public-coupons");
            revalidatePath("/api/public/coupons");
            revalidatePath("/api/coupons");
            revalidatePath("/api/seller/dashboard/offers");
        } catch (e) {
            console.error("Revalidate coupons tag error:", e);
        }

        return newCoupon;
    } catch (error: any) {
        if (error.code === 'P2002') {
            throw new ApiError("A coupon with this code already exists. Please choose a different code.", 400);
        }
        throw new ApiError("An error occurred while creating the coupon. Please try again.", 500);
    }
};

export const updateCoupon = async (req: Request, couponId: string) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to update coupons.", 401);
    }
    if (!["SUPERADMIN", "SELLER"].includes(session.user.role)) {
        throw new ApiError("Access denied. You do not have permission to update coupons.", 403);
    }

    const body = await req.json();

    const existingCoupon = await db.coupon.findUnique({
        where: { id: couponId }
    });

    if (!existingCoupon) {
        throw new ApiError("The requested coupon could not be found.", 404);
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
        appliesToProductId,
        isAutoApply,
        autoApply
    } = body;

    if (role === "SELLER") {
        const sellerProfile = await db.sellerProfile.findUnique({
            where: { userId: session.user.id }
        });
        if (!sellerProfile || (existingCoupon as any).appliesToSellerId !== sellerProfile.id) {
            throw new ApiError("Access denied. You cannot modify coupons for another restaurant.", 403);
        }
    }

    let cleanUpdatedCode: string | undefined = undefined;
    if (code !== undefined) {
        cleanUpdatedCode = validateCouponCodeFormat(code);
        if (cleanUpdatedCode !== existingCoupon.code) {
            const codeExists = await db.coupon.findUnique({
                where: { code: cleanUpdatedCode }
            });
            if (codeExists) {
                throw new ApiError("A coupon with this code already exists. Please choose a different code.", 400);
            }
        }
    }

    const updateData: any = {};

    if (cleanUpdatedCode !== undefined) updateData.code = cleanUpdatedCode;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (appliesTo !== undefined) updateData.appliesTo = appliesTo;
    if (appliesToProductId !== undefined) updateData.appliesToProductId = appliesToProductId;
    if (customerEligibility !== undefined) updateData.customerEligibility = customerEligibility;

    // Discount calculations
    let finalType = discountType || existingCoupon.discountType;
    if (discountType !== undefined) updateData.discountType = discountType;

    if (discountValue !== undefined && discountValue !== null && discountValue !== "") {
        const val = parseFloat(discountValue);
        if (isNaN(val)) {
            throw new ApiError("Please provide a valid numeric discount value.", 400);
        }
        if (val < 0) {
            throw new ApiError("Discount value cannot be negative.", 400);
        }
        if (val === 0) {
            throw new ApiError("Discount value must be greater than 0.", 400);
        }
        if (finalType === "PERCENTAGE") {
            if (val > 100) {
                throw new ApiError("Percentage discount cannot exceed 100%.", 400);
            }
            updateData.discountPercentage = val;
            updateData.discountAmount = null;
        } else {
            updateData.discountAmount = val;
            updateData.discountPercentage = null;
        }
    } else {
        if (discountPercentage !== undefined) {
            if (discountPercentage !== null && discountPercentage !== "") {
                const val = parseFloat(discountPercentage);
                if (isNaN(val) || val < 0) throw new ApiError("Percentage discount cannot be negative.", 400);
                if (val === 0) throw new ApiError("Percentage discount must be greater than 0%.", 400);
                if (val > 100) throw new ApiError("Percentage discount cannot exceed 100%.", 400);
                updateData.discountPercentage = val;
            } else {
                updateData.discountPercentage = null;
            }
        }
        if (discountAmount !== undefined) {
            if (discountAmount !== null && discountAmount !== "") {
                const val = parseFloat(discountAmount);
                if (isNaN(val) || val < 0) throw new ApiError("Discount amount cannot be negative.", 400);
                if (val === 0) throw new ApiError("Flat discount amount must be greater than 0.", 400);
                updateData.discountAmount = val;
            } else {
                updateData.discountAmount = null;
            }
        }
    }

    // Min Cart / Max Cap / Limits
    if (minOrderAmount !== undefined) {
        if (minOrderAmount !== null && minOrderAmount !== "") {
            const val = parseFloat(minOrderAmount);
            if (isNaN(val) || val < 0) throw new ApiError("Minimum order value cannot be negative.", 400);
            updateData.minimumCartValue = val;
        } else {
            updateData.minimumCartValue = null;
        }
    } else if (minimumCartValue !== undefined) {
        if (minimumCartValue !== null && minimumCartValue !== "") {
            const val = parseFloat(minimumCartValue);
            if (isNaN(val) || val < 0) throw new ApiError("Minimum order value cannot be negative.", 400);
            updateData.minimumCartValue = val;
        } else {
            updateData.minimumCartValue = null;
        }
    }

    if (maxDiscountAmount !== undefined) {
        if (maxDiscountAmount !== null && maxDiscountAmount !== "") {
            const val = parseFloat(maxDiscountAmount);
            if (isNaN(val) || val <= 0) throw new ApiError("Max discount cap must be greater than 0.", 400);
            updateData.maxDiscountAmount = val;
        } else {
            updateData.maxDiscountAmount = null;
        }
    } else if (maxDiscountCap !== undefined) {
        if (maxDiscountCap !== null && maxDiscountCap !== "") {
            const val = parseFloat(maxDiscountCap);
            if (isNaN(val) || val <= 0) throw new ApiError("Max discount cap must be greater than 0.", 400);
            updateData.maxDiscountAmount = val;
        } else {
            updateData.maxDiscountAmount = null;
        }
    }

    if (usageLimit !== undefined) {
        if (usageLimit !== null && usageLimit !== "") {
            const val = parseInt(usageLimit);
            if (isNaN(val) || val <= 0) throw new ApiError("Usage limit must be a positive number greater than 0.", 400);
            updateData.usageLimit = val;
            updateData.maxUsers = val;
        } else {
            updateData.usageLimit = null;
            updateData.maxUsers = null;
        }
    } else if (maxUsers !== undefined) {
        if (maxUsers !== null && maxUsers !== "") {
            const val = parseInt(maxUsers);
            if (isNaN(val) || val <= 0) throw new ApiError("Usage limit must be a positive number greater than 0.", 400);
            updateData.maxUsers = val;
            updateData.usageLimit = val;
        } else {
            updateData.maxUsers = null;
            updateData.usageLimit = null;
        }
    }

    if (perUserLimit !== undefined) {
        if (perUserLimit !== null && perUserLimit !== "") {
            const val = parseInt(perUserLimit);
            if (isNaN(val) || val <= 0) throw new ApiError("Per-user limit must be a positive number greater than 0.", 400);
            updateData.perUserLimit = val;
            updateData.maxUsagesPerUser = val;
        } else {
            updateData.perUserLimit = 1;
            updateData.maxUsagesPerUser = 1;
        }
    } else if (maxUsagesPerUser !== undefined) {
        if (maxUsagesPerUser !== null && maxUsagesPerUser !== "") {
            const val = parseInt(maxUsagesPerUser);
            if (isNaN(val) || val <= 0) throw new ApiError("Per-user limit must be a positive number greater than 0.", 400);
            updateData.maxUsagesPerUser = val;
            updateData.perUserLimit = val;
        } else {
            updateData.maxUsagesPerUser = 1;
            updateData.perUserLimit = 1;
        }
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
        } else if (status === "Draft" || status === "DRAFT") {
            updateData.isActive = false;
            updateData.approvalStatus = "DRAFT";
        } else if (status === "Active" || status === "LIVE") {
            updateData.isActive = true;
            updateData.approvalStatus = "APPROVED";
        } else if (status === "Pending") {
            updateData.isActive = false;
            updateData.approvalStatus = "PENDING_APPROVAL";
        }
    }

    if (isAutoApply !== undefined) {
        updateData.isAutoApply = Boolean(isAutoApply);
    } else if (autoApply !== undefined) {
        updateData.isAutoApply = Boolean(autoApply);
    }

    const updatedCoupon = await db.coupon.update({
        where: { id: couponId },
        data: updateData
    });

    try {
        revalidateTag("coupons");
        revalidateTag("public-coupons");
        revalidatePath("/api/public/coupons");
        revalidatePath("/api/coupons");
        revalidatePath("/api/seller/dashboard/offers");
    } catch (e) {
        console.error("Revalidate coupons tag error:", e);
    }

    return updatedCoupon;
};

export const deleteCoupon = async (couponId: string) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to delete a coupon.", 401);
    }
    if (!["SUPERADMIN", "SELLER"].includes(session.user.role)) {
        throw new ApiError("Access denied. You do not have permission to delete coupons.", 403);
    }

    const existingCoupon = await db.coupon.findUnique({
        where: { id: couponId }
    });

    if (!existingCoupon) {
        throw new ApiError("The requested coupon could not be found.", 404);
    }

    const role = session.user.role;

    if (role === "SELLER") {
        const sellerProfile = await db.sellerProfile.findUnique({
            where: { userId: session.user.id }
        });
        if (!sellerProfile || (existingCoupon as any).appliesToSellerId !== sellerProfile.id) {
            throw new ApiError("Access denied. You cannot delete coupons for another restaurant.", 403);
        }
    }

    await db.coupon.delete({
        where: { id: couponId }
    });

    try {
        revalidateTag("coupons");
        revalidateTag("public-coupons");
        revalidatePath("/api/public/coupons");
        revalidatePath("/api/coupons");
        revalidatePath("/api/seller/dashboard/offers");
    } catch (e) {
        console.error("Revalidate coupons tag error:", e);
    }

    return null;
};
