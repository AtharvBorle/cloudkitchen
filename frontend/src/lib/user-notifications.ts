import { fetchApi } from "./fetch-api";

export type CustomerNotificationCategory =
  | "all"
  | "orders"
  | "subscriptions"
  | "bookings"
  | "offers"
  | "support"
  | "system"
  | "unread";

export type CustomerNotificationSeverity = "critical" | "warning" | "info" | "success";

export interface CustomerNotificationItem {
  id: string;
  category: CustomerNotificationCategory;
  title: string;
  message: string;
  details?: string;
  timestamp: string;
  timeAgo: string;
  isRead: boolean;
  severity: CustomerNotificationSeverity;
  actionLabel?: string;
  actionHref?: string;
  metadata?: Record<string, any>;
}

export interface CustomerNotificationsResponse {
  unreadCount: number;
  totalCount: number;
  filteredCount: number;
  countsByCategory: Record<string, number>;
  notifications: CustomerNotificationItem[];
}

export async function fetchUserNotifications(params?: {
  category?: string;
  severity?: string;
  unreadOnly?: boolean;
  limit?: number;
}): Promise<CustomerNotificationsResponse> {
  const query = new URLSearchParams();
  if (params?.category) query.set("category", params.category);
  if (params?.severity) query.set("severity", params.severity);
  if (params?.unreadOnly) query.set("unreadOnly", "true");
  if (params?.limit) query.set("limit", String(params.limit));

  const url = `/api/user/notifications${query.toString() ? `?${query.toString()}` : ""}`;
  const res = await fetchApi(url);
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to fetch customer notifications");
  }
  return json.data || json;
}

export async function fetchUserUnreadNotificationCount(): Promise<{
  unreadCount: number;
  totalCount: number;
  countsByCategory: Record<string, number>;
}> {
  const res = await fetchApi("/api/user/notifications/count");
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to fetch notification count");
  }
  return json.data || json;
}

export async function markUserNotificationAsRead(id: string, isRead = true): Promise<any> {
  const res = await fetchApi(`/api/user/notifications/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isRead }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to update notification status");
  }
  return json.data || json;
}

export async function markAllUserNotificationsAsRead(): Promise<any> {
  const res = await fetchApi("/api/user/notifications", {
    method: "PATCH",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to mark all notifications as read");
  }
  return json.data || json;
}

export async function dismissUserNotification(id: string): Promise<any> {
  const res = await fetchApi(`/api/user/notifications/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to dismiss notification");
  }
  return json.data || json;
}

export async function clearAllUserNotifications(): Promise<any> {
  const res = await fetchApi("/api/user/notifications", {
    method: "DELETE",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to clear notifications");
  }
  return json.data || json;
}
