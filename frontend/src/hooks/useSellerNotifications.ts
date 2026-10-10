"use client";

import { useState, useEffect } from "react";
import {
  SellerNotificationItem,
  NotificationCategory,
  INITIAL_SELLER_NOTIFICATIONS,
  createSampleAlert,
  formatNotificationTime,
} from "@/components/seller/seller-notifications/notificationData";
import { fetchApi } from "@/lib/fetch-api";

const STORAGE_KEY = "seller_notifications_store_v4";

let memoryNotifications: SellerNotificationItem[] | null = null;
const listeners = new Set<() => void>();

function notifyAll() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error("Error in notification listener:", e);
    }
  });
}

function loadInitialFromStorage(): SellerNotificationItem[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    // Purge legacy mock storage keys to eliminate outdated hardcoded 4 count
    try {
      localStorage.removeItem("seller_notifications_store");
      localStorage.removeItem("seller_notifications_store_v2");
      localStorage.removeItem("seller_notifications_store_v3");
    } catch {}

    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Failed to load notifications from localStorage:", err);
  }
  return [];
}

function persistNotifications(items: SellerNotificationItem[], shouldBroadcast = true) {
  memoryNotifications = items;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.error("Failed to persist notifications:", err);
    }

    if (shouldBroadcast) {
      try {
        if ("BroadcastChannel" in window) {
          const bc = new BroadcastChannel("cloudkitchen_seller_notifications_bc");
          bc.postMessage({ type: "SYNC_NOTIFICATIONS", payload: items });
          bc.close();
        }
      } catch {}
    }
  }
  notifyAll();
}

export function getGlobalSellerNotifications(): SellerNotificationItem[] {
  if (memoryNotifications === null) {
    memoryNotifications = loadInitialFromStorage();
  }
  return memoryNotifications;
}

export function getGlobalUnreadCount(): number {
  const items = getGlobalSellerNotifications();
  return items.filter((n) => !n.isRead).length;
}

export function markNotificationAsRead(id: string) {
  const current = getGlobalSellerNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, isRead: true } : n));
  persistNotifications(updated);
}

export function toggleNotificationRead(id: string) {
  const current = getGlobalSellerNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n));
  persistNotifications(updated);
}

export function deleteSellerNotification(id: string) {
  const current = getGlobalSellerNotifications();
  const updated = current.filter((n) => n.id !== id);
  persistNotifications(updated);
}

export function markAllSellerNotificationsAsRead() {
  const current = getGlobalSellerNotifications();
  const updated = current.map((n) => ({ ...n, isRead: true }));
  persistNotifications(updated);
}

export function clearAllSellerNotifications() {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("seller_notifications_cleared", "true");
    } catch {}
  }
  persistNotifications([]);
}

export function addSellerNotification(
  item: Omit<SellerNotificationItem, "id" | "timestamp" | "timeAgo" | "isRead"> & {
    id?: string;
    timestamp?: string;
    timeAgo?: string;
    isRead?: boolean;
  }
) {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("seller_notifications_cleared");
    } catch {}
  }
  const current = getGlobalSellerNotifications();
  const newItemId = item.id || `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const rawTimestamp = item.timestamp || new Date().toISOString();
  const newItem: SellerNotificationItem = {
    id: newItemId,
    category: item.category,
    settingKey: item.settingKey || "orderAlerts",
    title: item.title,
    message: item.message,
    details: item.details,
    timestamp: rawTimestamp,
    timeAgo: formatNotificationTime(rawTimestamp, item.timeAgo || "Just now"),
    isRead: item.isRead !== undefined ? item.isRead : false,
    severity: item.severity || "info",
    actionLabel: item.actionLabel,
    actionHref: item.actionHref,
  };

  // If already present, update in-place with latest info
  const existingIndex = current.findIndex(
    (n) =>
      n.id === newItemId ||
      (newItemId.startsWith("stock-") && n.id === `notif-${newItemId}`) ||
      (newItemId.startsWith("stock-") && n.id === `notif-stock-${newItemId.replace("stock-", "")}`) ||
      (newItemId.startsWith("bk-") && (n.id === `notif-book-${newItemId.replace("bk-", "")}` || n.id === newItemId)) ||
      (newItemId.startsWith("notif-book-") && (n.id === `bk-${newItemId.replace("notif-book-", "")}` || n.id === newItemId))
  );

  if (existingIndex !== -1) {
    const updated = [...current];
    updated[existingIndex] = {
      ...updated[existingIndex],
      ...newItem,
      isRead: item.isRead !== undefined ? item.isRead : false,
    };
    persistNotifications(updated);
    return updated[existingIndex];
  }

  persistNotifications([newItem, ...current]);
  return newItem;
}

export interface PlacedOrderNotificationPayload {
  orderId: string;
  customerName: string;
  customerPhone?: string;
  deliveryAddress?: string;
  items: Array<{ name: string; qty?: number; quantity?: number; price?: number }>;
  totalAmount: number | string;
  paymentMethod?: string;
  sellerId?: string;
  createdAt?: string;
  timestamp?: string;
}

/**
 * Broadcasts a newly placed order from customer checkout into the seller notification center
 * with food item names, order total, and customer details.
 */
export function broadcastOrderToSellerNotifications(payload: PlacedOrderNotificationPayload) {
  const itemsText = (payload.items || [])
    .map((i) => `${i.qty || i.quantity || 1}x ${i.name}`)
    .join(", ") || "Food order items";

  const totalStr = typeof payload.totalAmount === "number" ? `₹${payload.totalAmount.toLocaleString("en-IN")}` : payload.totalAmount;
  const payMethod = payload.paymentMethod || "COD";
  const customer = payload.customerName || "Customer";
  const phone = payload.customerPhone ? ` • Phone: ${payload.customerPhone}` : "";
  const address = payload.deliveryAddress ? ` • Address: ${payload.deliveryAddress}` : "";
  const rawTimestamp = payload.createdAt || payload.timestamp || new Date().toISOString();

  const notifItem: SellerNotificationItem = {
    id: `notif-order-${payload.orderId || Date.now()}`,
    category: "orders",
    settingKey: "orderAlerts",
    title: `New Order Received #${payload.orderId}`,
    message: `${itemsText}. Total: ${totalStr} (${payMethod}).`,
    details: `Customer: ${customer}${phone}${address}`,
    timestamp: rawTimestamp,
    timeAgo: formatNotificationTime(rawTimestamp, "Just now"),
    isRead: false,
    severity: "success",
    actionLabel: "View Order",
    actionHref: payload.orderId ? `/seller/orders/details?orderId=${encodeURIComponent(payload.orderId)}` : "/seller/orders",
  };

  addSellerNotification(notifItem);

  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("cloudkitchen-new-order", { detail: notifItem }));
      if ("BroadcastChannel" in window) {
        const bc = new BroadcastChannel("cloudkitchen_seller_notifications_bc");
        bc.postMessage({ type: "NEW_ORDER_NOTIFICATION", payload: notifItem });
        bc.close();
      }
    } catch {}
  }
}

export function broadcastStockAlert(payload: {
  itemId?: string;
  itemName: string;
  currentStock: number;
  threshold?: number;
}) {
  const cleanId = payload.itemId || `item-${Date.now()}`;
  const notifId = `stock-${cleanId}`;
  const isOutOfStock = payload.currentStock === 0;
  const isLowStock = !isOutOfStock && payload.currentStock <= 5;

  let title = `Stock & Inventory: ${payload.itemName}`;
  let message = `Current available inventory for "${payload.itemName}" is ${payload.currentStock} units in stock.`;
  let severity: SellerNotificationItem["severity"] = "success";

  if (isOutOfStock) {
    title = `Out of Stock: ${payload.itemName}`;
    message = `Inventory for "${payload.itemName}" is completely depleted (0 units). Item paused.`;
    severity = "critical";
  } else if (isLowStock) {
    title = `Low Stock Alert: ${payload.itemName}`;
    message = `Only ${payload.currentStock} units remaining for "${payload.itemName}". Restock item soon.`;
    severity = "warning";
  } else {
    title = `Stock & Inventory: ${payload.itemName}`;
    message = `Current available inventory for "${payload.itemName}" is ${payload.currentStock} units in stock.`;
    severity = "success";
  }

  const notifItem: SellerNotificationItem = {
    id: notifId,
    category: "stock",
    settingKey: "lowStockAlert",
    title,
    message,
    details: `Current Stock: ${payload.currentStock} units available.`,
    timestamp: new Date().toISOString(),
    timeAgo: "Just now",
    isRead: false,
    severity,
    actionLabel: "Manage Stock",
    actionHref: "/seller/menu",
  };

  addSellerNotification(notifItem);

  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("cloudkitchen-new-notification", { detail: notifItem }));
      if ("BroadcastChannel" in window) {
        const bc = new BroadcastChannel("cloudkitchen_seller_notifications_bc");
        bc.postMessage({ type: "NEW_NOTIFICATION", payload: notifItem });
        bc.close();
      }
    } catch {}
  }
}

export function broadcastDeliveryAlert(payload: {
  orderId: string;
  riderName: string;
  riderPhone?: string;
  status?: string;
  eta?: string;
  timestamp?: string;
}) {
  const isOut = payload.status === "OUT_FOR_DELIVERY" || payload.status === "ON_THE_WAY";
  const rawTimestamp = payload.timestamp || new Date().toISOString();
  const cleanId = payload.orderId ? payload.orderId.replace(/^ORD-/, "").trim() : "";
  const notifItem: SellerNotificationItem = {
    id: `notif-deliv-${payload.orderId || Date.now()}`,
    category: "delivery",
    settingKey: isOut ? "outForDeliveryAlert" : "riderAssignedAlert",
    title: isOut ? `Out for Delivery: Order #${payload.orderId}` : `Rider Assigned: ${payload.riderName}`,
    message: isOut
      ? `Delivery partner ${payload.riderName} has dispatched parcel for Order #${payload.orderId}. ETA: ${payload.eta || "15 mins"}.`
      : `${payload.riderName} accepted dispatch for Order #${payload.orderId}. Arriving at kitchen soon.`,
    details: `Rider Contact: ${payload.riderPhone || "+91 98765 12345"}`,
    timestamp: rawTimestamp,
    timeAgo: formatNotificationTime(rawTimestamp, "Just now"),
    isRead: false,
    severity: "info",
    actionLabel: "Track Dispatch",
    actionHref: cleanId ? `/seller/orders/details?orderId=${cleanId}` : "/seller/orders",
  };

  addSellerNotification(notifItem);

  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("cloudkitchen-new-notification", { detail: notifItem }));
      if ("BroadcastChannel" in window) {
        const bc = new BroadcastChannel("cloudkitchen_seller_notifications_bc");
        bc.postMessage({ type: "NEW_NOTIFICATION", payload: notifItem });
        bc.close();
      }
    } catch {}
  }
}

export function broadcastShopTimingAlert(payload: {
  isOpen: boolean;
  closingInMinutes?: number;
  customMessage?: string;
}) {
  const notifItem: SellerNotificationItem = {
    id: `notif-timing-${Date.now()}`,
    category: "timings",
    settingKey: payload.closingInMinutes ? "closingReminder30Min" : "openingScheduleAlert",
    title: payload.closingInMinutes
      ? `Kitchen Closing in ${payload.closingInMinutes} Minutes`
      : (payload.isOpen ? "Store is Now Online" : "Store Switched to Offline"),
    message: payload.customMessage || (
      payload.isOpen
        ? "Your kitchen storefront is active and receiving live customer orders."
        : "Your kitchen is currently closed. New incoming orders are paused."
    ),
    details: "Operating schedule updated in Seller Topbar & Preferences.",
    timestamp: new Date().toISOString(),
    timeAgo: "Just now",
    isRead: false,
    severity: payload.isOpen ? "success" : "warning",
    actionLabel: "Shop Schedule",
    actionHref: "/seller/settings",
  };

  addSellerNotification(notifItem);

  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("cloudkitchen-new-notification", { detail: notifItem }));
      if ("BroadcastChannel" in window) {
        const bc = new BroadcastChannel("cloudkitchen_seller_notifications_bc");
        bc.postMessage({ type: "NEW_NOTIFICATION", payload: notifItem });
        bc.close();
      }
    } catch {}
  }
}

export function broadcastBookingAlert(payload: {
  bookingId?: string;
  guestName: string;
  guestPhone?: string;
  roomName: string;
  nightsCount?: number;
  totalAmount: number | string;
  checkInDate?: string;
  checkOutDate?: string;
  status?: string;
}) {
  const bId = payload.bookingId || `BK-${Math.floor(1000 + Math.random() * 9000)}`;
  const cleanId = bId.startsWith("bk-") ? bId.replace("bk-", "") : bId;
  const notifId = `bk-${cleanId}`;
  const totalStr = typeof payload.totalAmount === "number" ? `₹${payload.totalAmount.toLocaleString("en-IN")}` : `₹${payload.totalAmount}`;
  const stayText = payload.nightsCount ? ` (${payload.nightsCount} night${payload.nightsCount > 1 ? "s" : ""})` : "";
  const datesText = payload.checkInDate
    ? ` • Check-in: ${payload.checkInDate}${payload.checkOutDate ? ` to ${payload.checkOutDate}` : ""}`
    : "";
  const phoneText = payload.guestPhone ? ` • Phone: ${payload.guestPhone}` : "";
  const statusUpper = (payload.status || "CONFIRMED").toUpperCase();
  const severity: SellerNotificationItem["severity"] =
    statusUpper === "CANCELLED" ? "critical" : (statusUpper === "CONFIRMED" || statusUpper === "PAID") ? "success" : "info";

  const notifItem: SellerNotificationItem = {
    id: notifId,
    category: "bookings",
    settingKey: "bookingRequestAlert",
    title: `Room Reservation #${cleanId.slice(-6).toUpperCase()}: ${payload.roomName}`,
    message: `${payload.roomName} reserved for ${payload.guestName}${stayText}. Total: ${totalStr} [${statusUpper}].`,
    details: `Guest: ${payload.guestName}${phoneText}${datesText}`,
    timestamp: new Date().toISOString(),
    timeAgo: "Just now",
    isRead: false,
    severity,
    actionLabel: "View Bookings",
    actionHref: "/seller/booking",
  };

  addSellerNotification(notifItem);

  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("cloudkitchen-new-notification", { detail: notifItem }));
      if ("BroadcastChannel" in window) {
        const bc = new BroadcastChannel("cloudkitchen_seller_notifications_bc");
        bc.postMessage({ type: "NEW_NOTIFICATION", payload: notifItem });
        bc.close();
      }
    } catch {}
  }
}

export function broadcastReviewAlert(payload: {
  customerName: string;
  rating: number;
  dishName?: string;
  comment?: string;
}) {
  const notifItem: SellerNotificationItem = {
    id: `notif-rev-${Date.now()}`,
    category: "reviews",
    settingKey: payload.rating <= 2 ? "negativeReviewAlert" : "newRatingAlert",
    title: `New Customer Feedback: ${payload.rating} ★ Rating`,
    message: `${payload.customerName} submitted a ${payload.rating}-star review: "${payload.comment || "Great taste and packaging!"}"`,
    details: payload.dishName ? `Reviewed item: ${payload.dishName}` : "Customer feedback on restaurant storefront.",
    timestamp: new Date().toISOString(),
    timeAgo: "Just now",
    isRead: false,
    severity: payload.rating >= 4 ? "success" : payload.rating === 3 ? "info" : "warning",
    actionLabel: "View Reviews",
    actionHref: "/seller/reviews",
  };

  addSellerNotification(notifItem);

  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("cloudkitchen-new-notification", { detail: notifItem }));
      if ("BroadcastChannel" in window) {
        const bc = new BroadcastChannel("cloudkitchen_seller_notifications_bc");
        bc.postMessage({ type: "NEW_NOTIFICATION", payload: notifItem });
        bc.close();
      }
    } catch {}
  }
}

export function generateSampleSellerAlert(category: NotificationCategory = "orders") {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("seller_notifications_cleared");
    } catch {}
  }
  const alert = createSampleAlert(category);
  const current = getGlobalSellerNotifications();
  persistNotifications([alert, ...current]);
  return alert;
}

export function resetSellerNotificationsToDefaults() {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("seller_notifications_cleared");
    } catch {}
  }
  persistNotifications(INITIAL_SELLER_NOTIFICATIONS);
}

// Global cross-tab and SSE listener initializer
let isGlobalListenerInitialized = false;

function setupGlobalNotificationListeners() {
  if (isGlobalListenerInitialized || typeof window === "undefined") return;
  isGlobalListenerInitialized = true;

  // 1. Cross-tab BroadcastChannel listener
  try {
    if ("BroadcastChannel" in window) {
      const bc = new BroadcastChannel("cloudkitchen_seller_notifications_bc");
      bc.onmessage = (event) => {
        if ((event.data?.type === "NEW_ORDER_NOTIFICATION" || event.data?.type === "NEW_NOTIFICATION") && event.data.payload) {
          addSellerNotification(event.data.payload);
        } else if (event.data?.type === "SYNC_NOTIFICATIONS" && Array.isArray(event.data.payload)) {
          memoryNotifications = event.data.payload;
          notifyAll();
        }
      };
    }
  } catch {}

  // 2. Storage event listener (when localStorage updates in another tab)
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (Array.isArray(parsed)) {
          memoryNotifications = parsed;
          notifyAll();
        }
      } catch {}
    }
  });

  // 3. Custom window order & notification placement event listeners
  window.addEventListener("cloudkitchen-new-order", (e: any) => {
    if (e.detail) {
      addSellerNotification(e.detail);
    }
  });

  window.addEventListener("cloudkitchen-new-notification", (e: any) => {
    if (e.detail) {
      addSellerNotification(e.detail);
    }
  });

  // 4. SSE real-time order stream listener
  window.addEventListener("realtime-order", (e: any) => {
    const payload = e.detail;
    if (payload && (payload.event === "ORDER_CREATED" || payload.event === "DASHBOARD_REFRESH") && payload.order) {
      const o = payload.order;
      let itemsSummary = "";
      try {
        const parsed = typeof o.items === "string" ? JSON.parse(o.items) : o.items;
        if (Array.isArray(parsed)) {
          itemsSummary = parsed.map((i: any) => `${i.quantity || i.qty || 1}x ${i.name}`).join(", ");
        }
      } catch {
        itemsSummary = "Kitchen Items";
      }

      const orderId = o.id || payload.orderId || `ORD-${Date.now().toString().slice(-4)}`;
      const customer = o.user?.name || o.customerName || "Customer";
      const phone = o.customerPhone || o.user?.phone || "";
      const address = o.deliveryAddress || "";

      addSellerNotification({
        id: `notif-order-${orderId}`,
        category: "orders",
        settingKey: "orderAlerts",
        title: `New Incoming Order #${orderId}`,
        message: `${itemsSummary || "1x Food Item"}. Total: ₹${o.totalAmount || 0}.`,
        details: `Customer: ${customer}${phone ? ` • Phone: ${phone}` : ""}${address ? ` • Address: ${address}` : ""}`,
        timestamp: o.createdAt || new Date().toISOString(),
        severity: "success",
        actionLabel: "View Order",
        actionHref: `/seller/orders/details?orderId=${encodeURIComponent(orderId)}`,
      });
    }
  });
}

export async function syncNotificationsFromBackend() {
  if (typeof window === "undefined") return;
  try {
    const res = await fetchApi("/api/seller/notifications");
    if (!res.ok) return;
    const json = await res.json();
    const serverNotifications: SellerNotificationItem[] =
      json.data?.notifications || json.notifications || [];
    if (!Array.isArray(serverNotifications) || serverNotifications.length === 0) return;

    const current = getGlobalSellerNotifications();
    const updated = [...current];

    serverNotifications.forEach((serverItem) => {
      const matchIndex = updated.findIndex(
        (n) =>
          n.id === serverItem.id ||
          (serverItem.id.startsWith("stock-") && (n.id === `notif-${serverItem.id}` || n.id === `notif-stock-${serverItem.id.replace("stock-", "")}`)) ||
          (serverItem.id.startsWith("bk-") && (n.id === `notif-book-${serverItem.id.replace("bk-", "")}` || n.id === serverItem.id)) ||
          (serverItem.id.startsWith("notif-book-") && (n.id === `bk-${serverItem.id.replace("notif-book-", "")}` || n.id === serverItem.id)) ||
          (serverItem.id.startsWith("ord-") && (n.id === `notif-order-${serverItem.id.replace(/^ord-[a-z]+-/, "")}` || n.id === serverItem.id)) ||
          (serverItem.id.startsWith("notif-order-") && (n.id === `ord-new-${serverItem.id.replace("notif-order-", "")}` || n.id === serverItem.id))
      );

      if (matchIndex !== -1) {
        const existingIsRead = updated[matchIndex].isRead;
        updated[matchIndex] = {
          ...serverItem,
          ...updated[matchIndex],
          id: serverItem.id,
          title: serverItem.title,
          message: serverItem.message,
          details: serverItem.details,
          severity: serverItem.severity,
          actionLabel: serverItem.actionLabel,
          actionHref: serverItem.actionHref,
          timestamp: serverItem.timestamp || updated[matchIndex].timestamp,
          timeAgo: serverItem.timeAgo || updated[matchIndex].timeAgo,
          isRead: existingIsRead !== undefined ? existingIsRead : serverItem.isRead,
        };
      } else {
        updated.push(serverItem);
      }
    });

    updated.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    persistNotifications(updated, false);
  } catch (err) {
    console.error("Failed to sync seller notifications from backend:", err);
  }
}

export function useSellerNotifications() {
  const [isMounted, setIsMounted] = useState(false);
  const [notifications, setNotifications] = useState<SellerNotificationItem[]>([]);

  useEffect(() => {
    setIsMounted(true);
    setupGlobalNotificationListeners();

    // Sync initial mount in client
    setNotifications(getGlobalSellerNotifications());

    // Fetch and sync live notifications from backend API
    syncNotificationsFromBackend();

    const handleChange = () => {
      setNotifications(getGlobalSellerNotifications());
    };

    listeners.add(handleChange);
    return () => {
      listeners.delete(handleChange);
    };
  }, []);

  const effectiveNotifications = isMounted ? notifications : [];
  const unreadCount = isMounted ? effectiveNotifications.filter((n) => !n.isRead).length : 0;

  return {
    notifications: effectiveNotifications,
    unreadCount,
    isMounted,
    markAsRead: markNotificationAsRead,
    toggleRead: toggleNotificationRead,
    deleteNotification: deleteSellerNotification,
    markAllAsRead: markAllSellerNotificationsAsRead,
    clearAllNotifications: clearAllSellerNotifications,
    addNotification: addSellerNotification,
    broadcastOrder: broadcastOrderToSellerNotifications,
    broadcastStock: broadcastStockAlert,
    broadcastDelivery: broadcastDeliveryAlert,
    broadcastTiming: broadcastShopTimingAlert,
    broadcastBooking: broadcastBookingAlert,
    broadcastReview: broadcastReviewAlert,
    generateSampleAlert: generateSampleSellerAlert,
    resetToDefaults: resetSellerNotificationsToDefaults,
    syncNotifications: syncNotificationsFromBackend,
  };
}

export default useSellerNotifications;
