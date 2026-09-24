import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { revalidateTag } from "next/cache";

export const getCategories = async () => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to view categories.", 401);
    }
    if (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN" && session.user.role !== "SUPPORT") {
        throw new ApiError("Access denied. Admin privileges required.", 403);
    }

    const categories = await db.category.findMany({
        orderBy: { name: 'asc' }
    });

    const sellers = await db.sellerProfile.findMany({
        include: { user: true },
        orderBy: { businessName: 'asc' }
    });

    return { categories, sellers };
};

export const createCategory = async (req: Request) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to create categories.", 401);
    }
    if (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN" && session.user.role !== "SUPPORT") {
        throw new ApiError("Access denied. Admin privileges required.", 403);
    }

    const { name, type } = await req.json();

    if (!name || !type) {
        throw new ApiError("Category name and type are required.", 400);
    }

    const category = await db.category.create({
        data: { name, type }
    });

    revalidateTag("categories", {});

    return { category };
};
