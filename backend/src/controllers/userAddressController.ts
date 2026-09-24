import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";

export const getUserAddresses = async () => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to view saved addresses.", 401);
    }

    const addresses = await db.address.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" }
    });

    return { addresses };
};

export const createAddress = async (req: Request) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to add a delivery address.", 401);
    }

    const { type, houseNumber, street, landmark, pincode, latitude, longitude, isDefault } = await req.json();

    if (!type || !houseNumber || !street || !pincode) {
        throw new ApiError("Type, House Number, Street, and Pincode are required", 400);
    }

    if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
        throw new ApiError("Approximate location pin of the house is compulsory. Please pick a location on the map.", 400);
    }

    const existingAddresses = await db.address.findMany({
        where: { userId: session.user.id }
    });

    if (existingAddresses.length >= 5) {
        throw new ApiError("You can add a maximum of 5 delivery addresses. Please edit or delete an existing address.", 400);
    }

    const normHouse = houseNumber.trim().toLowerCase();
    const normStreet = street.trim().toLowerCase();
    const normPincode = pincode.toString().replace(/\D/g, "");

    const isDuplicate = existingAddresses.some(addr => 
        addr.houseNumber.trim().toLowerCase() === normHouse &&
        addr.street.trim().toLowerCase() === normStreet &&
        addr.pincode.replace(/\D/g, "") === normPincode
    );

    if (isDuplicate) {
        throw new ApiError("This address already exists in your saved addresses. Please enter a different address or edit the existing one.", 400);
    }

    const makeDefault = isDefault || existingAddresses.length === 0;

    if (makeDefault) {
        const [updatedOthers, newAddress] = await db.$transaction([
            db.address.updateMany({
                where: { userId: session.user.id, isDefault: true },
                data: { isDefault: false }
            }),
            db.address.create({
                data: {
                    userId: session.user.id,
                    type,
                    houseNumber,
                    street,
                    landmark,
                    pincode,
                    latitude: parseFloat(latitude),
                    longitude: parseFloat(longitude),
                    isDefault: true
                }
            }),
            db.user.update({
                where: { id: session.user.id },
                data: { pincode }
            })
        ]);
        return { address: newAddress };
    } else {
        const newAddress = await db.address.create({
            data: {
                userId: session.user.id,
                type,
                houseNumber,
                street,
                landmark,
                pincode,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                isDefault: false
            }
        });
        return { address: newAddress };
    }
};

export const updateAddress = async (req: Request, id: string) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to update your delivery address.", 401);
    }

    const { type, houseNumber, street, landmark, pincode, latitude, longitude } = await req.json();

    const existingAddress = await db.address.findUnique({
        where: { id }
    });

    if (!existingAddress || existingAddress.userId !== session.user.id) {
        throw new ApiError("Address not found or you do not have permission to modify it.", 403);
    }

    if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
        throw new ApiError("Approximate location pin of the house is compulsory. Please pick a location on the map.", 400);
    }

    const otherAddresses = await db.address.findMany({
        where: {
            userId: session.user.id,
            id: { not: id }
        }
    });

    const normHouse = houseNumber.trim().toLowerCase();
    const normStreet = street.trim().toLowerCase();
    const normPincode = pincode.toString().replace(/\D/g, "");

    const isDuplicate = otherAddresses.some(addr => 
        addr.houseNumber.trim().toLowerCase() === normHouse &&
        addr.street.trim().toLowerCase() === normStreet &&
        addr.pincode.replace(/\D/g, "") === normPincode
    );

    if (isDuplicate) {
        throw new ApiError("This address already exists in your saved addresses.", 400);
    }

    const updatedAddress = await db.address.update({
        where: { id },
        data: {
            type,
            houseNumber,
            street,
            landmark,
            pincode,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude)
        }
    });

    return { address: updatedAddress };
};

export const deleteAddress = async (id: string) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to delete a delivery address.", 401);
    }

    const existingAddress = await db.address.findUnique({
        where: { id }
    });

    if (!existingAddress || existingAddress.userId !== session.user.id) {
        throw new ApiError("Address not found or you do not have permission to delete it.", 403);
    }

    await db.address.delete({
        where: { id }
    });

    if (existingAddress.isDefault) {
        const remainingAddress = await db.address.findFirst({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' }
        });

        if (remainingAddress) {
            await db.$transaction([
                db.address.update({
                    where: { id: remainingAddress.id },
                    data: { isDefault: true }
                }),
                db.user.update({
                    where: { id: session.user.id },
                    data: { pincode: remainingAddress.pincode }
                })
            ]);
        }
    }

    return null;
};

export const setDefaultAddress = async (id: string) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to set your default address.", 401);
    }

    const addressToMakeDefault = await db.address.findUnique({
        where: { id }
    });

    if (!addressToMakeDefault || addressToMakeDefault.userId !== session.user.id) {
        throw new ApiError("Address not found or you do not have permission to modify it.", 403);
    }

    await db.$transaction([
        db.address.updateMany({
            where: { userId: session.user.id },
            data: { isDefault: false }
        }),
        db.address.update({
            where: { id },
            data: { isDefault: true }
        }),
        db.user.update({
            where: { id: session.user.id },
            data: { pincode: addressToMakeDefault.pincode }
        })
    ]);

    return null;
};
