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
