"use client";

import { useState, useEffect } from "react";
import {
  SellerNotificationItem,
  NotificationCategory,
  INITIAL_SELLER_NOTIFICATIONS,
  createSampleAlert,
} from "@/components/seller/seller-notifications/notificationData";

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

function persistNotifications(items: SellerNotificationItem[]) {
  memoryNotifications = items;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.error("Failed to persist notifications:", err);
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
  item: Omit<SellerNotificationItem, "id" | "timestamp" | "timeAgo"> & {
    id?: string;
    timestamp?: string;
    timeAgo?: string;
  }
) {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("seller_notifications_cleared");
    } catch {}
  }
  const current = getGlobalSellerNotifications();
  const newItem: SellerNotificationItem = {
    id: item.id || `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    category: item.category,
    settingKey: item.settingKey || "orderAlerts",
    title: item.title,
    message: item.message,
    details: item.details,
    timestamp: item.timestamp || new Date().toISOString(),
    timeAgo: item.timeAgo || "Just now",
    isRead: item.isRead !== undefined ? item.isRead : false,
    severity: item.severity || "info",
    actionLabel: item.actionLabel,
    actionHref: item.actionHref,
  };
  persistNotifications([newItem, ...current]);
  return newItem;
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

export function useSellerNotifications() {
  const [notifications, setNotifications] = useState<SellerNotificationItem[]>(() => {
    return getGlobalSellerNotifications();
  });

  useEffect(() => {
    // Sync initial mount in client
    setNotifications(getGlobalSellerNotifications());

    const handleChange = () => {
      setNotifications(getGlobalSellerNotifications());
    };

    listeners.add(handleChange);
    return () => {
      listeners.delete(handleChange);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    markAsRead: markNotificationAsRead,
    toggleRead: toggleNotificationRead,
    deleteNotification: deleteSellerNotification,
    markAllAsRead: markAllSellerNotificationsAsRead,
    clearAllNotifications: clearAllSellerNotifications,
    addNotification: addSellerNotification,
    generateSampleAlert: generateSampleSellerAlert,
    resetToDefaults: resetSellerNotificationsToDefaults,
  };
}

export default useSellerNotifications;
