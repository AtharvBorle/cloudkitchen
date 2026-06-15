import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { uploadImage } from "@/lib/upload";

export const getSellerProfile = async () => {
    const session = await getAuthSession();

    if (!session || !session.user || session.user.role !== "SELLER") {
        throw new ApiError("Unauthorized", 401);
    }

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: { sellerProfile: true }
    });

    if (!user || !user.sellerProfile) {
        throw new ApiError("Profile not found", 404);
    }

    return {
        user: user,
        profile: user.sellerProfile
    };
};

export const updateSellerProfile = async (req: Request) => {
    const session = await getAuthSession();

    if (!session || !session.user || session.user.role !== "SELLER") {
        throw new ApiError("Unauthorized", 401);
    }

    const formData = await req.formData();

    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const businessName = formData.get("businessName") as string;
    const city = formData.get("city") as string;
    const pincode = formData.get("pincode") as string;
    const infoAddress = formData.get("infoAddress") as string;
    const upiId = formData.get("upiId") as string;
    const bannerImageFile = formData.get("bannerImageFile") as File | null;

    await db.user.update({
        where: { id: session.user.id },
        data: {
            name: name || undefined,
            phone: phone || undefined,
            city: city || undefined,
            pincode: pincode || undefined
        }
    });

    const profileUpdateData: any = {
        businessName: businessName || undefined,
        addressLocality: infoAddress || undefined, // Map the old infoAddress to locality for now
        upiId: upiId || undefined,
    };

    if (bannerImageFile && bannerImageFile.size > 0) {
        const bytes = await bannerImageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        profileUpdateData.bannerImageUrl = await uploadImage(buffer, bannerImageFile.type, bannerImageFile.name, "sellers");
    }

    const updatedProfile = await db.sellerProfile.update({
        where: { userId: session.user.id },
        data: profileUpdateData
    });

    return { profile: updatedProfile };
};

export const updateSellerStatus = async (req: Request) => {
    const session = await getAuthSession();
    if (!session || !session.user || session.user.role !== "SELLER") {
        throw new ApiError("Unauthorized", 401);
    }

    const body = await req.json();
    const { isOnline } = body;

    if (typeof isOnline !== 'boolean') {
        throw new ApiError("Invalid status value", 400);
    }

    const updatedProfile = await db.sellerProfile.update({
        where: { userId: session.user.id },
        data: { isOnline }
    });

    return { isOnline: updatedProfile.isOnline };
};

export const getSellerById = async (id: string) => {
    if (!id) {
        throw new ApiError("Seller ID is required", 400);
    }

    const seller = await db.sellerProfile.findUnique({
        where: { id: id },
        include: {
            user: {
                select: {
                    pincode: true
                }
            },
            foodItems: {
                where: { isAvailable: true },
                select: {
                    id: true,
                    name: true,
                    deliveryPincodes: true
                }
            }
        }
    });

    if (!seller) {
        throw new ApiError("Seller not found", 404);
    }

    return seller;
};
