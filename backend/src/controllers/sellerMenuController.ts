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
        include: {
            foodCategory: true,
            foodSubCategory: true
        },
        orderBy: { name: 'asc' }
    });

    const servedPincodes = await db.servedPincode.findMany({
        where: { sellerId: sellerProfile.id },
        orderBy: { pincode: 'asc' }
    });

    // Find the Category matching the seller's type (e.g. Bakery)
    const matchingCategory = await db.category.findFirst({
        where: {
            name: { equals: sellerProfile.type, mode: "insensitive" },
            type: "FOOD"
        }
    });

    let foodCategories: any[] = [];
    if (matchingCategory) {
        foodCategories = await db.foodCategory.findMany({
            where: {
                categories: {
                    some: { id: matchingCategory.id }
                }
            },
            include: {
                subCategories: {
                    orderBy: { name: 'asc' }
                }
            },
            orderBy: { name: 'asc' }
        });
    }

    return { items, servedPincodes, foodType: sellerProfile.foodType, foodCategories };
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
    const deliveryPincodes = formData.get("deliveryPincodes") as string | null;
    const openTime = formData.get("openTime") as string | null;
    const closeTime = formData.get("closeTime") as string | null;
    const operationalHours = formData.get("operationalHours") as string | null;
    const imageFile = formData.get("image") as File | null;
    const itemType = sellerProfile.foodType === "VEG" ? "VEG" : (formData.get("itemType") as string || "VEG");
    const foodCategoryId = formData.get("foodCategoryId") as string | null;
    const foodSubCategoryId = formData.get("foodSubCategoryId") as string | null;

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
            deliveryPincodes: deliveryPincodes || null,
            openTime: openTime || null,
            closeTime: closeTime || null,
            operationalHours: operationalHours || null,
            imageUrl,
            itemType,
            foodCategoryId: foodCategoryId || null,
            foodSubCategoryId: foodSubCategoryId || null
        }
    });

    return { foodItem };
};

export const updateMenuItem = async (req: Request, id: string) => {
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

    const contentType = req.headers.get("content-type") || "";
    const dataToUpdate: any = {};

    if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData();
        const name = formData.get("name") as string | null;
        const price = formData.get("price") as string | null;
        const description = formData.get("description") as string | null;
        const stockQuantity = formData.get("stockQuantity") as string | null;
        const deliveryPincodes = formData.get("deliveryPincodes") as string | null;
        const openTime = formData.get("openTime") as string | null;
        const closeTime = formData.get("closeTime") as string | null;
        const operationalHours = formData.get("operationalHours") as string | null;
        const itemType = formData.get("itemType") as string | null;
        const isAvailable = formData.get("isAvailable") as string | null;
        const imageFile = formData.get("image") as File | null;
        const foodCategoryId = formData.get("foodCategoryId") as string | null;
        const foodSubCategoryId = formData.get("foodSubCategoryId") as string | null;

        if (name !== null) dataToUpdate.name = name;
        if (description !== null) dataToUpdate.description = description;
        if (price !== null && !isNaN(parseFloat(price))) dataToUpdate.price = parseFloat(price);
        if (isAvailable !== null) dataToUpdate.isAvailable = isAvailable === "true";
        if (stockQuantity !== null && !isNaN(parseInt(stockQuantity))) dataToUpdate.stockQuantity = parseInt(stockQuantity);
        if (deliveryPincodes !== null) {
            dataToUpdate.deliveryPincodes = deliveryPincodes.trim() || null;
        }
        if (openTime !== null) dataToUpdate.openTime = openTime;
        if (closeTime !== null) dataToUpdate.closeTime = closeTime;
        if (operationalHours !== null) dataToUpdate.operationalHours = operationalHours;
        if (itemType !== null) {
            dataToUpdate.itemType = existingItem.seller.foodType === "VEG" ? "VEG" : itemType;
        }
        if (foodCategoryId !== null) dataToUpdate.foodCategoryId = foodCategoryId || null;
        if (foodSubCategoryId !== null) dataToUpdate.foodSubCategoryId = foodSubCategoryId || null;

        if (imageFile && imageFile.size > 0) {
            const bytes = await imageFile.arrayBuffer();
            const buffer = Buffer.from(bytes);
            dataToUpdate.imageUrl = await uploadImage(buffer, imageFile.type, imageFile.name, "menu");
        }
    } else {
        const body = await req.json();
        if (body.name !== undefined) dataToUpdate.name = body.name;
        if (body.description !== undefined) dataToUpdate.description = body.comment !== undefined ? body.comment : body.description;
        if (body.price !== undefined) dataToUpdate.price = parseFloat(body.price);
        if (body.isAvailable !== undefined) dataToUpdate.isAvailable = body.isAvailable;
        if (body.stockQuantity !== undefined) dataToUpdate.stockQuantity = parseInt(body.stockQuantity);
        if (body.deliveryPincodes !== undefined) {
            dataToUpdate.deliveryPincodes = body.deliveryPincodes ? body.deliveryPincodes.trim() || null : null;
        }
        if (body.openTime !== undefined) dataToUpdate.openTime = body.openTime;
        if (body.closeTime !== undefined) dataToUpdate.closeTime = body.closeTime;
        if (body.operationalHours !== undefined) dataToUpdate.operationalHours = body.operationalHours;
        if (body.itemType !== undefined) {
            dataToUpdate.itemType = existingItem.seller.foodType === "VEG" ? "VEG" : body.itemType;
        }
        if (body.foodCategoryId !== undefined) dataToUpdate.foodCategoryId = body.foodCategoryId || null;
        if (body.foodSubCategoryId !== undefined) dataToUpdate.foodSubCategoryId = body.foodSubCategoryId || null;
    }

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

export const addServedPincode = async (req: Request) => {
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

    const body = await req.json();
    const { pincode, name } = body;

    if (!pincode || !name) {
        throw new ApiError("Pincode and Place Name are required", 400);
    }

    const cleanedPincode = pincode.toString().trim();
    const cleanedName = name.toString().trim();

    const existing = await db.servedPincode.findUnique({
        where: {
            sellerId_pincode: {
                sellerId: sellerProfile.id,
                pincode: cleanedPincode
            }
        }
    });

    if (existing) {
        const updated = await db.servedPincode.update({
            where: { id: existing.id },
            data: { name: cleanedName }
        });
        return { pincode: updated };
    }

    const created = await db.servedPincode.create({
        data: {
            sellerId: sellerProfile.id,
            pincode: cleanedPincode,
            name: cleanedName
        }
    });

    return { pincode: created };
};

export const deleteServedPincode = async (id: string) => {
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

    const existing = await db.servedPincode.findUnique({
        where: { id }
    });

    if (!existing || existing.sellerId !== sellerProfile.id) {
        throw new ApiError("Forbidden", 403);
    }

    await db.servedPincode.delete({
        where: { id }
    });

    return null;
};
