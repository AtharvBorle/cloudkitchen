import { EventEmitter } from "events";

// Use globalThis to persist the EventEmitter across Next.js dev server hot-reloads
declare global {
  var __realtimeEmitter: EventEmitter | undefined;
}

if (!globalThis.__realtimeEmitter) {
  globalThis.__realtimeEmitter = new EventEmitter();
  // Set unlimited listeners since many SSE clients can connect
  globalThis.__realtimeEmitter.setMaxListeners(0);
}

export const realtimeEmitter: EventEmitter = globalThis.__realtimeEmitter;

export interface RealtimeOrderPayload {
  event: "ORDER_CREATED" | "ORDER_UPDATED" | "ORDER_CANCELLED" | "ORDER_STATUS_CHANGED" | "DASHBOARD_REFRESH";
  order?: any;
  orderId?: string;
  status?: string;
  sellerId?: string;
  userId?: string;
  deliveryPersonId?: string | null;
  timestamp: string;
}

/**
 * Dispatch when a new customer order is placed.
 */
export function emitOrderCreated(order: any) {
  const payload: RealtimeOrderPayload = {
    event: "ORDER_CREATED",
    order,
    orderId: order.id,
    status: order.status,
    sellerId: order.sellerId,
    userId: order.userId,
    deliveryPersonId: order.deliveryPersonId || null,
    timestamp: new Date().toISOString(),
  };

  // Notify seller specific channel
  if (order.sellerId) {
    realtimeEmitter.emit(`seller:${order.sellerId}`, payload);
  }
  // Notify customer
  if (order.userId) {
    realtimeEmitter.emit(`user:${order.userId}`, payload);
  }
  // Notify delivery pool for unassigned orders
  realtimeEmitter.emit("delivery:available", payload);
  // Broadcast to global seller channel if needed
  realtimeEmitter.emit("seller:all", payload);
}

/**
 * Dispatch when an order is updated (accepted, preparing, ready, out for delivery, delivered, cancelled).
 */
export function emitOrderUpdated(order: any) {
  const payload: RealtimeOrderPayload = {
    event: "ORDER_UPDATED",
    order,
    orderId: order.id,
    status: order.status,
    sellerId: order.sellerId,
    userId: order.userId,
    deliveryPersonId: order.deliveryPersonId || null,
    timestamp: new Date().toISOString(),
  };

  if (order.sellerId) {
    realtimeEmitter.emit(`seller:${order.sellerId}`, payload);
  }
  if (order.userId) {
    realtimeEmitter.emit(`user:${order.userId}`, payload);
  }
  if (order.deliveryPersonId) {
    realtimeEmitter.emit(`delivery:${order.deliveryPersonId}`, payload);
  }
  realtimeEmitter.emit(`order:${order.id}`, payload);
  realtimeEmitter.emit("seller:all", payload);
}

/**
 * Dispatch when an order is cancelled.
 */
export function emitOrderCancelled(order: any) {
  const payload: RealtimeOrderPayload = {
    event: "ORDER_CANCELLED",
    order,
    orderId: order.id,
    status: "CANCELLED",
    sellerId: order.sellerId,
    userId: order.userId,
    deliveryPersonId: order.deliveryPersonId || null,
    timestamp: new Date().toISOString(),
  };

  if (order.sellerId) {
    realtimeEmitter.emit(`seller:${order.sellerId}`, payload);
  }
  if (order.userId) {
    realtimeEmitter.emit(`user:${order.userId}`, payload);
  }
  if (order.deliveryPersonId) {
    realtimeEmitter.emit(`delivery:${order.deliveryPersonId}`, payload);
  }
  realtimeEmitter.emit(`order:${order.id}`, payload);
  realtimeEmitter.emit("seller:all", payload);
}

/**
 * Dispatch dashboard refresh trigger to seller
 */
export function emitSellerDashboardRefresh(sellerId: string) {
  const payload: RealtimeOrderPayload = {
    event: "DASHBOARD_REFRESH",
    sellerId,
    timestamp: new Date().toISOString(),
  };
  realtimeEmitter.emit(`seller:${sellerId}`, payload);
}

export interface RealtimeLivePayload {
  event:
    | "COUPON_UPDATED"
    | "SELLER_STATUS_CHANGED"
    | "MENU_UPDATED"
    | "BANNER_UPDATED"
    | "CATEGORY_UPDATED"
    | "REEL_UPDATED"
    | "ROOM_UPDATED"
    | "CATALOGUE_UPDATED";
  sellerId?: string | null;
  coupon?: any;
  action?: "CREATE" | "UPDATE" | "DELETE" | "TOGGLE";
  isOnline?: boolean;
  type?: string;
  details?: any;
  timestamp: string;
}

/**
 * Dispatch when a coupon is created, updated, toggled, or deleted.
 */
export function emitCouponChanged(coupon: any, action: "CREATE" | "UPDATE" | "DELETE" | "TOGGLE" = "UPDATE") {
  const sellerId = coupon?.appliesToSellerId || coupon?.sellerId || null;
  const payload: RealtimeLivePayload = {
    event: "COUPON_UPDATED",
    sellerId: sellerId && sellerId !== "GLOBAL" && sellerId !== "ALL" ? String(sellerId) : null,
    coupon: {
      id: coupon?.id,
      code: coupon?.code,
      discountType: coupon?.discountType,
      discountPercentage: coupon?.discountPercentage,
      discountAmount: coupon?.discountAmount,
      minimumCartValue: coupon?.minimumCartValue ?? coupon?.minOrderAmount,
      isAutoApply: Boolean(coupon?.isAutoApply || coupon?.autoApply),
      isActive: coupon?.isActive,
      status: coupon?.status,
      appliesToSellerId: coupon?.appliesToSellerId,
      appliesToProductId: coupon?.appliesToProductId,
    },
    action,
    timestamp: new Date().toISOString(),
  };

  realtimeEmitter.emit("public:live", payload);
  if (payload.sellerId) {
    realtimeEmitter.emit(`public:seller:${payload.sellerId}`, payload);
  }
}

/**
 * Dispatch when a seller's online/offline status changes.
 */
export function emitSellerStatusChanged(sellerId: string, isOnline: boolean) {
  const payload: RealtimeLivePayload = {
    event: "SELLER_STATUS_CHANGED",
    sellerId: String(sellerId),
    isOnline,
    timestamp: new Date().toISOString(),
  };

  realtimeEmitter.emit("public:live", payload);
  realtimeEmitter.emit(`public:seller:${sellerId}`, payload);
}

/**
 * Dispatch when a seller's menu items or prices are created, updated, or deleted.
 */
export function emitMenuUpdated(sellerId: string) {
  const payload: RealtimeLivePayload = {
    event: "MENU_UPDATED",
    sellerId: String(sellerId),
    timestamp: new Date().toISOString(),
  };

  realtimeEmitter.emit("public:live", payload);
  realtimeEmitter.emit(`public:seller:${sellerId}`, payload);
}

/**
 * Dispatch when promotional banners or popup banners are created, updated, or deleted.
 */
export function emitBannerUpdated(action: "CREATE" | "UPDATE" | "DELETE" = "UPDATE", details?: any) {
  const payload: RealtimeLivePayload = {
    event: "BANNER_UPDATED",
    action,
    details,
    timestamp: new Date().toISOString(),
  };

  realtimeEmitter.emit("public:live", payload);
}

/**
 * Dispatch when food categories or subcategories are created, updated, or deleted.
 */
export function emitCategoryUpdated(action: "CREATE" | "UPDATE" | "DELETE" = "UPDATE", details?: any) {
  const payload: RealtimeLivePayload = {
    event: "CATEGORY_UPDATED",
    action,
    details,
    timestamp: new Date().toISOString(),
  };

  realtimeEmitter.emit("public:live", payload);
}

/**
 * Dispatch when curated video reels are created, updated, or deleted.
 */
export function emitReelUpdated(action: "CREATE" | "UPDATE" | "DELETE" = "UPDATE", details?: any) {
  const payload: RealtimeLivePayload = {
    event: "REEL_UPDATED",
    action,
    details,
    timestamp: new Date().toISOString(),
  };

  realtimeEmitter.emit("public:live", payload);
}

/**
 * Dispatch when rooms/properties are created, updated, or deleted.
 */
export function emitRoomUpdated(sellerId?: string | null, action: "CREATE" | "UPDATE" | "DELETE" = "UPDATE") {
  const payload: RealtimeLivePayload = {
    event: "ROOM_UPDATED",
    sellerId: sellerId ? String(sellerId) : null,
    action,
    timestamp: new Date().toISOString(),
  };

  realtimeEmitter.emit("public:live", payload);
  if (sellerId) {
    realtimeEmitter.emit(`public:seller:${sellerId}`, payload);
  }
}

/**
 * Dispatch general catalogue update (combines dishes, kitchens, categories, explore catalogue).
 */
export function emitCatalogueUpdated(type: string, sellerId?: string | null) {
  const payload: RealtimeLivePayload = {
    event: "CATALOGUE_UPDATED",
    type,
    sellerId: sellerId ? String(sellerId) : null,
    timestamp: new Date().toISOString(),
  };

  realtimeEmitter.emit("public:live", payload);
  if (sellerId) {
    realtimeEmitter.emit(`public:seller:${sellerId}`, payload);
  }
}
