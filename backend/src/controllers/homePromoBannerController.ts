import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { uploadImage } from "@/lib/upload";

/**
 * Public: Get all active home promo banners
 */
export const getPublicHomeBanners = async () => {
    const banners = await (db as any).homePromoBanner.findMany({
        where: { isActive: true },
        orderBy: [
            { displayOrder: "asc" },
            { createdAt: "desc" }
        ]
    });
    return { banners };
};

/**
 * SuperAdmin: Get all home promo banners (active & inactive)
 */
export const getSuperadminHomeBanners = async () => {
    const session = await getAuthSession();
    if (!session?.user || (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN")) {
        throw new ApiError("Unauthorized", 401);
    }

    const banners = await (db as any).homePromoBanner.findMany({
        orderBy: [
            { displayOrder: "asc" },
            { createdAt: "desc" }
        ]
    });
    return { banners };
};

/**
 * SuperAdmin: Create a new home promo banner with desktop & mobile images
 */
export const createHomeBanner = async (req: Request) => {
    const session = await getAuthSession();
    if (!session?.user || (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN")) {
        throw new ApiError("Unauthorized", 401);
    }

    const formData = await req.formData();
    const title = formData.get("title") as string;
    const redirectUrl = formData.get("redirectUrl") as string | null;
    const desktopImageFile = formData.get("desktopImage") as File | null;
    const mobileImageFile = formData.get("mobileImage") as File | null;
    const isActiveStr = formData.get("isActive") as string | null;
    const displayOrderStr = formData.get("displayOrder") as string | null;

    if (!title || !title.trim()) {
        throw new ApiError("Banner title / campaign name is required", 400);
    }

    if (!desktopImageFile || !(desktopImageFile instanceof File)) {
        throw new ApiError("Desktop banner image is required", 400);
    }

    // Upload desktop image to Cloudinary
    const desktopBuffer = Buffer.from(await desktopImageFile.arrayBuffer());
    const desktopImageUrl = await uploadImage(
        desktopBuffer,
        desktopImageFile.type,
        desktopImageFile.name,
        "banners"
    );

    // Upload mobile image if provided
    let mobileImageUrl: string | null = null;
    if (mobileImageFile && mobileImageFile instanceof File && mobileImageFile.size > 0) {
        const mobileBuffer = Buffer.from(await mobileImageFile.arrayBuffer());
        mobileImageUrl = await uploadImage(
            mobileBuffer,
            mobileImageFile.type,
            mobileImageFile.name,
            "banners"
        );
    }

    const isActive = isActiveStr === "false" ? false : true;
    const displayOrder = displayOrderStr ? parseInt(displayOrderStr, 10) || 0 : 0;

    const newBanner = await (db as any).homePromoBanner.create({
        data: {
            title: title.trim(),
            desktopImageUrl,
            mobileImageUrl,
            redirectUrl: redirectUrl && redirectUrl.trim() ? redirectUrl.trim() : "/explore-desktop",
            isActive,
            displayOrder
        }
    });

    return { banner: newBanner };
};

/**
 * SuperAdmin: Update home promo banner
 */
export const updateHomeBanner = async (req: Request, id: string) => {
    const session = await getAuthSession();
    if (!session?.user || (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN")) {
        throw new ApiError("Unauthorized", 401);
    }

    const existingBanner = await (db as any).homePromoBanner.findUnique({
        where: { id }
    });

    if (!existingBanner) {
        throw new ApiError("Banner not found", 404);
    }

    const contentType = req.headers.get("content-type") || "";
    let dataToUpdate: any = {};

    if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData();
        const title = formData.get("title") as string | null;
        const redirectUrl = formData.get("redirectUrl") as string | null;
        const desktopImageFile = formData.get("desktopImage") as File | null;
        const mobileImageFile = formData.get("mobileImage") as File | null;
        const isActiveStr = formData.get("isActive") as string | null;
        const displayOrderStr = formData.get("displayOrder") as string | null;

        if (title && title.trim()) dataToUpdate.title = title.trim();
        if (redirectUrl !== null) {
            dataToUpdate.redirectUrl = redirectUrl.trim() || "/explore-desktop";
        }
        if (isActiveStr !== null) {
            dataToUpdate.isActive = isActiveStr === "true";
        }
        if (displayOrderStr !== null) {
            dataToUpdate.displayOrder = parseInt(displayOrderStr, 10) || 0;
        }

        if (desktopImageFile && desktopImageFile instanceof File && desktopImageFile.size > 0) {
            const desktopBuffer = Buffer.from(await desktopImageFile.arrayBuffer());
            dataToUpdate.desktopImageUrl = await uploadImage(
                desktopBuffer,
                desktopImageFile.type,
                desktopImageFile.name,
                "banners"
            );
        }

        if (mobileImageFile && mobileImageFile instanceof File && mobileImageFile.size > 0) {
            const mobileBuffer = Buffer.from(await mobileImageFile.arrayBuffer());
            dataToUpdate.mobileImageUrl = await uploadImage(
                mobileBuffer,
                mobileImageFile.type,
                mobileImageFile.name,
                "banners"
            );
        }
    } else {
        const body = await req.json().catch(() => ({}));
        if (body.title) dataToUpdate.title = body.title.trim();
        if (body.redirectUrl !== undefined) dataToUpdate.redirectUrl = body.redirectUrl;
        if (body.isActive !== undefined) dataToUpdate.isActive = !!body.isActive;
        if (body.displayOrder !== undefined) dataToUpdate.displayOrder = parseInt(body.displayOrder, 10) || 0;
    }

    const updatedBanner = await (db as any).homePromoBanner.update({
        where: { id },
        data: dataToUpdate
    });

    return { banner: updatedBanner };
};

/**
 * SuperAdmin: Delete home promo banner
 */
export const deleteHomeBanner = async (id: string) => {
    const session = await getAuthSession();
    if (!session?.user || (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN")) {
        throw new ApiError("Unauthorized", 401);
    }

    await (db as any).homePromoBanner.delete({
        where: { id }
    });

    return { success: true };
};
