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

export const SAMPLE_PRESET_NOTIFICATIONS: SellerNotificationItem[] = [];

export function createSampleAlert(category: NotificationCategory): SellerNotificationItem {
  const randomId = `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const now = new Date().toISOString();

  switch (category) {
    case "orders": {
      const ordNum = Math.floor(1000 + Math.random() * 9000);
      const amount = Math.floor(250 + Math.random() * 600);
      return {
        id: randomId,
        category: "orders",
        settingKey: "orderAlerts",
        title: `New Incoming Order #ORD-${ordNum}`,
        message: `New paid order received for ₹${amount}. Ready for kitchen dispatch.`,
        details: "Auto-accepted and queued for preparation.",
        timestamp: now,
        timeAgo: "Just now",
        isRead: false,
        severity: "success",
        actionLabel: "View Order",
        actionHref: "/seller/orders",
      };
    }
    case "stock": {
      const items = ["Cheese Garlic Bread", "Paneer Tikka Roll", "Chocolate Lava Cake", "Farmhouse Special Pizza"];
      const chosen = items[Math.floor(Math.random() * items.length)];
      return {
        id: randomId,
        category: "stock",
        settingKey: "lowStockAlert",
        title: `Low Stock Alert: ${chosen}`,
        message: `Inventory for ${chosen} is down to critical level.`,
        details: "Consider updating available stock in menu manager.",
        timestamp: now,
        timeAgo: "Just now",
        isRead: false,
        severity: "warning",
        actionLabel: "Restock Item",
        actionHref: "/seller/menu",
      };
    }
    case "delivery": {
      const riders = ["Amit Kumar", "Suresh Patil", "Vikas Shinde", "Rohit Jadhav"];
      const rider = riders[Math.floor(Math.random() * riders.length)];
      return {
        id: randomId,
        category: "delivery",
        settingKey: "outForDeliveryAlert",
        title: `Out for Delivery: Rider ${rider}`,
        message: `${rider} has picked up order parcel and is en route to customer doorstep.`,
        details: "Live delivery GPS tracking active.",
        timestamp: now,
        timeAgo: "Just now",
        isRead: false,
        severity: "info",
        actionLabel: "Live Delivery Map",
        actionHref: "/seller/delivery",
      };
    }
    case "bookings": {
      const rooms = ["Executive Suite 102", "Deluxe Garden Room 204", "Penthouse Suite 301"];
      const room = rooms[Math.floor(Math.random() * rooms.length)];
      return {
        id: randomId,
        category: "bookings",
        settingKey: "bookingRequestAlert",
        title: `New Room Reservation: ${room}`,
        message: `Guest booking confirmed for ${room}. Advance payment verified.`,
        details: "Check-in time window scheduled.",
        timestamp: now,
        timeAgo: "Just now",
        isRead: false,
        severity: "info",
        actionLabel: "View Reservation",
        actionHref: "/seller/booking",
      };
    }
    case "reviews": {
      return {
        id: randomId,
        category: "reviews",
        settingKey: "negativeReviewAlert",
        title: "New 5-Star Customer Review",
        message: "Customer rated 5.0 stars: 'Amazing taste and super fast hot packaging!'",
        details: "Review posted on restaurant storefront.",
        timestamp: now,
        timeAgo: "Just now",
        isRead: false,
        severity: "success",
        actionLabel: "View Review",
        actionHref: "/seller/reviews",
      };
    }
    case "timings": {
      return {
        id: randomId,
        category: "timings",
        settingKey: "closingReminder30Min",
        title: "Kitchen Closing in 30 Minutes",
        message: "Scheduled operating hours close at 10:00 PM. Wrap up remaining order queue.",
        details: "Store will switch to offline mode automatically.",
        timestamp: now,
        timeAgo: "Just now",
        isRead: false,
        severity: "warning",
        actionLabel: "View Schedule",
        actionHref: "/seller/settings",
      };
    }
    default: {
      return {
        id: randomId,
        category: "orders",
        settingKey: "orderAlerts",
        title: "Storefront Notification",
        message: "Real-time kitchen notification received.",
        timestamp: now,
        timeAgo: "Just now",
        isRead: false,
        severity: "info",
        actionLabel: "View Details",
        actionHref: "/seller/dashboard",
      };
    }
  }
}
