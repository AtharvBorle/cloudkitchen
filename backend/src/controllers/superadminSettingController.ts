import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/api-error";

export const getSystemSetting = async (req: Request) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to view system settings.", 401);
    }
    if (session.user.role !== "SUPERADMIN") {
        throw new ApiError("Access denied. Superadmin privileges required.", 403);
    }

    const url = new URL(req.url);
    const key = url.searchParams.get("key");

    if (!key) {
        throw new ApiError("Key parameter is required.", 400);
    }

    const setting = await db.systemSettings.findUnique({
        where: { key }
    });

    if (!setting && key === "SUBSCRIPTION_PRICE") {
        return { key, value: "199" };
    }

    return setting || { key, value: null };
};

export const updateSystemSetting = async (req: Request) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to update system settings.", 401);
    }
    if (session.user.role !== "SUPERADMIN") {
        throw new ApiError("Access denied. Superadmin privileges required.", 403);
    }

    const { key, value } = await req.json();

    if (!key || value === undefined) {
        throw new ApiError("Setting key and value are required.", 400);
    }

    const updatedSetting = await db.systemSettings.upsert({
        where: { key },
        update: { value: value.toString() },
        create: { id: key, key, value: value.toString() }
    });

    return updatedSetting;
};
