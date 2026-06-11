import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { uploadImage } from "@/lib/upload";

export const createSellerRoom = async (req: Request) => {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== "SELLER") {
        throw new ApiError("Unauthorized", 401);
    }

    const sellerProfile = await db.sellerProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!sellerProfile) {
        throw new ApiError("Seller profile not found", 404);
    }

    const formData = await req.formData();
    const title = formData.get("title") as string;
    const price = parseFloat(formData.get("price") as string);
    const description = formData.get("description") as string;
    const capacity = parseInt(formData.get("capacity") as string) || 1;
    const imageFile = formData.get("image") as File | null;

    if (!title || isNaN(price)) {
        throw new ApiError("Title and Price are required", 400);
    }

    let imagesArray: string[] = [];
    if (imageFile && imageFile.size > 0) {
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const imageUrl = await uploadImage(buffer, imageFile.type, imageFile.name, "rooms");
        imagesArray.push(imageUrl);
    }

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

export const getSellerRooms = async () => {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== "SELLER") {
        throw new ApiError("Unauthorized", 401);
    }

    const sellerProfile = await db.sellerProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!sellerProfile) {
        throw new ApiError("Seller profile not found", 404);
    }

    const rooms = await db.room.findMany({
        where: { sellerId: sellerProfile.id },
        orderBy: { title: 'asc' }
    });

    const roomIds = rooms.map(r => r.id);

    const bookings = await db.booking.findMany({
        where: { roomId: { in: roomIds } },
        include: {
            user: { select: { name: true, phone: true } },
            room: { select: { title: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    return { rooms, bookings };
};

export const updateSellerRoomAvailability = async (req: Request) => {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== "SELLER") {
        throw new ApiError("Unauthorized", 401);
    }

    const { roomId, isAvailable } = await req.json();

    if (!roomId || typeof isAvailable !== "boolean") {
        throw new ApiError("Invalid payload", 400);
    }

    const sellerProfile = await db.sellerProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!sellerProfile) {
        throw new ApiError("Seller profile not found", 404);
    }

    const existingRoom = await db.room.findUnique({
        where: { id: roomId, sellerId: sellerProfile.id }
    });

    if (!existingRoom) {
        throw new ApiError("Room not found or unauthorized", 404);
    }

    const updatedRoom = await db.room.update({
        where: { id: roomId },
        data: { isAvailable }
    });

    return { room: updatedRoom };
};
