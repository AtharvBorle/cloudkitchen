import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { uploadImage } from "@/lib/upload";
import { revalidateTag } from "next/cache";
import { emitMenuUpdated } from "@/lib/realtime-events";

const triggerMenuRevalidationAndEvents = (sellerId: string) => {
    try {
        revalidateTag("explore", {});
        revalidateTag("public-explore-data", {});
        revalidateTag("home", {});
        revalidateTag("menu", {});
    } catch (e) {}

    try {
        emitMenuUpdated(sellerId);
    } catch (emErr) {
        console.error("Live menu emit error:", emErr);
    }
};

const getAuthenticatedSellerProfile = async () => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to manage add-ons.", 401);
    }
    const userRole = (session.user.role || "").toUpperCase();
    if (userRole !== "SELLER" && userRole !== "ADMIN" && userRole !== "SUPERADMIN") {
        throw new ApiError("Access denied. Seller account required.", 403);
    }

    let sellerProfile = await db.sellerProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!sellerProfile && (userRole === "ADMIN" || userRole === "SUPERADMIN")) {
        sellerProfile = await db.sellerProfile.findFirst();
    }

    if (!sellerProfile) {
        throw new ApiError("Seller profile not found. Please complete seller registration.", 404);
    }

    return { session, sellerProfile };
};

export const getSellerAddons = async (req: Request) => {
    const { sellerProfile } = await getAuthenticatedSellerProfile();
    const url = new URL(req.url);
    const search = (url.searchParams.get("search") || "").trim();
    const status = (url.searchParams.get("status") || "ALL").toUpperCase();
    const pageParam = parseInt(url.searchParams.get("page") || "1", 10);
    const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
    const rawLimit = url.searchParams.get("limit");
    const limit = rawLimit === "All" || rawLimit === "-1" ? 1000 : Math.min(100, Math.max(1, parseInt(rawLimit || "20", 10) || 20));

    // Calculate seller inventory indicators
    const allSellerAddons = await db.addon.findMany({
        where: { sellerId: sellerProfile.id },
        select: {
            id: true,
            stockQuantity: true,
            lowStockThreshold: true,
            isActive: true,
        }
    });

    const totalCount = allSellerAddons.length;
    const activeCount = allSellerAddons.filter(a => a.isActive).length;
    const inactiveCount = allSellerAddons.filter(a => !a.isActive).length;
    const outOfStockCount = allSellerAddons.filter(a => a.isActive && a.stockQuantity === 0).length;
    const lowStockCount = allSellerAddons.filter(a => a.isActive && a.stockQuantity > 0 && a.stockQuantity <= a.lowStockThreshold).length;
    const inStockCount = allSellerAddons.filter(a => a.isActive && a.stockQuantity > a.lowStockThreshold).length;
    const availableCount = inStockCount + lowStockCount;

    const metrics = {
        totalCount,
        activeCount,
        inactiveCount,
        availableCount,
        inStockCount,
        lowStockCount,
        outOfStockCount,
    };

    // Build filter conditions
    const where: any = {
        sellerId: sellerProfile.id,
    };

    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
        ];
    }

    if (status === "AVAILABLE") {
        where.isActive = true;
        where.stockQuantity = { gt: 0 };
    } else if (status === "LOW_STOCK") {
        where.isActive = true;
        where.stockQuantity = { gt: 0 };
        // Post-filtered or condition
    } else if (status === "OUT_OF_STOCK") {
        where.isActive = true;
        where.stockQuantity = 0;
    } else if (status === "ACTIVE") {
        where.isActive = true;
    } else if (status === "INACTIVE") {
        where.isActive = false;
    }

    let matchingAddons = await db.addon.findMany({
        where,
        orderBy: { updatedAt: "desc" },
    });

    if (status === "LOW_STOCK") {
        matchingAddons = matchingAddons.filter(a => a.stockQuantity <= a.lowStockThreshold);
    }

    const filteredTotal = matchingAddons.length;
    const totalPages = Math.ceil(filteredTotal / limit) || 1;
    const paginatedItems = matchingAddons.slice((page - 1) * limit, page * limit);

    const enrichedItems = paginatedItems.map(a => {
        let stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "INACTIVE" = "IN_STOCK";
        if (!a.isActive) {
            stockStatus = "INACTIVE";
        } else if (a.stockQuantity === 0) {
            stockStatus = "OUT_OF_STOCK";
        } else if (a.stockQuantity <= a.lowStockThreshold) {
            stockStatus = "LOW_STOCK";
        }

        return {
            ...a,
            stockStatus,
            isAvailable: a.isActive && a.stockQuantity > 0,
        };
    });

    const firstAddon = allSellerAddons[0];
    const centralizedThreshold = firstAddon ? firstAddon.lowStockThreshold : 5;

    return {
        addons: enrichedItems,
        metrics,
        centralizedThreshold,
        pagination: {
            page,
            limit,
            totalItems: filteredTotal,
            totalPages,
        }
    };
};

export const updateCentralizedThreshold = async (req: Request) => {
    const { sellerProfile } = await getAuthenticatedSellerProfile();
    const body = await req.json().catch(() => ({}));
    const rawVal = body.threshold !== undefined ? body.threshold : body.lowStockThreshold;
    const thresholdNum = parseInt(String(rawVal ?? "5"), 10);
    const threshold = isNaN(thresholdNum) || thresholdNum < 0 ? 5 : thresholdNum;

    await db.addon.updateMany({
        where: { sellerId: sellerProfile.id },
        data: { lowStockThreshold: threshold }
    });

    triggerMenuRevalidationAndEvents(sellerProfile.id);
    return { threshold, message: "Centralized low-stock threshold updated successfully" };
};

export const createSellerAddon = async (req: Request) => {
    const { sellerProfile } = await getAuthenticatedSellerProfile();
    const contentType = req.headers.get("content-type") || "";

    let name = "";
    let description = "";
    let price = 0;
    let stockQuantity = 0;
    let lowStockThreshold = 5;
    let isActive = true;

    if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData();
        name = String(formData.get("name") || "").trim();
        description = String(formData.get("description") || "").trim();
        price = parseFloat(String(formData.get("price") || "0"));
        const rawStock = formData.get("stockQuantity");
        stockQuantity = rawStock !== null && rawStock !== "" ? parseInt(String(rawStock), 10) : 0;
        if (formData.get("isActive") !== null) {
            isActive = formData.get("isActive") === "true";
        }
    } else {
        const body = await req.json().catch(() => ({}));
        name = String(body.name || "").trim();
        description = String(body.description || "").trim();
        price = parseFloat(String(body.price || "0"));
        const rawStock = body.stockQuantity;
        const parsedStock = rawStock !== undefined && rawStock !== "" ? parseInt(String(rawStock), 10) : 0;
        stockQuantity = isNaN(parsedStock) ? 0 : parsedStock;
        if (body.isActive !== undefined) {
            isActive = Boolean(body.isActive);
        }
    }

    // Centralized threshold for all add-ons of this seller (default 5 if not set)
    const existingFirst = await db.addon.findFirst({
        where: { sellerId: sellerProfile.id },
        select: { lowStockThreshold: true }
    });
    lowStockThreshold = existingFirst ? existingFirst.lowStockThreshold : 5;

    if (!name) {
        throw new ApiError("Add-on Name is required.", 400);
    }
    if (name.length > 100) {
        throw new ApiError("Add-on Name cannot exceed 100 characters.", 400);
    }
    if (isNaN(price) || price <= 0) {
        throw new ApiError("Valid selling price greater than ₹0 is required.", 400);
    }
    if (isNaN(stockQuantity) || stockQuantity < 0) {
        throw new ApiError("Stock quantity cannot be negative.", 400);
    }
    if (isNaN(lowStockThreshold) || lowStockThreshold < 0) {
        throw new ApiError("Low-stock threshold cannot be negative.", 400);
    }

    // Check duplicate addon name for this seller
    const existing = await db.addon.findFirst({
        where: {
            sellerId: sellerProfile.id,
            name: { equals: name, mode: "insensitive" }
        }
    });

    if (existing) {
        throw new ApiError(`An add-on named "${name}" already exists in your kitchen menu. Please choose a unique name.`, 400);
    }

    const newAddon = await db.$transaction(async (tx) => {
        const addon = await tx.addon.create({
            data: {
                sellerId: sellerProfile.id,
                name,
                description,
                price,
                stockQuantity,
                lowStockThreshold,
                isActive,
                imageUrl: null,
            }
        });

        await tx.addonInventoryLog.create({
            data: {
                addonId: addon.id,
                action: "INITIAL",
                quantityDelta: stockQuantity,
                previousStock: 0,
                newStock: stockQuantity,
                note: `Initial inventory configured with ${stockQuantity} units`,
            }
        });

        return addon;
    });

    triggerMenuRevalidationAndEvents(sellerProfile.id);
    return newAddon;
};

export const getSellerAddonById = async (id: string) => {
    const { sellerProfile } = await getAuthenticatedSellerProfile();

    const addon = await db.addon.findFirst({
        where: {
            id,
            sellerId: sellerProfile.id,
        },
        include: {
            inventoryLogs: {
                orderBy: { createdAt: "desc" },
                take: 20,
            }
        }
    });

    if (!addon) {
        throw new ApiError("Add-on not found or access denied.", 404);
    }

    return addon;
};

export const updateSellerAddon = async (id: string, req: Request) => {
    const { sellerProfile } = await getAuthenticatedSellerProfile();

    const existing = await db.addon.findFirst({
        where: {
            id,
            sellerId: sellerProfile.id,
        }
    });

    if (!existing) {
        throw new ApiError("Add-on not found or access denied.", 404);
    }

    const contentType = req.headers.get("content-type") || "";
    let name: string | undefined;
    let description: string | undefined;
    let price: number | undefined;
    let stockQuantity: number | undefined;
    let replenishQuantity: number | undefined;
    let lowStockThreshold: number | undefined;
    let isActive: boolean | undefined;
    let imageUrl: string | undefined;
    let imageFile: File | null = null;
    let removeImage = false;
    let note: string | undefined;

    if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData();
        if (formData.get("name") !== null) name = String(formData.get("name")).trim();
        if (formData.get("description") !== null) description = String(formData.get("description")).trim();
        if (formData.get("price") !== null) price = parseFloat(String(formData.get("price")));
        if (formData.get("stockQuantity") !== null) stockQuantity = parseInt(String(formData.get("stockQuantity")), 10);
        if (formData.get("replenishQuantity") !== null) replenishQuantity = parseInt(String(formData.get("replenishQuantity")), 10);
        if (formData.get("lowStockThreshold") !== null) lowStockThreshold = parseInt(String(formData.get("lowStockThreshold")), 10);
        if (formData.get("isActive") !== null) isActive = formData.get("isActive") === "true";
        if (formData.get("removeImage") === "true") removeImage = true;
        if (formData.get("imageUrl") !== null) imageUrl = String(formData.get("imageUrl")).trim();
        if (formData.get("note") !== null) note = String(formData.get("note")).trim();
        imageFile = formData.get("image") as File | null;
    } else {
        const body = await req.json();
        if (body.name !== undefined) name = String(body.name).trim();
        if (body.description !== undefined) description = String(body.description).trim();
        if (body.price !== undefined) price = parseFloat(String(body.price));
        if (body.stockQuantity !== undefined) stockQuantity = parseInt(String(body.stockQuantity), 10);
        if (body.replenishQuantity !== undefined) replenishQuantity = parseInt(String(body.replenishQuantity), 10);
        if (body.lowStockThreshold !== undefined) lowStockThreshold = parseInt(String(body.lowStockThreshold), 10);
        if (body.isActive !== undefined) isActive = Boolean(body.isActive);
        if (body.removeImage !== undefined) removeImage = Boolean(body.removeImage);
        if (body.imageUrl !== undefined) imageUrl = String(body.imageUrl).trim();
        if (body.note !== undefined) note = String(body.note).trim();
    }

    if (name !== undefined) {
        if (!name) throw new ApiError("Add-on Name cannot be empty.", 400);
        if (name.length > 100) throw new ApiError("Add-on Name cannot exceed 100 characters.", 400);

        // Check for duplicate name excluding self
        const duplicate = await db.addon.findFirst({
            where: {
                sellerId: sellerProfile.id,
                name: { equals: name, mode: "insensitive" },
                id: { not: id }
            }
        });
        if (duplicate) {
            throw new ApiError(`Another add-on named "${name}" already exists.`, 400);
        }
    }

    if (price !== undefined && (isNaN(price) || price <= 0)) {
        throw new ApiError("Valid selling price greater than ₹0 is required.", 400);
    }

    if (lowStockThreshold !== undefined && (isNaN(lowStockThreshold) || lowStockThreshold < 0)) {
        throw new ApiError("Low-stock threshold cannot be negative.", 400);
    }

    if (replenishQuantity !== undefined && (isNaN(replenishQuantity) || replenishQuantity <= 0)) {
        throw new ApiError("Update stock quantity must be greater than zero.", 400);
    }

    if (stockQuantity !== undefined && (isNaN(stockQuantity) || stockQuantity < 0)) {
        throw new ApiError("Stock quantity cannot be negative.", 400);
    }

    if (imageFile && imageFile.size > 0) {
        if (imageFile.size > 10 * 1024 * 1024) {
            throw new ApiError("Add-on image size must not exceed 10MB.", 400);
        }
        try {
            const bytes = await imageFile.arrayBuffer();
            const buffer = Buffer.from(bytes);
            imageUrl = await uploadImage(buffer, imageFile.type, imageFile.name, "addons");
        } catch (e: any) {
            console.error("Failed to upload addon image:", e);
            throw new ApiError("Failed to upload add-on image: " + (e?.message || ""), 500);
        }
    }

    const updated = await db.$transaction(async (tx) => {
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (price !== undefined) updateData.price = price;
        if (lowStockThreshold !== undefined) updateData.lowStockThreshold = lowStockThreshold;
        if (isActive !== undefined) updateData.isActive = isActive;

        if (removeImage) {
            updateData.imageUrl = null;
        } else if (imageUrl !== undefined && imageUrl !== "") {
            updateData.imageUrl = imageUrl;
        }

        let newStockVal = existing.stockQuantity;

        if (replenishQuantity !== undefined && replenishQuantity > 0) {
            newStockVal = existing.stockQuantity + replenishQuantity;
            updateData.stockQuantity = newStockVal;

            await tx.addonInventoryLog.create({
                data: {
                    addonId: id,
                    action: "RESTOCK",
                    quantityDelta: replenishQuantity,
                    previousStock: existing.stockQuantity,
                    newStock: newStockVal,
                    note: note || `Stock updated by +${replenishQuantity} units`,
                }
            });
        } else if (stockQuantity !== undefined && stockQuantity !== existing.stockQuantity) {
            const delta = stockQuantity - existing.stockQuantity;
            newStockVal = stockQuantity;
            updateData.stockQuantity = newStockVal;

            await tx.addonInventoryLog.create({
                data: {
                    addonId: id,
                    action: "MANUAL_ADJUSTMENT",
                    quantityDelta: delta,
                    previousStock: existing.stockQuantity,
                    newStock: newStockVal,
                    note: note || (delta > 0 ? `Stock adjusted by +${delta}` : `Stock adjusted by ${delta}`),
                }
            });
        }

        const res = await tx.addon.update({
            where: { id },
            data: updateData,
            include: {
                inventoryLogs: {
                    orderBy: { createdAt: "desc" },
                    take: 10,
                }
            }
        });

        // Reconcile and update all FoodItem dishes belonging to this seller that include this add-on
        const sellerDishes = await tx.foodItem.findMany({
            where: { sellerId: sellerProfile.id },
            select: { id: true, addons: true, variants: true }
        });

        for (const dish of sellerDishes) {
            let dishUpdated = false;
            const processField = (fieldVal: string | null) => {
                if (!fieldVal) return null;
                try {
                    const parsed = typeof fieldVal === "string" ? JSON.parse(fieldVal) : fieldVal;
                    if (!Array.isArray(parsed) || parsed.length === 0) return null;

                    let changed = false;
                    const nextList = parsed.map((item: any) => {
                        const matchById = item.id && (String(item.id) === String(id) || String(item.id) === String(existing.id));
                        const matchByName = item.name && existing.name && String(item.name).trim().toLowerCase() === String(existing.name).trim().toLowerCase();

                        if (matchById || matchByName) {
                            changed = true;
                            dishUpdated = true;
                            return {
                                ...item,
                                id: res.id,
                                name: res.name,
                                price: res.price,
                                stockQuantity: res.stockQuantity,
                                lowStockThreshold: res.lowStockThreshold,
                                isActive: res.isActive,
                                imageUrl: res.imageUrl,
                                description: res.description || ""
                            };
                        }
                        return item;
                    });

                    return changed ? JSON.stringify(nextList) : null;
                } catch {
                    return null;
                }
            };

            const updatedAddons = processField(dish.addons);
            const updatedVariants = processField(dish.variants);

            if (dishUpdated && (updatedAddons !== null || updatedVariants !== null)) {
                await tx.foodItem.update({
                    where: { id: dish.id },
                    data: {
                        ...(updatedAddons !== null ? { addons: updatedAddons } : {}),
                        ...(updatedVariants !== null ? { variants: updatedVariants } : {}),
                    }
                });
            }
        }

        return res;
    });

    triggerMenuRevalidationAndEvents(sellerProfile.id);
    return updated;
};

export const deleteSellerAddon = async (id: string) => {
    const { sellerProfile } = await getAuthenticatedSellerProfile();

    const existing = await db.addon.findFirst({
        where: {
            id,
            sellerId: sellerProfile.id,
        }
    });

    if (!existing) {
        throw new ApiError("Add-on not found or access denied.", 404);
    }

    await db.$transaction(async (tx) => {
        // Delete addon
        await tx.addon.delete({
            where: { id }
        });

        // Remove deleted add-on from all food dishes of this seller
        const sellerDishes = await tx.foodItem.findMany({
            where: { sellerId: sellerProfile.id },
            select: { id: true, addons: true, variants: true }
        });

        for (const dish of sellerDishes) {
            let dishUpdated = false;
            const processField = (fieldVal: string | null) => {
                if (!fieldVal) return null;
                try {
                    const parsed = typeof fieldVal === "string" ? JSON.parse(fieldVal) : fieldVal;
                    if (!Array.isArray(parsed) || parsed.length === 0) return null;

                    const filtered = parsed.filter((item: any) => {
                        const matchById = item.id && (String(item.id) === String(id) || String(item.id) === String(existing.id));
                        const matchByName = item.name && existing.name && String(item.name).trim().toLowerCase() === String(existing.name).trim().toLowerCase();
                        return !(matchById || matchByName);
                    });

                    if (filtered.length !== parsed.length) {
                        dishUpdated = true;
                        return JSON.stringify(filtered);
                    }
                    return null;
                } catch {
                    return null;
                }
            };

            const updatedAddons = processField(dish.addons);
            const updatedVariants = processField(dish.variants);

            if (dishUpdated && (updatedAddons !== null || updatedVariants !== null)) {
                await tx.foodItem.update({
                    where: { id: dish.id },
                    data: {
                        ...(updatedAddons !== null ? { addons: updatedAddons } : {}),
                        ...(updatedVariants !== null ? { variants: updatedVariants } : {}),
                    }
                });
            }
        }
    });

    triggerMenuRevalidationAndEvents(sellerProfile.id);
    return { success: true, message: `Add-on "${existing.name}" deleted successfully.` };
};
