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

export const INITIAL_SELLER_NOTIFICATIONS: SellerNotificationItem[] = [
  {
    id: "notif-1",
    category: "stock",
    settingKey: "lowStockAlert",
    title: "Low Stock Alert: Paneer Butter Masala",
    message: "Only 3 portions remaining in active inventory for today's lunch session.",
    details: "Inventory threshold reached (< 5 units). Consider restocking fresh cottage cheese or setting item to auto-pause to avoid order cancellations.",
    timestamp: "2026-09-10T16:35:00.000Z",
    timeAgo: "10 mins ago",
    isRead: false,
    severity: "warning",
    actionLabel: "Update Stock",
    actionHref: "/seller/menu",
  },
  {
    id: "notif-2",
    category: "orders",
    settingKey: "orderAlerts",
    title: "New Incoming Order #1248 Received",
    message: "Order placed for 3 items (Dal Tadka, Jeera Rice, Garlic Naan) • ₹520 total amount.",
    details: "Payment confirmed via UPI. Kitchen prep timer started (Estimated window: 25 mins). Please accept and push to kitchen display.",
    timestamp: "2026-09-10T16:28:00.000Z",
    timeAgo: "18 mins ago",
    isRead: false,
    severity: "info",
    actionLabel: "View Order",
    actionHref: "/seller/orders",
  },
  {
    id: "notif-3",
    category: "stock",
    settingKey: "outOfStockAlert",
    title: "Critical: Butter Naan is Out of Stock",
    message: "Tandoor flour ingredient inventory reached 0 kg. Dish automatically marked unavailable.",
    details: "Online store has auto-paused 'Butter Naan' across customer food ordering menus to prevent unfulfilled incoming orders.",
    timestamp: "2026-09-10T16:10:00.000Z",
    timeAgo: "35 mins ago",
    isRead: false,
    severity: "critical",
    actionLabel: "Manage Inventory",
    actionHref: "/seller/menu",
  },
  {
    id: "notif-4",
    category: "delivery",
    settingKey: "riderAssignedAlert",
    title: "Rider Assigned for Order #1246",
    message: "Delivery partner Rohit Kumar (+91 98112 34567) is arriving at kitchen in 4 mins.",
    details: "Vehicle: Hero Electric Scooter (MH-02-CD-4512). Ensure order is packed with tamper-proof seal and invoice attached.",
    timestamp: "2026-09-10T15:55:00.000Z",
    timeAgo: "50 mins ago",
    isRead: false,
    severity: "info",
    actionLabel: "Track Rider",
    actionHref: "/seller/delivery",
  },
  {
    id: "notif-5",
    category: "orders",
    settingKey: "specialInstructionsAlerts",
    title: "Special Cooking Notes on Order #1245",
    message: "Customer Note: 'Strictly No Garlic & Extra Green Chilies for Biryani'.",
    details: "Customer marked Jain preference. Chef instruction tag highlighted on kitchen display order ticket.",
    timestamp: "2026-09-10T15:20:00.000Z",
    timeAgo: "1 hour ago",
    isRead: true,
    severity: "warning",
    actionLabel: "Kitchen Ticket",
    actionHref: "/seller/orders",
  },
  {
    id: "notif-6",
    category: "delivery",
    settingKey: "deliveryDelayAlert",
    title: "Delivery Delay Alert: Order #1242",
    message: "Rider delayed by ~15 mins due to heavy traffic on Link Road Flyover.",
    details: "Estimated delivery updated from 15:30 to 15:48. Customer automated tracking update sent via WhatsApp.",
    timestamp: "2026-09-10T14:40:00.000Z",
    timeAgo: "2 hours ago",
    isRead: true,
    severity: "warning",
    actionLabel: "View Delivery Map",
    actionHref: "/seller/delivery",
  },
  {
    id: "notif-7",
    category: "timings",
    settingKey: "closingReminder30Min",
    title: "Kitchen Closing Reminder (30 Mins Before)",
    message: "Your kitchen is scheduled to stop taking new online orders at 10:00 PM.",
    details: "Prepare staff for evening kitchen cleanup and finish remaining pending orders in the queue.",
    timestamp: "2026-09-10T13:00:00.000Z",
    timeAgo: "3 hours ago",
    isRead: true,
    severity: "info",
    actionLabel: "Check Timings",
    actionHref: "/seller/settings",
  },
  {
    id: "notif-8",
    category: "bookings",
    settingKey: "bookingRequestAlert",
    title: "New Room Reservation: Deluxe Suite 201",
    message: "Guest Amit Verma booked 2 Nights (Check-in: Today 02:00 PM • ₹3,800 Paid).",
    details: "Reservation confirmed. Keycard code generated and room housekeeping marked ready.",
    timestamp: "2026-09-10T11:15:00.000Z",
    timeAgo: "5 hours ago",
    isRead: true,
    severity: "success",
    actionLabel: "View Booking",
    actionHref: "/seller/booking",
  },
  {
    id: "notif-9",
    category: "reviews",
    settingKey: "negativeReviewAlert",
    title: "Critical Review Alert (2 Stars on Order #1228)",
    message: "Feedback: 'Food packaging was leaking slightly, though taste was good'.",
    details: "Urgent recovery action recommended. Reply to customer or issue a ₹100 discount coupon for next order.",
    timestamp: "2026-09-10T09:30:00.000Z",
    timeAgo: "7 hours ago",
    isRead: true,
    severity: "critical",
    actionLabel: "Respond to Review",
    actionHref: "/seller/profile",
  },
  {
    id: "notif-10",
    category: "settlements",
    settingKey: "dailyDigest",
    title: "Daily Settlement Digest: ₹24,850 Processed",
    message: "Settlement for 34 orders successfully transferred to HDFC Bank (A/C **4589).",
    details: "Gross Sales: ₹26,400 | Commission & GST: ₹1,550 | Net Credited: ₹24,850. UTR reference: HDFC2026091048921.",
    timestamp: "2026-09-10T06:00:00.000Z",
    timeAgo: "10 hours ago",
    isRead: true,
    severity: "success",
    actionLabel: "View Ledger",
    actionHref: "/seller/subscription",
  },
];
