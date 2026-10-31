import { db } from "@/lib/db";
import { ApiError } from "@/lib/api-error";

export interface OrderTimerData {
    orderId: string;
    startedAt: string;
    delayMinutes: number;
    updatedAt: string;
}

declare global {
    var __orderEtaCache: Map<string, OrderTimerData> | undefined;
}

if (!globalThis.__orderEtaCache) {
    globalThis.__orderEtaCache = new Map<string, OrderTimerData>();
}

const etaCache: Map<string, OrderTimerData> = globalThis.__orderEtaCache;

const getSettingKey = (orderId: string) => `order_eta_${orderId}`;

const ACTIVE_ORDER_STATUSES = new Set([
    "PENDING",
    "PLACED",
    "ACCEPTED",
    "CONFIRMED",
    "PREPARING",
    "PICKED_UP",
    "OUT_FOR_DELIVERY",
]);

export async function getOrInitOrderTimer(
    order: { id: string; status?: string; createdAt?: Date | string; updatedAt?: Date | string },
    _resetIfExpired = false
): Promise<OrderTimerData | null> {
    if (!order?.id) return null;
    const status = (order.status || "").toUpperCase();
    if (!ACTIVE_ORDER_STATUSES.has(status)) {
        return null;
    }

    const key = getSettingKey(order.id);
    const now = Date.now();

    let existing = etaCache.get(order.id);
    if (!existing) {
        try {
            const record = await db.systemSettings.findUnique({ where: { key } });
            if (record?.value) {
                const parsed = JSON.parse(record.value);
                if (parsed && parsed.startedAt) {
                    existing = {
                        orderId: order.id,
                        startedAt: parsed.startedAt,
                        delayMinutes: Number(parsed.delayMinutes) || 0,
                        updatedAt: parsed.updatedAt || parsed.startedAt,
                    };
                    etaCache.set(order.id, existing);
                }
            }
        } catch (err) {
            console.error(`[OrderETA] Error reading timer for order ${order.id}:`, err);
        }
    }

    if (existing) {
        const startedMs = new Date(existing.startedAt).getTime();
        const isCorrupt = isNaN(startedMs) || startedMs <= 0;
        if (!isCorrupt) {
            return existing;
        }
    }

    // Determine initial startedAt anchored to order creation in database
    let orderCreatedMs: number | null = null;
    if (order.createdAt) {
        const parsedMs = new Date(order.createdAt).getTime();
        if (!isNaN(parsedMs) && parsedMs > 0) {
            orderCreatedMs = parsedMs;
        }
    }

    if (!orderCreatedMs) {
        try {
            const dbOrder = await db.order.findUnique({
                where: { id: order.id },
                select: { createdAt: true },
            });
            if (dbOrder?.createdAt) {
                const parsedMs = new Date(dbOrder.createdAt).getTime();
                if (!isNaN(parsedMs) && parsedMs > 0) {
                    orderCreatedMs = parsedMs;
                }
            }
        } catch (err) {
            console.error(`[OrderETA] Error looking up createdAt for order ${order.id}:`, err);
        }
    }

    const initialStartedAt = (orderCreatedMs && orderCreatedMs > 0)
        ? new Date(orderCreatedMs).toISOString()
        : new Date(now).toISOString();

    const freshTimer: OrderTimerData = {
        orderId: order.id,
        startedAt: initialStartedAt,
        delayMinutes: 0,
        updatedAt: new Date(now).toISOString(),
    };

    etaCache.set(order.id, freshTimer);

    try {
        await db.systemSettings.upsert({
            where: { key },
            update: { value: JSON.stringify(freshTimer) },
            create: {
                id: key,
                key,
                value: JSON.stringify(freshTimer),
            },
        });
    } catch (err) {
        console.error(`[OrderETA] Error saving timer for order ${order.id}:`, err);
    }

    return freshTimer;
}

export async function addOrderDelayMinutes(orderId: string, rawMinutes: number): Promise<OrderTimerData> {
    const added = Math.round(Number(rawMinutes));
    if (!Number.isFinite(added) || added < 1) {
        throw new ApiError("Delay minutes must be at least 1 minute.", 400);
    }
    if (added > 30) {
        throw new ApiError("Custom delay cannot exceed 30 minutes.", 400);
    }

    const current = (await getOrInitOrderTimer({ id: orderId, status: "OUT_FOR_DELIVERY" })) || {
        orderId,
        startedAt: new Date().toISOString(),
        delayMinutes: 0,
        updatedAt: new Date().toISOString(),
    };

    const updatedTimer: OrderTimerData = {
        ...current,
        delayMinutes: (Number(current.delayMinutes) || 0) + added,
        updatedAt: new Date().toISOString(),
    };

    const key = getSettingKey(orderId);
    etaCache.set(orderId, updatedTimer);

    try {
        await db.systemSettings.upsert({
            where: { key },
            update: { value: JSON.stringify(updatedTimer) },
            create: {
                id: key,
                key,
                value: JSON.stringify(updatedTimer),
            },
        });
    } catch (err) {
        console.error(`[OrderETA] Error updating delay for order ${orderId}:`, err);
    }

    return updatedTimer;
}

export async function enrichOrderWithEta<T extends { id: string; status?: string }>(order: T): Promise<T & {
    deliveryTimerStartedAt?: string | null;
    deliveryDelayMinutes?: number;
}> {
    if (!order) return order;
    const status = (order.status || "").toUpperCase();
    if (!ACTIVE_ORDER_STATUSES.has(status)) {
        return {
            ...order,
            deliveryTimerStartedAt: null,
            deliveryDelayMinutes: 0,
        };
    }

    const timer = await getOrInitOrderTimer(order);
    return {
        ...order,
        deliveryTimerStartedAt: timer?.startedAt || new Date().toISOString(),
        deliveryDelayMinutes: timer?.delayMinutes || 0,
    };
}

export async function enrichOrdersWithEta<T extends { id: string; status?: string }>(orders: T[]): Promise<Array<T & {
    deliveryTimerStartedAt?: string | null;
    deliveryDelayMinutes?: number;
}>> {
    if (!Array.isArray(orders) || orders.length === 0) return [];

    const activeOrders = orders.filter((o) => ACTIVE_ORDER_STATUSES.has((o.status || "").toUpperCase()));
    if (activeOrders.length > 0) {
        const missingKeys = activeOrders
            .filter((o) => !etaCache.has(o.id))
            .map((o) => getSettingKey(o.id));

        if (missingKeys.length > 0) {
            try {
                const records = await db.systemSettings.findMany({
                    where: { key: { in: missingKeys } },
                });
                for (const rec of records) {
                    try {
                        const parsed = JSON.parse(rec.value);
                        if (parsed?.orderId && parsed?.startedAt) {
                            etaCache.set(parsed.orderId, {
                                orderId: parsed.orderId,
                                startedAt: parsed.startedAt,
                                delayMinutes: Number(parsed.delayMinutes) || 0,
                                updatedAt: parsed.updatedAt || parsed.startedAt,
                            });
                        }
                    } catch {}
                }
            } catch (err) {
                console.error("[OrderETA] Error batch-fetching order timers:", err);
            }
        }
    }

    return Promise.all(orders.map((o) => enrichOrderWithEta(o)));
}
