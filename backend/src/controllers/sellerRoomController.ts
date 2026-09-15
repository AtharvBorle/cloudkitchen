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
    const capacity = parseInt(formData.get("capacity") as string) || 1;
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

    const room = await db.room.create({
        data: {
            sellerId: sellerProfile.id,
            title,
            price,
            description: description || "",
            capacity,
            images: JSON.stringify(imagesArray),
        }
    });

    return { room };
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

    return { rooms, bookings };
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

    return { room };
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

    const dataToUpdate: any = {};
    if (title !== undefined) dataToUpdate.title = title;
    if (price !== undefined && !isNaN(price)) dataToUpdate.price = price;
    if (description !== undefined) dataToUpdate.description = description;
    if (capacity !== undefined && !isNaN(capacity)) dataToUpdate.capacity = capacity;
    if (isAvailable !== undefined) dataToUpdate.isAvailable = isAvailable;

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

    return { room: updatedRoom };
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
