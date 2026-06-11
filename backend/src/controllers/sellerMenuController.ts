import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { uploadImage } from "@/lib/upload";

export const getMenuItems = async () => {
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

    const items = await db.foodItem.findMany({
        where: { sellerId: sellerProfile.id },
        orderBy: { name: 'asc' }
    });

    return { items };
};

export const createMenuItem = async (req: Request) => {
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
    const name = formData.get("name") as string;
    const price = parseFloat(formData.get("price") as string);
    const description = formData.get("description") as string;
    const availableDays = formData.get("availableDays") as string;
    const stockQuantityStr = formData.get("stockQuantity") as string;
    const stockQuantity = stockQuantityStr && !isNaN(parseInt(stockQuantityStr)) ? parseInt(stockQuantityStr) : -1;
    const imageFile = formData.get("image") as File | null;

    if (!name || isNaN(price)) {
        throw new ApiError("Name and Price are required", 400);
    }

    let imageUrl = null;
    if (imageFile && imageFile.size > 0) {
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        imageUrl = await uploadImage(buffer, imageFile.type, imageFile.name, "menu");
    }

    const foodItem = await db.foodItem.create({
        data: {
            sellerId: sellerProfile.id,
            name,
            price,
            description: description || "",
            availableDays: availableDays || "Mon,Tue,Wed,Thu,Fri,Sat,Sun",
            stockQuantity,
            imageUrl,
        }
    });

    return { foodItem };
};

export const updateMenuItem = async (req: Request, id: string) => {
    const session = await getAuthSession();
    if (!session || !session.user || session.user.role !== "SELLER") {
        throw new ApiError("Unauthorized", 401);
    }

    const body = await req.json();

    const existingItem = await db.foodItem.findUnique({
        where: { id },
        include: { seller: true }
    });

    if (!existingItem || existingItem.seller.userId !== session.user.id) {
        throw new ApiError("Forbidden", 403);
    }

    const dataToUpdate: any = {};
    if (body.name !== undefined) dataToUpdate.name = body.name;
    if (body.description !== undefined) dataToUpdate.description = body.description;
    if (body.price !== undefined) dataToUpdate.price = parseFloat(body.price);
    if (body.isAvailable !== undefined) dataToUpdate.isAvailable = body.isAvailable;
    if (body.stockQuantity !== undefined) dataToUpdate.stockQuantity = parseInt(body.stockQuantity);

    const updatedItem = await db.foodItem.update({
        where: { id },
        data: dataToUpdate
    });

    return { item: updatedItem };
};

export const deleteMenuItem = async (id: string) => {
    const session = await getAuthSession();
    if (!session || !session.user || session.user.role !== "SELLER") {
        throw new ApiError("Unauthorized", 401);
    }

    const existingItem = await db.foodItem.findUnique({
        where: { id },
        include: { seller: true }
    });

    if (!existingItem || existingItem.seller.userId !== session.user.id) {
        throw new ApiError("Forbidden", 403);
    }

    await db.foodItem.delete({
        where: { id }
    });

    return null;
};
