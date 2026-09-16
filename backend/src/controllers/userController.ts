import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import bcrypt from "bcryptjs";

export const getUserProfile = async () => {
    const session = await getAuthSession();
    if (!session || !session.user) {
        throw new ApiError("Unauthorized", 401);
    }

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            city: true,
            pincode: true,
            role: true,
            addresses: {
                orderBy: {
                    createdAt: "desc"
                }
            }
        }
    });

    if (!user) {
        throw new ApiError("User not found", 404);
    }

    return user;
};

export const updateUserProfile = async (req: Request) => {
    const session = await getAuthSession();
    if (!session || !session.user) {
        throw new ApiError("Unauthorized", 401);
    }

    const body = await req.json();
    const dataToUpdate: any = {};

    if (body.name && typeof body.name === "string") dataToUpdate.name = body.name.trim();
    
    if (body.phone !== undefined) {
        const rawPhone = String(body.phone).trim();
        const digitsOnly = rawPhone.replace(/\D/g, "");
        if (rawPhone !== "" && digitsOnly.length !== 10) {
            throw new ApiError("Please provide a valid 10-digit phone number", 400);
        }
        dataToUpdate.phone = digitsOnly;
    }

    if (body.city !== undefined && typeof body.city === "string") dataToUpdate.city = body.city.trim();
    if (body.pincode !== undefined && typeof body.pincode === "string") {
        const rawPincode = body.pincode.trim();
        if (rawPincode !== "" && rawPincode.length !== 6) {
            throw new ApiError("Pincode must be exactly 6 digits", 400);
        }
        dataToUpdate.pincode = rawPincode;
    }

    // Password Update & Validation
    if (body.newPassword) {
        if (typeof body.newPassword !== "string" || body.newPassword.length < 6) {
            throw new ApiError("New password must be at least 6 characters long", 400);
        }
        if (!body.currentPassword) {
            throw new ApiError("Current password is required to set a new password", 400);
        }

        const currentUser = await db.user.findUnique({
            where: { id: session.user.id },
        });

        if (currentUser?.passwordHash) {
            const isMatch = await bcrypt.compare(body.currentPassword, currentUser.passwordHash);
            if (!isMatch) {
                throw new ApiError("Current password is incorrect", 400);
            }
        }

        dataToUpdate.passwordHash = await bcrypt.hash(body.newPassword, 10);
    }

    if (Object.keys(dataToUpdate).length === 0) {
        throw new ApiError("No valid fields provided to update", 400);
    }

    const updatedUser = await db.user.update({
        where: { id: session.user.id },
        data: dataToUpdate,
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            city: true,
            pincode: true,
            role: true,
        }
    });

    return { user: updatedUser };
};

export const getUserDashboard = async () => {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== "USER") {
        throw new ApiError("Unauthorized", 401);
    }

    const currentUser = await db.user.findUnique({
        where: { id: session.user.id }
    });

    const foodCategories = await db.foodCategory.findMany({
        orderBy: { name: 'asc' }
    });

    const userPincode = currentUser?.pincode ? currentUser.pincode.trim() : null;
    if (!userPincode) {
        return {
            foodItems: [],
            availableRooms: [],
            userPincode: null,
            foodCategories
        };
    }

    const sellers = await db.sellerProfile.findMany({
        where: {
            verificationStatus: "APPROVED",
            user: { isActive: true },
            OR: [
                { user: { pincode: userPincode } },
                { foodItems: { some: { deliveryPincodes: { contains: userPincode } } } }
            ]
        },
        include: {
            user: { select: { name: true, city: true, pincode: true, phone: true } },
            foodItems: {
                where: { isAvailable: true },
                include: {
                    category: true,
                    foodCategory: true
                }
            },
            rooms: { where: { isAvailable: true } },
            subscriptions: {
                where: { status: "ACTIVE" },
                include: { plan: true }
            }
        }
    });

    const now = new Date();

    const foodItems = sellers.flatMap(seller => {
        const hasActiveFoodSub = seller.subscriptions.some(sub => 
            sub.status === "ACTIVE" && 
            (sub.validUntil === null || new Date(sub.validUntil) > now) &&
            (sub.plan?.category === "FOOD" || sub.plan?.category === "BOTH")
        );
        if (!hasActiveFoodSub) return [];

        return seller.foodItems
            .filter(item => {
                if (item.deliveryPincodes) {
                    const pins = item.deliveryPincodes.split(",").map(p => p.trim());
                    return pins.includes(userPincode);
                }
                return seller.user.pincode === userPincode;
            })
            .map(item => ({
                ...item,
                sellerName: seller.businessName || seller.user.name,
                sellerCity: seller.user.city,
                sellerPincode: seller.user.pincode,
                sellerLocality: seller.addressLocality,
                sellerLandmark: seller.addressLandmark,
                sellerTrackingId: seller.trackingId,
                sellerIsOnline: seller.isOnline,
                sellerFoodType: seller.foodType
            }));
    });

    const availableRooms = sellers.flatMap(seller => {
        const hasActivePropertySub = seller.subscriptions.some(sub => 
            sub.status === "ACTIVE" && 
            (sub.validUntil === null || new Date(sub.validUntil) > now) &&
            (sub.plan?.category === "PROPERTY" || sub.plan?.category === "BOTH")
        );
        if (!hasActivePropertySub) return [];

        return seller.rooms
            .filter(room => seller.user.pincode === userPincode)
            .map(room => ({
                ...room,
                sellerName: seller.businessName || seller.user.name,
                sellerCity: seller.user.city,
                sellerPincode: seller.user.pincode,
                sellerLocality: seller.addressLocality,
                sellerLandmark: seller.addressLandmark,
                sellerTrackingId: seller.trackingId,
                sellerIsOnline: seller.isOnline
            }));
    });

    return {
        foodItems,
        availableRooms,
        userPincode,
        foodCategories
    };
};

export const updateUserLocation = async (req: Request) => {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== "USER") {
        throw new ApiError("Unauthorized", 401);
    }

    const { pincode: clientPincode, lat, lng } = await req.json();
    let finalPincode = clientPincode;

    if (!finalPincode && lat && lng) {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (apiKey) {
            try {
                const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`);
                const data = await response.json();

                if (data.status === "OK" && data.results.length > 0) {
                    for (let i = 0; i < data.results.length; i++) {
                        const result = data.results[i];
                        for (let j = 0; j < result.address_components.length; j++) {
                            const component = result.address_components[j];
                            if (component.types.includes("postal_code")) {
                                finalPincode = component.long_name;
                                break;
                            }
                        }
                        if (finalPincode) break;
                    }
                }
            } catch (e: any) {
                console.error("Backend geocoding request crashed:", e);
            }
        }
    }

    if (!finalPincode) {
        throw new ApiError("Pincode or coordinates required", 400);
    }

    const currentUser = await db.user.findUnique({
        where: { id: session.user.id }
    });

    let wasUpdated = false;
    if (currentUser) {
        await db.$transaction([
            db.user.update({
                where: { id: session.user.id },
                data: { pincode: finalPincode }
            }),
            db.address.updateMany({
                where: { userId: session.user.id },
                data: { isDefault: false }
            })
        ]);
        wasUpdated = true;
    }

    return { pincode: finalPincode, updated: wasUpdated };
};
