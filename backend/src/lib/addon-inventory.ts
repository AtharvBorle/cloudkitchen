import { Prisma } from "@prisma/client";

export interface ParsedAddonPurchase {
    id: string;
    name: string;
    price: number;
    quantity: number;
    lineTotal: number;
}

/**
 * Extracts and aggregates all add-on quantities from raw order items.
 */
export function extractOrderAddons(itemsRaw: any): Map<string, { id: string; name: string; quantity: number }> {
    const addonsMap = new Map<string, { id: string; name: string; quantity: number }>();
    if (!itemsRaw) return addonsMap;

    let itemsList: any[] = [];
    try {
        itemsList = typeof itemsRaw === "string" ? JSON.parse(itemsRaw) : itemsRaw;
    } catch {
        return addonsMap;
    }

    if (!Array.isArray(itemsList)) return addonsMap;

    for (const item of itemsList) {
        const itemQty = Number(item.quantity || item.qty) || 1;
        const selectedAddons = item.selectedAddons || item.addons;
        if (Array.isArray(selectedAddons)) {
            for (const addon of selectedAddons) {
                if (!addon || !addon.id) continue;
                const addonId = String(addon.id);
                const addonQty = (Number(addon.quantity) || 1) * itemQty;
                const existing = addonsMap.get(addonId) || {
                    id: addonId,
                    name: String(addon.name || "Add-on"),
                    quantity: 0
                };
                existing.quantity += addonQty;
                addonsMap.set(addonId, existing);
            }
        }
    }

    return addonsMap;
}

/**
 * Safely restores add-on inventory stock in a database transaction upon order cancellation or expiry.
 * Strictly idempotent when invoked inside a winning newlyCancelled claim block.
 */
export async function restoreOrderAddonsStock(
    tx: any,
    orderId: string,
    itemsRaw: any,
    reason: string = "Order cancellation"
): Promise<number> {
    const aggregatedAddons = extractOrderAddons(itemsRaw);
    if (aggregatedAddons.size === 0) return 0;

    let restoredCount = 0;

    for (const [addonId, { name, quantity }] of aggregatedAddons.entries()) {
        if (quantity <= 0) continue;

        try {
            const currentAddon = await tx.addon.findUnique({
                where: { id: addonId }
            });

            if (currentAddon) {
                const newStock = currentAddon.stockQuantity + quantity;
                await tx.addon.update({
                    where: { id: addonId },
                    data: {
                        stockQuantity: { increment: quantity }
                    }
                });

                await tx.addonInventoryLog.create({
                    data: {
                        addonId,
                        orderId,
                        action: "ORDER_RESTORE",
                        quantityDelta: quantity,
                        previousStock: currentAddon.stockQuantity,
                        newStock,
                        note: `Restored ${quantity} units for order #${orderId} (${reason})`
                    }
                });

                restoredCount++;
            }
        } catch (err) {
            console.error(`[AddonInventory] Failed to restore stock for addon ${addonId} in order #${orderId}:`, err);
        }
    }

    return restoredCount;
}
