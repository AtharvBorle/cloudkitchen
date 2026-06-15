import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { revalidateTag } from "next/cache";

export const getCategories = async () => {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== "SUPERADMIN") {
        throw new ApiError("Unauthorized", 401);
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
    if (!session?.user || session.user.role !== "SUPERADMIN") {
        throw new ApiError("Unauthorized", 401);
    }

    const { name, type } = await req.json();

    if (!name || !type) {
        throw new ApiError("Name and type are required", 400);
    }

    const category = await db.category.create({
        data: { name, type }
    });

    revalidateTag("categories", {});

    return { category };
};
