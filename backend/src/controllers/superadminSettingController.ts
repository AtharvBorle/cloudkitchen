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
        const allSettings = await db.systemSettings.findMany();
        const settingsMap: Record<string, string> = {
            SUPPORT_EMAIL: "support@neocloudkitchen.com",
            SUPPORT_PHONE: "+91 98765 43210",
            MAINTENANCE_MODE: "false",
            AUTO_ASSIGN_DELIVERY: "true",
            ENABLE_ROOM_MODULE: "false",
            ENABLE_CHATBOT: "true",
            PRODUCT_TAX_RATE: "5",
            DELIVERY_TAX_RATE: "18"
        };
        for (const s of allSettings) {
            settingsMap[s.key] = s.value;
        }
        return {
            settings: allSettings,
            settingsMap
        };
    }

    const setting = await db.systemSettings.findUnique({
        where: { key }
    });

    if (!setting && key === "SUBSCRIPTION_PRICE") {
        return { key, value: "199" };
    }

    if (!setting && key === "ENABLE_ROOM_MODULE") {
        return { key, value: "false" };
    }

    if (!setting && key === "ENABLE_CHATBOT") {
        return { key, value: "true" };
    }

    if (!setting && key === "PRODUCT_TAX_RATE") {
        return { key, value: "5" };
    }

    if (!setting && key === "DELIVERY_TAX_RATE") {
        return { key, value: "18" };
    }

    return setting || { key, value: null };
};

export const getPublicSystemSettings = async () => {
    try {
        const roomSetting = await db.systemSettings.findUnique({
            where: { key: "ENABLE_ROOM_MODULE" }
        });
        const isRoomEnabled = roomSetting?.value === "true";

        const botSetting = await db.systemSettings.findUnique({
            where: { key: "ENABLE_CHATBOT" }
        });
        const isChatbotEnabled = botSetting ? botSetting.value !== "false" : true;

        const productTaxSetting = await db.systemSettings.findUnique({
            where: { key: "PRODUCT_TAX_RATE" }
        });
        const productTaxRate = productTaxSetting ? parseFloat(productTaxSetting.value) || 5 : 5;

        const deliveryTaxSetting = await db.systemSettings.findUnique({
            where: { key: "DELIVERY_TAX_RATE" }
        });
        const deliveryTaxRate = deliveryTaxSetting ? parseFloat(deliveryTaxSetting.value) || 18 : 18;

        return {
            isRoomEnabled,
            ENABLE_ROOM_MODULE: isRoomEnabled ? "true" : "false",
            isChatbotEnabled,
            ENABLE_CHATBOT: isChatbotEnabled ? "true" : "false",
            productTaxRate,
            deliveryTaxRate,
            PRODUCT_TAX_RATE: productTaxRate.toString(),
            DELIVERY_TAX_RATE: deliveryTaxRate.toString()
        };
    } catch (e) {
        return {
            isRoomEnabled: false,
            ENABLE_ROOM_MODULE: "false",
            isChatbotEnabled: true,
            ENABLE_CHATBOT: "true",
            productTaxRate: 5,
            deliveryTaxRate: 18,
            PRODUCT_TAX_RATE: "5",
            DELIVERY_TAX_RATE: "18"
        };
    }
};

export const updateSystemSetting = async (req: Request) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to update system settings.", 401);
    }
    if (session.user.role !== "SUPERADMIN") {
        throw new ApiError("Access denied. Superadmin privileges required.", 403);
    }

    const body = await req.json();

    if (body.settings && typeof body.settings === "object") {
        const entries = Array.isArray(body.settings)
            ? body.settings
            : Object.entries(body.settings).map(([k, v]) => ({ key: k, value: String(v) }));

        const results = [];
        for (const item of entries) {
            if (item.key && item.value !== undefined) {
                const updated = await db.systemSettings.upsert({
                    where: { key: item.key },
                    update: { value: item.value.toString() },
                    create: { id: item.key, key: item.key, value: item.value.toString() }
                });
                results.push(updated);
            }
        }
        return { success: true, updated: results };
    }

    const { key, value } = body;

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

