import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { uploadImage } from "@/lib/upload";
import { getCategoryExpiries } from "@/lib/subscription";

const checkPropertyCategoryActive = async (userId: string) => {
    const sellerProfile = await db.sellerProfile.findUnique({
        where: { userId }
    });

    if (!sellerProfile) {
        throw new ApiError("Seller profile not found", 404);
    }

    const activeSubs = await db.subscription.findMany({
        where: {
            sellerId: sellerProfile.id,
            status: "ACTIVE",
            validUntil: {
                gt: new Date()
            }
        },
        include: {
            plan: true
        }
    });

    const { propertyExpiry } = getCategoryExpiries(activeSubs);
    const isPropertyActive = (propertyExpiry ? propertyExpiry > new Date() : false) && sellerProfile.propertyVerificationStatus === "APPROVED";

    if (!isPropertyActive && sellerProfile.verificationStatus !== "APPROVED") {
        throw new ApiError("Property subscription not active or approved", 403);
    }

    return sellerProfile;
};

export function parseRoomDescription(descRaw?: string | null): {
    about: string;
    amenities: string[];
    houseRules: string[];
} {
    if (!descRaw || !descRaw.trim()) {
        return { about: "", amenities: [], houseRules: [] };
    }

    try {
        const parsed = JSON.parse(descRaw);
        if (typeof parsed === "object" && parsed !== null) {
            let amenities: string[] = [];
            if (Array.isArray(parsed.amenities)) {
                amenities = parsed.amenities.map(String).map(s => s.trim()).filter(Boolean);
            } else if (typeof parsed.amenities === "string" && parsed.amenities.trim()) {
                amenities = parsed.amenities.split(",").map((s: string) => s.trim()).filter(Boolean);
            }

            let houseRules: string[] = [];
            if (Array.isArray(parsed.houseRules)) {
                houseRules = parsed.houseRules.map(String).map(s => s.trim()).filter(Boolean);
            } else if (typeof parsed.houseRules === "string" && parsed.houseRules.trim()) {
                if (parsed.houseRules.includes("\n")) {
                    houseRules = parsed.houseRules.split("\n").map((s: string) => s.trim()).filter(Boolean);
                } else {
                    houseRules = parsed.houseRules.split(",").map((s: string) => s.trim()).filter(Boolean);
                }
            }

            return {
                about: typeof parsed.about === "string" ? parsed.about : (typeof parsed.description === "string" ? parsed.description : ""),
                amenities,
                houseRules,
            };
        }
    } catch {
        // Not JSON
    }

    let about = descRaw;
    let amenities: string[] = [];
    let houseRules: string[] = [];

    const amenitiesMatch = descRaw.match(/Amenities:\s*([^\n]+)/i);
    if (amenitiesMatch) {
        amenities = amenitiesMatch[1].split(",").map(s => s.trim()).filter(Boolean);
        about = about.replace(amenitiesMatch[0], "").trim();
    }

    const houseRulesMatch = descRaw.match(/House Rules:\s*([^\n]+)/i);
    if (houseRulesMatch) {
        houseRules = houseRulesMatch[1].split(",").map(s => s.trim()).filter(Boolean);
        about = about.replace(houseRulesMatch[0], "").trim();
    }

    return { about, amenities, houseRules };
}

export function formatRoomDescription(about?: string | null, amenities?: any, houseRules?: any): string {
    let parsedAmenities: string[] = [];
    if (Array.isArray(amenities)) {
        parsedAmenities = amenities.map(String).map(s => s.trim()).filter(Boolean);
    } else if (typeof amenities === "string" && amenities.trim()) {
        try {
            const arr = JSON.parse(amenities);
            if (Array.isArray(arr)) parsedAmenities = arr.map(String).map(s => s.trim()).filter(Boolean);
            else parsedAmenities = amenities.split(",").map(s => s.trim()).filter(Boolean);
        } catch {
            parsedAmenities = amenities.split(",").map(s => s.trim()).filter(Boolean);
        }
    }

    let parsedHouseRules: string[] = [];
    if (Array.isArray(houseRules)) {
        parsedHouseRules = houseRules.map(String).map(s => s.trim()).filter(Boolean);
    } else if (typeof houseRules === "string" && houseRules.trim()) {
        try {
            const arr = JSON.parse(houseRules);
            if (Array.isArray(arr)) parsedHouseRules = arr.map(String).map(s => s.trim()).filter(Boolean);
            else if (houseRules.includes("\n")) parsedHouseRules = houseRules.split("\n").map(s => s.trim()).filter(Boolean);
            else parsedHouseRules = houseRules.split(",").map(s => s.trim()).filter(Boolean);
        } catch {
            if (houseRules.includes("\n")) parsedHouseRules = houseRules.split("\n").map(s => s.trim()).filter(Boolean);
            else parsedHouseRules = houseRules.split(",").map(s => s.trim()).filter(Boolean);
        }
    }

    return JSON.stringify({
        about: (about || "").trim(),
        amenities: parsedAmenities,
        houseRules: parsedHouseRules,
    });
}

export const createSellerRoom = async (req: Request) => {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== "SELLER") {
        throw new ApiError("Unauthorized", 401);
    }

    const sellerProfile = await checkPropertyCategoryActive(session.user.id);

    const formData = await req.formData();
    const title = formData.get("title") as string;
    const price = parseFloat(formData.get("price") as string);
    const description = formData.get("description") as string;
    const about = (formData.get("about") as string) || description;
    const amenities = formData.get("amenities") as string;
    const houseRules = formData.get("houseRules") as string;
    const capacity = parseInt(formData.get("capacity") as string) || 1;
    const isAvailableField = formData.get("isAvailable");
    const isAvailable = isAvailableField !== null ? isAvailableField === "true" : true;
    const imageFile = formData.get("image") as File | null;
    const imageUrlField = formData.get("imageUrl") as string | null;

    if (!title || isNaN(price)) {
        throw new ApiError("Title and Price are required", 400);
    }

    let imageUrl = imageUrlField || "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80";
    if (imageFile && imageFile.size > 0) {
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        imageUrl = await uploadImage(buffer, imageFile.type, imageFile.name, "rooms");
    }

    const imagesArray = [imageUrl];
    const encodedDescription = formatRoomDescription(about, amenities, houseRules);

    const room = await db.room.create({
        data: {
            sellerId: sellerProfile.id,
            title,
            price,
            description: encodedDescription,
            capacity,
            images: JSON.stringify(imagesArray),
            isAvailable,
        }
    });

    const parsed = parseRoomDescription(room.description);
    return { room: { ...room, ...parsed } };
};

export const deleteSellerRoom = async (req: Request) => {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== "SELLER") {
        throw new ApiError("Unauthorized", 401);
    }

    const sellerProfile = await checkPropertyCategoryActive(session.user.id);
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("id");

    if (!roomId) {
        throw new ApiError("Room ID is required", 400);
    }

    const existingRoom = await db.room.findUnique({
        where: { id: roomId, sellerId: sellerProfile.id }
    });

    if (!existingRoom) {
        throw new ApiError("Room not found or unauthorized", 404);
    }

    await db.room.delete({
        where: { id: roomId }
    });

    return { success: true, message: "Room deleted successfully" };
};

export const getSellerRooms = async () => {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== "SELLER") {
        throw new ApiError("Unauthorized", 401);
    }

    const sellerProfile = await checkPropertyCategoryActive(session.user.id);

    const rooms = await db.room.findMany({
        where: { sellerId: sellerProfile.id },
        orderBy: { title: 'asc' }
    });

    const roomIds = rooms.map(r => r.id);

    const bookings = await db.booking.findMany({
        where: { roomId: { in: roomIds } },
        include: {
            user: { select: { name: true, phone: true, email: true } },
            room: { select: { title: true, price: true, images: true, capacity: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    const formattedRooms = rooms.map(r => {
        const parsed = parseRoomDescription(r.description);
        return {
            ...r,
            ...parsed,
        };
    });

    return { rooms: formattedRooms, bookings };
};

export const getSellerBookings = async () => {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== "SELLER") {
        throw new ApiError("Unauthorized", 401);
    }

    const sellerProfile = await checkPropertyCategoryActive(session.user.id);

    const rooms = await db.room.findMany({
        where: { sellerId: sellerProfile.id },
        select: { id: true }
    });

    const roomIds = rooms.map(r => r.id);

    const bookings = await db.booking.findMany({
        where: { roomId: { in: roomIds } },
        include: {
            user: { select: { name: true, phone: true, email: true } },
            room: { select: { title: true, price: true, images: true, capacity: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    return { bookings };
};

export const getSellerRoomById = async (roomId: string) => {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== "SELLER") {
        throw new ApiError("Unauthorized", 401);
    }

    const sellerProfile = await checkPropertyCategoryActive(session.user.id);

    const room = await db.room.findUnique({
        where: { id: roomId, sellerId: sellerProfile.id }
    });

    if (!room) {
        throw new ApiError("Room not found or unauthorized", 404);
    }

    const parsed = parseRoomDescription(room.description);
    return { room: { ...room, ...parsed } };
};

export const updateSellerRoom = async (req: Request, roomIdOverride?: string) => {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== "SELLER") {
        throw new ApiError("Unauthorized", 401);
    }

    const sellerProfile = await checkPropertyCategoryActive(session.user.id);

    const contentType = req.headers.get("content-type") || "";
    let roomId: string | null = roomIdOverride || null;
    let title: string | undefined;
    let price: number | undefined;
    let description: string | undefined;
    let about: string | undefined;
    let amenities: any = undefined;
    let houseRules: any = undefined;
    let capacity: number | undefined;
    let isAvailable: boolean | undefined;
    let imageFile: File | null = null;
    let imageUrlField: string | null = null;

    if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData();
        roomId = roomId || (formData.get("roomId") as string) || (formData.get("id") as string);
        title = formData.get("title") as string;
        const priceStr = formData.get("price") as string;
        if (priceStr) price = parseFloat(priceStr);
        description = formData.get("description") as string;
        about = (formData.get("about") as string) || description;
        if (formData.has("amenities")) {
            amenities = formData.get("amenities") as string;
        }
        if (formData.has("houseRules")) {
            houseRules = formData.get("houseRules") as string;
        }
        const capacityStr = formData.get("capacity") as string;
        if (capacityStr) capacity = parseInt(capacityStr);
        if (formData.has("isAvailable")) {
            isAvailable = formData.get("isAvailable") === "true";
        }
        imageFile = formData.get("image") as File | null;
        imageUrlField = formData.get("imageUrl") as string | null;
    } else {
        const body = await req.json();
        roomId = roomId || body.roomId || body.id;
        title = body.title;
        if (body.price !== undefined) price = parseFloat(body.price);
        description = body.description;
        about = body.about || description;
        if (body.amenities !== undefined) amenities = body.amenities;
        if (body.houseRules !== undefined) houseRules = body.houseRules;
        if (body.capacity !== undefined) capacity = parseInt(body.capacity);
        if (body.isAvailable !== undefined) isAvailable = body.isAvailable;
        if (body.imageUrl !== undefined) imageUrlField = body.imageUrl;
    }

    if (!roomId) {
        const url = new URL(req.url);
        roomId = url.searchParams.get("id") || url.searchParams.get("roomId");
    }

    if (!roomId) {
        throw new ApiError("Room ID is required", 400);
    }

    const existingRoom = await db.room.findUnique({
        where: { id: roomId, sellerId: sellerProfile.id }
    });

    if (!existingRoom) {
        throw new ApiError("Room not found or unauthorized", 404);
    }

    const existingParsed = parseRoomDescription(existingRoom.description);

    const dataToUpdate: any = {};
    if (title !== undefined) dataToUpdate.title = title;
    if (price !== undefined && !isNaN(price)) dataToUpdate.price = price;
    if (capacity !== undefined && !isNaN(capacity)) dataToUpdate.capacity = capacity;
    if (isAvailable !== undefined) dataToUpdate.isAvailable = isAvailable;

    // Build encoded description if any of about, amenities, houseRules, or description was provided
    if (about !== undefined || amenities !== undefined || houseRules !== undefined || description !== undefined) {
        const targetAbout = about !== undefined ? about : existingParsed.about;
        const targetAmenities = amenities !== undefined ? amenities : existingParsed.amenities;
        const targetHouseRules = houseRules !== undefined ? houseRules : existingParsed.houseRules;
        dataToUpdate.description = formatRoomDescription(targetAbout, targetAmenities, targetHouseRules);
    }

    if (imageFile && imageFile.size > 0) {
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const imageUrl = await uploadImage(buffer, imageFile.type, imageFile.name, "rooms");
        dataToUpdate.images = JSON.stringify([imageUrl]);
    } else if (imageUrlField) {
        dataToUpdate.images = JSON.stringify([imageUrlField]);
    }

    const updatedRoom = await db.room.update({
        where: { id: roomId },
        data: dataToUpdate
    });

    const parsed = parseRoomDescription(updatedRoom.description);
    return { room: { ...updatedRoom, ...parsed } };
};

export const updateSellerBookingStatus = async (req: Request) => {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== "SELLER") {
        throw new ApiError("Unauthorized", 401);
    }

    const sellerProfile = await checkPropertyCategoryActive(session.user.id);

    const { bookingId, status } = await req.json();

    if (!bookingId || !status || !["CONFIRMED", "CANCELLED"].includes(status)) {
        throw new ApiError("Booking ID and valid status (CONFIRMED or CANCELLED) are required", 400);
    }

    const booking = await db.booking.findUnique({
        where: { id: bookingId },
        include: { room: true }
    });

    if (!booking) {
        throw new ApiError("Booking not found", 404);
    }

    if (booking.room.sellerId !== sellerProfile.id) {
        throw new ApiError("Unauthorized. This booking does not belong to your property.", 403);
    }

    const updatedBooking = await db.booking.update({
        where: { id: bookingId },
        data: { status }
    });

    return { booking: updatedBooking };
};
