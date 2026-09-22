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
        include: {
            sellerProfile: {
                include: {
                    subscriptions: {
                        include: {
                            plan: true
                        },
                        orderBy: {
                            createdAt: "desc"
                        }
                    }
                }
            }
        }
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
    let email: string | undefined;
    let businessName: string | undefined;
    let city: string | undefined;
    let pincode: string | undefined;
    let infoAddress: string | undefined;
    let upiId: string | undefined;
    let latitude: number | undefined;
    let longitude: number | undefined;
    let isLocationPinned: boolean | undefined;
    let bannerImageFile: File | null = null;

    if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData();
        name = (formData.get("name") as string) || (formData.get("ownerName") as string) || (formData.get("userFullName") as string);
        phone = (formData.get("phone") as string) || (formData.get("mobileNumber") as string) || (formData.get("phoneNumber") as string);
        email = (formData.get("email") as string) || (formData.get("businessEmail") as string) || (formData.get("primaryEmail") as string);
        businessName = (formData.get("businessName") as string) || (formData.get("outletName") as string);
        city = formData.get("city") as string;
        pincode = formData.get("pincode") as string;
        infoAddress = (formData.get("infoAddress") as string) || (formData.get("registeredAddress") as string) || (formData.get("address") as string) || (formData.get("addressLocality") as string);
        upiId = formData.get("upiId") as string;
        const rawLat = formData.get("latitude") || formData.get("lat");
        const rawLng = formData.get("longitude") || formData.get("lng");
        const rawPinned = formData.get("isLocationPinned");
        if (rawLat && rawLat !== "") latitude = parseFloat(rawLat as string);
        if (rawLng && rawLng !== "") longitude = parseFloat(rawLng as string);
        if (rawPinned !== null && rawPinned !== undefined) isLocationPinned = rawPinned === "true" || rawPinned === "1";
        bannerImageFile = formData.get("bannerImageFile") as File | null;
    } else {
        const body = await req.json();
        name = body.name || body.ownerName || body.userFullName;
        phone = body.phone || body.mobileNumber || body.phoneNumber;
        email = body.email || body.businessEmail || body.primaryEmail;
        businessName = body.businessName || body.outletName;
        city = body.city;
        pincode = body.pincode;
        infoAddress = body.infoAddress || body.registeredAddress || body.address || body.addressLocality;
        upiId = body.upiId;
        if (body.latitude !== undefined && body.latitude !== null && body.latitude !== "") {
            latitude = parseFloat(body.latitude);
        } else if (body.lat !== undefined && body.lat !== null && body.lat !== "") {
            latitude = parseFloat(body.lat);
        }
        if (body.longitude !== undefined && body.longitude !== null && body.longitude !== "") {
            longitude = parseFloat(body.longitude);
        } else if (body.lng !== undefined && body.lng !== null && body.lng !== "") {
            longitude = parseFloat(body.lng);
        }
        if (body.isLocationPinned !== undefined) {
            isLocationPinned = Boolean(body.isLocationPinned);
        }
    }

    const userDataToUpdate: any = {};
    if (name && typeof name === "string" && name.trim()) {
        userDataToUpdate.name = name.trim();
    }
    if (phone && typeof phone === "string" && phone.trim()) {
        userDataToUpdate.phone = phone.trim();
    }
    if (email && typeof email === "string" && email.trim()) {
        const cleanEmail = email.trim().toLowerCase();
        const existingUser = await db.user.findFirst({
            where: {
                email: cleanEmail,
                NOT: { id: session.user.id }
            }
        });
        if (existingUser) {
            throw new ApiError("Email is already in use by another account", 400);
        }
        userDataToUpdate.email = cleanEmail;
    }
    if (city !== undefined && typeof city === "string") {
        userDataToUpdate.city = city.trim();
    }
    if (pincode !== undefined && typeof pincode === "string") {
        userDataToUpdate.pincode = pincode.trim();
    }

    if (Object.keys(userDataToUpdate).length > 0) {
        await db.user.update({
            where: { id: session.user.id },
            data: userDataToUpdate
        });
    }

    const profileUpdateData: any = {};
    if (businessName !== undefined && typeof businessName === "string" && businessName.trim()) {
        profileUpdateData.businessName = businessName.trim();
    }
    if (infoAddress !== undefined && typeof infoAddress === "string") {
        profileUpdateData.addressLocality = infoAddress.trim();
    }
    if (upiId !== undefined) {
        profileUpdateData.upiId = upiId ? (typeof upiId === "string" ? upiId.trim() : null) : null;
    }
    if (latitude !== undefined && !isNaN(latitude)) profileUpdateData.latitude = latitude;
    if (longitude !== undefined && !isNaN(longitude)) profileUpdateData.longitude = longitude;
    if (isLocationPinned !== undefined) profileUpdateData.isLocationPinned = isLocationPinned;

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
        include: {
            sellerProfile: {
                include: {
                    subscriptions: {
                        include: {
                            plan: true
                        },
                        orderBy: {
                            createdAt: "desc"
                        }
                    }
                }
            }
        }
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
