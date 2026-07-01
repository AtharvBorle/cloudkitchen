import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { uploadImage } from "@/lib/upload";

export const getFoodCategories = async () => {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== "SUPERADMIN") {
        throw new ApiError("Unauthorized", 401);
    }

    const foodCategories = await db.foodCategory.findMany({
        include: {
            category: true,
            subCategories: {
                orderBy: { name: 'asc' }
            }
        },
        orderBy: { name: 'asc' }
    });

    const parentCategories = await db.category.findMany({
        where: { type: "FOOD" },
        orderBy: { name: 'asc' }
    });

    return { foodCategories, parentCategories };
};

export const createFoodCategory = async (req: Request) => {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== "SUPERADMIN") {
        throw new ApiError("Unauthorized", 401);
    }

    const formData = await req.formData();
    const name = formData.get("name") as string;
    const categoryId = formData.get("categoryId") as string;
    const imageFile = formData.get("image") as File | null;

    if (!name || !name.trim()) {
        throw new ApiError("Category name is required", 400);
    }
    if (!categoryId) {
        throw new ApiError("Parent category is required", 400);
    }

    const cleanedName = name.trim();

    // Check if food category already exists under this parent global category
    const existing = await db.foodCategory.findFirst({
        where: {
            name: { equals: cleanedName, mode: 'insensitive' },
            categoryId
        }
    });

    if (existing) {
        throw new ApiError("Food category already exists under this parent category", 400);
    }

    let imageUrl = null;
    if (imageFile && imageFile.size > 0) {
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        imageUrl = await uploadImage(buffer, imageFile.type, imageFile.name, "categories");
    }

    const foodCategory = await db.foodCategory.create({
        data: {
            name: cleanedName,
            categoryId,
            imageUrl
        },
        include: {
            category: true,
            subCategories: true
        }
    });

    return { foodCategory };
};

export const deleteFoodCategory = async (id: string) => {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== "SUPERADMIN") {
        throw new ApiError("Unauthorized", 401);
    }

    if (!id) {
        throw new ApiError("Category ID is required", 400);
    }

    await db.foodCategory.delete({
        where: { id }
    });

    return { success: true };
};

export const createFoodSubCategory = async (req: Request) => {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== "SUPERADMIN") {
        throw new ApiError("Unauthorized", 401);
    }

    const formData = await req.formData();
    const name = formData.get("name") as string;
    const foodCategoryId = formData.get("foodCategoryId") as string;
    const imageFile = formData.get("image") as File | null;

    if (!name || !name.trim()) {
        throw new ApiError("Sub-category name is required", 400);
    }
    if (!foodCategoryId) {
        throw new ApiError("Parent food category is required", 400);
    }

    const cleanedName = name.trim();

    // Check if sub-category already exists under this parent food category
    const existing = await db.foodSubCategory.findFirst({
        where: {
            name: { equals: cleanedName, mode: 'insensitive' },
            foodCategoryId
        }
    });

    if (existing) {
        throw new ApiError("Sub-category already exists under this food category", 400);
    }

    let imageUrl = null;
    if (imageFile && imageFile.size > 0) {
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        imageUrl = await uploadImage(buffer, imageFile.type, imageFile.name, "subcategories");
    }

    const subCategory = await db.foodSubCategory.create({
        data: {
            name: cleanedName,
            foodCategoryId,
            imageUrl
        }
    });

    return { subCategory };
};

export const deleteFoodSubCategory = async (id: string) => {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== "SUPERADMIN") {
        throw new ApiError("Unauthorized", 401);
    }

    if (!id) {
        throw new ApiError("Sub-category ID is required", 400);
    }

    await db.foodSubCategory.delete({
        where: { id }
    });

    return { success: true };
};
