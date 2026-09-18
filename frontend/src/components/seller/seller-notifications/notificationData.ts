export type NotificationCategory =
  | "all"
  | "orders"
  | "stock"
  | "delivery"
  | "timings"
  | "bookings"
  | "reviews"
  | "settlements";

export type NotificationSeverity = "critical" | "warning" | "info" | "success";

export interface SellerNotificationItem {
  id: string;
  category: NotificationCategory;
  settingKey: string;
  title: string;
  message: string;
  details?: string;
  timestamp: string;
  timeAgo: string;
  isRead: boolean;
  severity: NotificationSeverity;
  actionLabel?: string;
  actionHref?: string;
}

export const INITIAL_SELLER_NOTIFICATIONS: SellerNotificationItem[] = [];
