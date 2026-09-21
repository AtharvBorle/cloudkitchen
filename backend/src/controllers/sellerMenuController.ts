import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { uploadImage } from "@/lib/upload";
import { getCategoryExpiries } from "@/lib/subscription";

const checkFoodCategoryActive = async (userId: string) => {
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

    const { foodExpiry } = getCategoryExpiries(activeSubs);
    const isFoodActive = (foodExpiry ? foodExpiry > new Date() : false) && sellerProfile.foodVerificationStatus === "APPROVED";

    if (!isFoodActive && sellerProfile.verificationStatus !== "APPROVED") {
        throw new ApiError("Food subscription not active or approved", 403);
    }

    return sellerProfile;
};

export const normalizeFoodItemType = (raw: string | null | undefined): string => {
    if (!raw) return "VEG";
    const valid = ["VEG", "NON_VEG", "JAIN", "VEGAN"];
    const parts = String(raw)
        .split(",")
        .map(s => s.trim().toUpperCase().replace(/\s+/g, '_').replace(/-/g, '_'))
        .map(s => (s === "NON-VEG" || s === "NON_VEG" || s === "NON VEG") ? "NON_VEG" : s)
        .filter(s => valid.includes(s));

    const unique = Array.from(new Set(parts));
    if (unique.includes("NON_VEG")) return "NON_VEG";
    return unique.length > 0 ? unique.join(",") : "VEG";
};

export const extractCategoryNames = (typeStr?: string | null, businessCategoryStr?: string | null): string[] => {
    const rawList: string[] = [];
    
    const processStr = (str?: string | null) => {
        if (!str || !str.trim()) return;
        let cleaned = str.trim();
        if (cleaned.startsWith("[") && cleaned.endsWith("]")) {
            try {
                const parsed = JSON.parse(cleaned);
                if (Array.isArray(parsed)) {
                    parsed.forEach(p => {
                        if (typeof p === "string" && p.trim()) rawList.push(p.trim());
                    });
                    return;
                }
            } catch {
                cleaned = cleaned.slice(1, -1);
            }
        }
        cleaned.split(",").forEach(part => {
            const clean = part.replace(/^['"\s]+|['"\s]+$/g, "").trim();
            if (clean && clean.toUpperCase() !== "FOOD" && clean.toUpperCase() !== "PROPERTY" && clean.toUpperCase() !== "BOTH") {
                rawList.push(clean);
            }
        });
    };

    processStr(typeStr);
    if (rawList.length === 0) {
        processStr(businessCategoryStr);
    }

    return Array.from(new Set(rawList));
};

export const getMenuItems = async () => {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== "SELLER") {
        throw new ApiError("Unauthorized", 401);
    }

    const sellerProfile = await checkFoodCategoryActive(session.user.id);

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

    // Find FoodCategory records associated with seller's selected business categories
    const categoryNames = extractCategoryNames(sellerProfile.type, sellerProfile.businessCategory);
    let foodCategories: any[] = [];

    if (categoryNames.length > 0) {
        const matchingCategories = await db.category.findMany({
            where: {
                OR: categoryNames.map(name => ({
                    name: { equals: name, mode: "insensitive" }
                }))
            }
        });
        const matchingCategoryIds = matchingCategories.map(c => c.id);
        if (matchingCategoryIds.length > 0) {
            foodCategories = await db.foodCategory.findMany({
                where: {
                    categories: {
                        some: {
                            id: { in: matchingCategoryIds }
                        }
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
    } else {
        foodCategories = await db.foodCategory.findMany({
            where: {
                categories: {
                    some: {
                        type: "FOOD"
                    }
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

    return { 
        items, 
        servedPincodes, 
        foodType: sellerProfile.foodType, 
        foodCategories,
        seller: {
            id: sellerProfile.id,
            businessName: sellerProfile.businessName,
            isOnline: sellerProfile.isOnline,
            trackingId: sellerProfile.trackingId,
            type: sellerProfile.type,
            addressLocality: sellerProfile.addressLocality,
        }
    };
};

export const createMenuItem = async (req: Request) => {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== "SELLER") {
        throw new ApiError("Unauthorized", 401);
    }

    const sellerProfile = await checkFoodCategoryActive(session.user.id);

    const formData = await req.formData();
    const name = formData.get("name") as string;
    const price = parseFloat(formData.get("price") as string);
    const description = formData.get("description") as string;
    const availableDays = formData.get("availableDays") as string;
    const stockQuantityStr = formData.get("stockQuantity") as string;
    const stockQuantity = stockQuantityStr !== undefined && stockQuantityStr !== null && stockQuantityStr !== '' && !isNaN(parseInt(stockQuantityStr)) ? Math.max(0, parseInt(stockQuantityStr)) : 0;
    const deliveryPincodes = formData.get("deliveryPincodes") as string | null;
    const openTime = formData.get("openTime") as string | null;
    const closeTime = formData.get("closeTime") as string | null;
    const operationalHours = formData.get("operationalHours") as string | null;
    const imageFile = formData.get("image") as File | null;
    const rawItemType = formData.get("itemType") as string | null;
    if (!rawItemType || !rawItemType.trim()) {
        throw new ApiError("Food type is required", 400);
    }
    const itemType = normalizeFoodItemType(rawItemType);

    const rawAddons = (formData.get("addons") as string | null) || (formData.get("variants") as string | null);
    let addonsStr = "[]";
    if (rawAddons) {
        try {
            const parsed = typeof rawAddons === "string" ? JSON.parse(rawAddons) : rawAddons;
            if (Array.isArray(parsed) && parsed.length > 0) {
                for (let i = 0; i < parsed.length; i++) {
                    const a = parsed[i];
                    if (!a || !a.name || !String(a.name).trim()) {
                        throw new ApiError(`Add-on #${i + 1} name is required`, 400);
                    }
                    const addonPrice = parseFloat(a.price);
                    if (isNaN(addonPrice) || addonPrice < 0) {
                        throw new ApiError(`Add-on "${a.name}" price must be ₹0 or greater (negative numbers not allowed)`, 400);
                    }
                }
                const cleaned = parsed.map((a: any, idx: number) => ({
                    id: String(a.id || `addon_${idx + 1}`),
                    name: String(a.name || "").trim(),
                    price: Math.max(0, parseFloat(a.price) || 0)
                }));
                addonsStr = JSON.stringify(cleaned);
            }
        } catch (e: any) {
            if (e instanceof ApiError) throw e;
            console.error("Failed to parse addons JSON in createMenuItem:", e);
        }
    }

    let foodCategoryId = formData.get("foodCategoryId") as string | null;
    const foodSubCategoryId = formData.get("foodSubCategoryId") as string | null;

    if (!name || !name.trim()) {
        throw new ApiError("Item Name is required", 400);
    }
    if (isNaN(price) || price <= 0) {
        throw new ApiError("Valid Price (greater than 0) is required", 400);
    }
    if (!description || !description.trim()) {
        throw new ApiError("Description is required", 400);
    }

    if (!foodCategoryId) {
        const categoryNames = extractCategoryNames(sellerProfile.type, sellerProfile.businessCategory);
        if (categoryNames.length > 0) {
            const matchingCategories = await db.category.findMany({
                where: {
                    OR: categoryNames.map(catName => ({
                        name: { equals: catName, mode: "insensitive" }
                    }))
                }
            });
            const matchingCategoryIds = matchingCategories.map(c => c.id);
            if (matchingCategoryIds.length > 0) {
                const anyCat = await db.foodCategory.findFirst({
                    where: {
                        categories: {
                            some: { id: { in: matchingCategoryIds } }
                        }
                    }
                });
                if (anyCat) {
                    foodCategoryId = anyCat.id;
                }
            }
        }
        if (!foodCategoryId) {
            const anyCat = await db.foodCategory.findFirst();
            if (anyCat) {
                foodCategoryId = anyCat.id;
            }
        }
    }

    if (!foodCategoryId) {
        throw new ApiError("Category is required", 400);
    }

    const providedImgUrl = formData.get("imageUrl") as string | null;
    if ((!imageFile || imageFile.size === 0) && (!providedImgUrl || !providedImgUrl.trim())) {
        throw new ApiError("Dish image is mandatory. Please upload an image.", 400);
    }

    let imageUrl = providedImgUrl && providedImgUrl.trim() ? providedImgUrl.trim() : "";
    if (imageFile && imageFile.size > 0) {
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        imageUrl = await uploadImage(buffer, imageFile.type, imageFile.name, "menu");
    }

    if (!imageUrl) {
        throw new ApiError("Dish image is mandatory. Please upload an image.", 400);
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
            variants: addonsStr,
            addons: addonsStr,
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

    await checkFoodCategoryActive(session.user.id);

    const existingItem = await db.foodItem.findUnique({
        where: { id },
        include: { seller: true }
    });

    if (!existingItem || existingItem.seller.userId !== session.user.id) {
        throw new ApiError("Forbidden", 403);
    }

    const contentType = req.headers.get("content-type") || "";
    const dataToUpdate: any = {};
    const validItemTypes = ["VEG", "NON_VEG", "JAIN", "VEGAN"];

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
        const rawAddons = (formData.get("addons") as string | null) || (formData.get("variants") as string | null);
        const isAvailable = formData.get("isAvailable") as string | null;
        const imageFile = formData.get("image") as File | null;
        const foodCategoryId = formData.get("foodCategoryId") as string | null;
        const foodSubCategoryId = formData.get("foodSubCategoryId") as string | null;

        if (name !== null) dataToUpdate.name = name;
        if (description !== null) dataToUpdate.description = description;
        if (price !== null && !isNaN(parseFloat(price))) dataToUpdate.price = parseFloat(price);
        if (isAvailable !== null) dataToUpdate.isAvailable = isAvailable === "true";
        if (stockQuantity !== null && !isNaN(parseInt(stockQuantity))) dataToUpdate.stockQuantity = Math.max(0, parseInt(stockQuantity));
        if (deliveryPincodes !== null) {
            dataToUpdate.deliveryPincodes = deliveryPincodes.trim() || null;
        }
        if (openTime !== null) dataToUpdate.openTime = openTime;
        if (closeTime !== null) dataToUpdate.closeTime = closeTime;
        if (operationalHours !== null) dataToUpdate.operationalHours = operationalHours;
        if (itemType !== null) {
            dataToUpdate.itemType = normalizeFoodItemType(itemType);
        }
        if (rawAddons !== null) {
            try {
                const parsed = typeof rawAddons === "string" ? JSON.parse(rawAddons) : rawAddons;
                if (Array.isArray(parsed) && parsed.length > 0) {
                    for (let i = 0; i < parsed.length; i++) {
                        const a = parsed[i];
                        if (!a || !a.name || !String(a.name).trim()) {
                            throw new ApiError(`Add-on #${i + 1} name is required`, 400);
                        }
                        const addonPrice = parseFloat(a.price);
                        if (isNaN(addonPrice) || addonPrice < 0) {
                            throw new ApiError(`Add-on "${a.name}" price must be ₹0 or greater (negative numbers not allowed)`, 400);
                        }
                    }
                    const cleaned = parsed.map((a: any, idx: number) => ({
                        id: String(a.id || `addon_${idx + 1}`),
                        name: String(a.name || "").trim(),
                        price: Math.max(0, parseFloat(a.price) || 0)
                    }));
                    dataToUpdate.addons = JSON.stringify(cleaned);
                    dataToUpdate.variants = JSON.stringify(cleaned);
                } else if (Array.isArray(parsed) && parsed.length === 0) {
                    dataToUpdate.addons = "[]";
                    dataToUpdate.variants = "[]";
                }
            } catch (e: any) {
                if (e instanceof ApiError) throw e;
                console.error("Failed to parse addons in updateMenuItem:", e);
            }
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
        if (body.stockQuantity !== undefined) dataToUpdate.stockQuantity = Math.max(0, parseInt(body.stockQuantity));
        if (body.deliveryPincodes !== undefined) {
            dataToUpdate.deliveryPincodes = body.deliveryPincodes ? body.deliveryPincodes.trim() || null : null;
        }
        if (body.openTime !== undefined) dataToUpdate.openTime = body.openTime;
        if (body.closeTime !== undefined) dataToUpdate.closeTime = body.closeTime;
        if (body.operationalHours !== undefined) dataToUpdate.operationalHours = body.operationalHours;
        if (body.itemType !== undefined) {
            dataToUpdate.itemType = normalizeFoodItemType(body.itemType);
        }
        const rawAddonsBody = body.addons !== undefined ? body.addons : body.variants;
        if (rawAddonsBody !== undefined) {
            try {
                const parsed = typeof rawAddonsBody === "string" ? JSON.parse(rawAddonsBody) : rawAddonsBody;
                if (Array.isArray(parsed)) {
                    const cleaned = parsed
                        .filter((a: any) => a && (a.name || "").trim())
                        .map((a: any, idx: number) => ({
                            id: String(a.id || `addon_${idx + 1}`),
                            name: String(a.name || "").trim(),
                            price: Math.max(0, parseFloat(a.price) || 0)
                        }));
                    dataToUpdate.addons = JSON.stringify(cleaned);
                    dataToUpdate.variants = JSON.stringify(cleaned);
                }
            } catch (e) {
                console.error("Failed to parse addons JSON in updateMenuItem:", e);
            }
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

    await checkFoodCategoryActive(session.user.id);

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

    const sellerProfile = await checkFoodCategoryActive(session.user.id);

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

    const sellerProfile = await checkFoodCategoryActive(session.user.id);

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
