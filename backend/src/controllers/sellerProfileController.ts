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

    const contentType = req.headers.get("content-type") || "";
    let name: string | undefined;
    let phone: string | undefined;
    let businessName: string | undefined;
    let city: string | undefined;
    let pincode: string | undefined;
    let infoAddress: string | undefined;
    let upiId: string | undefined;
    let bannerImageFile: File | null = null;

    if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData();
        name = (formData.get("name") as string) || (formData.get("ownerName") as string);
        phone = (formData.get("phone") as string) || (formData.get("mobileNumber") as string);
        businessName = (formData.get("businessName") as string) || (formData.get("outletName") as string);
        city = formData.get("city") as string;
        pincode = formData.get("pincode") as string;
        infoAddress = (formData.get("infoAddress") as string) || (formData.get("registeredAddress") as string);
        upiId = formData.get("upiId") as string;
        bannerImageFile = formData.get("bannerImageFile") as File | null;
    } else {
        const body = await req.json();
        name = body.name || body.ownerName;
        phone = body.phone || body.mobileNumber;
        businessName = body.businessName || body.outletName;
        city = body.city;
        pincode = body.pincode;
        infoAddress = body.infoAddress || body.registeredAddress;
        upiId = body.upiId;
    }

    const userDataToUpdate: any = {};
    if (name) userDataToUpdate.name = name;
    if (phone) userDataToUpdate.phone = phone;
    if (city) userDataToUpdate.city = city;
    if (pincode) userDataToUpdate.pincode = pincode;

    if (Object.keys(userDataToUpdate).length > 0) {
        await db.user.update({
            where: { id: session.user.id },
            data: userDataToUpdate
        });
    }

    const profileUpdateData: any = {};
    if (businessName) profileUpdateData.businessName = businessName;
    if (infoAddress) profileUpdateData.addressLocality = infoAddress;
    if (upiId) profileUpdateData.upiId = upiId;

    if (bannerImageFile && bannerImageFile.size > 0) {
        const bytes = await bannerImageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        profileUpdateData.bannerImageUrl = await uploadImage(buffer, bannerImageFile.type, bannerImageFile.name, "sellers");
    }

    if (Object.keys(profileUpdateData).length > 0) {
        await db.sellerProfile.update({
            where: { userId: session.user.id },
            data: profileUpdateData
        });
    }

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: { sellerProfile: true }
    });

    return { user, profile: user?.sellerProfile };
};

export const getSellerStatus = async () => {
    const session = await getAuthSession();
    if (!session || !session.user || session.user.role !== "SELLER") {
        throw new ApiError("Unauthorized", 401);
    }

    const profile = await db.sellerProfile.findUnique({
        where: { userId: session.user.id },
        select: { isOnline: true }
    });

    if (!profile) {
        throw new ApiError("Profile not found", 404);
    }

    return { isOnline: profile.isOnline };
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
                    deliveryPincodes: true,
                    openTime: true,
                    closeTime: true,
                    operationalHours: true
                }
            }
        }
    });

    if (!seller) {
        throw new ApiError("Seller not found", 404);
    }

    return seller;
};
