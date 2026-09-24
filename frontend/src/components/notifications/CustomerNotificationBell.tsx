"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Bell,
  Package,
  Tag,
  Sparkles,
  BedDouble,
  UtensilsCrossed,
  CheckCheck,
  Trash2,
  ChevronRight,
  X,
  AlertCircle,
  Truck,
  Calendar,
} from "lucide-react";
import { fetchApi } from "@/lib/fetch-api";
import styles from "./CustomerNotificationBell.module.css";

export interface CustomerNotificationItem {
  id: string;
  type: "order" | "offer" | "menu" | "subscription" | "room" | "system";
  title: string;
  message: string;
  timestamp: string;
  relativeTime: string;
  isRead: boolean;
  link?: string;
  tag?: string;
  tagColor?: "orange" | "green" | "purple" | "blue" | "red";
  actionText?: string;
}

const DEFAULT_NOTIFICATIONS: CustomerNotificationItem[] = [
  {
    id: "notif-offer-1",
    type: "offer",
    title: "50% OFF Weekend Gourmet Combos",
    message: "Use promo code NEO50 at checkout on chef-curated combo boxes above ₹249.",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    relativeTime: "15m ago",
    isRead: false,
    link: "/explore-desktop",
    tag: "OFFER",
    tagColor: "green",
    actionText: "Claim Offer",
  },
  {
    id: "notif-menu-1",
    type: "menu",
    title: "New Menu Arrival: Artisanal Bakery",
    message: "Fresh Sourdough Bread, Butter Croissants & Belgian Brownies just arrived!",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    relativeTime: "45m ago",
    isRead: false,
    link: "/explore-desktop",
    tag: "NEW",
    tagColor: "purple",
    actionText: "Explore Menu",
  },
  {
    id: "notif-sub-1",
    type: "subscription",
    title: "Meal Subscription Active",
    message: "Tomorrow's Executive Homestyle Lunch Thali is scheduled for delivery by 1:00 PM.",
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    relativeTime: "2h ago",
    isRead: false,
    link: "/settings-desktop",
    tag: "SUB",
    tagColor: "orange",
    actionText: "View Plan",
  },
  {
    id: "notif-room-1",
    type: "room",
    title: "Room Booking Verified",
    message: "Your stay reservation at Neo Stay Inn is confirmed. Free cancellation available.",
    timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    relativeTime: "6h ago",
    isRead: true,
    link: "/room-booking",
    tag: "ROOM",
    tagColor: "blue",
    actionText: "View Booking",
  },
];

const STORAGE_READ_IDS = "customer_read_notification_ids";
const STORAGE_CLEARED_IDS = "customer_cleared_notification_ids";

export interface CustomerNotificationBellProps {
  className?: string;
}

export const CustomerNotificationBell: React.FC<CustomerNotificationBellProps> = ({
  className,
}) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "orders" | "offers" | "updates">("all");
  const [readIds, setReadIds] = useState<string[]>([]);
  const [clearedIds, setClearedIds] = useState<string[]>([]);
  const [dynamicOrders, setDynamicOrders] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load persistent read and cleared IDs from localStorage after mount
  useEffect(() => {
    try {
      const savedRead = localStorage.getItem(STORAGE_READ_IDS);
      if (savedRead) setReadIds(JSON.parse(savedRead));

      const savedCleared = localStorage.getItem(STORAGE_CLEARED_IDS);
      if (savedCleared) setClearedIds(JSON.parse(savedCleared));
    } catch (e) {
      console.error("Failed to load read notification IDs:", e);
    }
  }, []);

  // Fetch recent user orders dynamically if logged in
  useEffect(() => {
    let isMounted = true;
    async function loadRecentOrders() {
      if (!session?.user) return;
      try {
        const res = await fetchApi("/api/user/orders?limit=4");
        if (res.ok && isMounted) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data?.orders || data?.data || [];
          if (Array.isArray(list)) {
            setDynamicOrders(list);
          }
        }
      } catch {
        // Silently fallback to built-in realistic notifications
      }
    }

    loadRecentOrders();

    const handleOrderEvent = () => {
      loadRecentOrders();
    };

    window.addEventListener("order-placed", handleOrderEvent);
    window.addEventListener("cart-updated", handleOrderEvent);

    return () => {
      isMounted = false;
      window.removeEventListener("order-placed", handleOrderEvent);
      window.removeEventListener("cart-updated", handleOrderEvent);
    };
  }, [session]);

  // Merge static & real dynamic orders into notification items
  const allNotifications = useMemo<CustomerNotificationItem[]>(() => {
    const list: CustomerNotificationItem[] = [];

    // Map actual user orders if present
    if (dynamicOrders && dynamicOrders.length > 0) {
      dynamicOrders.forEach((order: any) => {
        const orderId = order.id || order.orderNumber || order.trackingId || "order";
        const shortId = typeof orderId === "string" ? orderId.slice(-6).toUpperCase() : "ORDER";
        const status = (order.status || "PENDING").toUpperCase();
        const sellerName = order.seller?.businessName || order.sellerName || "Kitchen Partner";
        const createdDate = order.createdAt ? new Date(order.createdAt) : new Date();

        let title = `Order #${shortId} Placed`;
        let message = `Your order from ${sellerName} has been received and confirmed.`;
        let tag = "ORDER";
        let tagColor: CustomerNotificationItem["tagColor"] = "orange";
        let actionText = "Track Order";

        if (status === "PREPARING" || status === "CONFIRMED") {
          title = `Order #${shortId} is Preparing`;
          message = `Chef at ${sellerName} is currently preparing your meal fresh.`;
          tag = "COOKING";
          tagColor = "orange";
        } else if (status === "OUT_FOR_DELIVERY") {
          title = `Order #${shortId} Out for Delivery`;
          message = `Rider is on the way with your meal! ETA 10-15 mins.`;
          tag = "DELIVERING";
          tagColor = "blue";
        } else if (status === "DELIVERED") {
          title = `Order #${shortId} Delivered`;
          message = `Your meal from ${sellerName} was delivered. Enjoy your food!`;
          tag = "DELIVERED";
          tagColor = "green";
          actionText = "Reorder";
        } else if (status === "CANCELLED") {
          title = `Order #${shortId} Cancelled`;
          message = `Your order was cancelled. Any charged amount is refunded.`;
          tag = "CANCELLED";
          tagColor = "red";
          actionText = "View Details";
        }

        list.push({
          id: `order-notif-${orderId}`,
          type: "order",
          title,
          message,
          timestamp: createdDate.toISOString(),
          relativeTime: "Recent",
          isRead: readIds.includes(`order-notif-${orderId}`),
          link: "/orders-desktop",
          tag,
          tagColor,
          actionText,
        });
      });
    }

    // Add static/platform updates
    DEFAULT_NOTIFICATIONS.forEach((n) => {
      list.push({
        ...n,
        isRead: readIds.includes(n.id) || n.isRead,
      });
    });

    // Filter out cleared notifications
    return list.filter((n) => !clearedIds.includes(n.id));
  }, [dynamicOrders, readIds, clearedIds]);

  // Filter based on active tab
  const filteredNotifications = useMemo(() => {
    if (activeTab === "orders") {
      return allNotifications.filter((n) => n.type === "order");
    }
    if (activeTab === "offers") {
      return allNotifications.filter((n) => n.type === "offer");
    }
    if (activeTab === "updates") {
      return allNotifications.filter(
        (n) => n.type === "menu" || n.type === "subscription" || n.type === "room" || n.type === "system"
      );
    }
    return allNotifications;
  }, [allNotifications, activeTab]);

  const unreadCount = useMemo(() => {
    return allNotifications.filter((n) => !n.isRead).length;
  }, [allNotifications]);

  // Mark all as read
  const handleMarkAllRead = () => {
    const allIds = allNotifications.map((n) => n.id);
    const updated = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(updated);
    try {
      localStorage.setItem(STORAGE_READ_IDS, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to persist mark all as read:", e);
    }
  };

  // Clear all notifications
  const handleClearAll = () => {
    const allIds = allNotifications.map((n) => n.id);
    const updated = Array.from(new Set([...clearedIds, ...allIds]));
    setClearedIds(updated);
    try {
      localStorage.setItem(STORAGE_CLEARED_IDS, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to persist clear notifications:", e);
    }
  };

  // Delete individual notification
  const handleDeleteNotification = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = Array.from(new Set([...clearedIds, id]));
    setClearedIds(updated);
    try {
      localStorage.setItem(STORAGE_CLEARED_IDS, JSON.stringify(updated));
    } catch (err) {
      console.error("Failed to persist deleted notification ID:", err);
    }
  };

  // Click individual notification
  const handleItemClick = (item: CustomerNotificationItem) => {
    if (!readIds.includes(item.id)) {
      const updated = [...readIds, item.id];
      setReadIds(updated);
      try {
        localStorage.setItem(STORAGE_READ_IDS, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to persist item read status:", e);
      }
    }
    setIsOpen(false);
    if (item.link) {
      router.push(item.link);
    }
  };

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  const renderItemIcon = (type: CustomerNotificationItem["type"]) => {
    switch (type) {
      case "order":
        return (
          <div className={`${styles.itemIconBox} ${styles.iconOrder}`}>
            <Package size={20} strokeWidth={2.2} />
          </div>
        );
      case "offer":
        return (
          <div className={`${styles.itemIconBox} ${styles.iconOffer}`}>
            <Tag size={20} strokeWidth={2.2} />
          </div>
        );
      case "menu":
      case "subscription":
        return (
          <div className={`${styles.itemIconBox} ${styles.iconMenu}`}>
            <Sparkles size={20} strokeWidth={2.2} />
          </div>
        );
      case "room":
        return (
          <div className={`${styles.itemIconBox} ${styles.iconRoom}`}>
            <BedDouble size={20} strokeWidth={2.2} />
          </div>
        );
      default:
        return (
          <div className={`${styles.itemIconBox} ${styles.iconSystem}`}>
            <Bell size={20} strokeWidth={2.2} />
          </div>
        );
    }
  };

  const getTagClass = (color?: CustomerNotificationItem["tagColor"]) => {
    switch (color) {
      case "green":
        return styles.tagGreen;
      case "purple":
        return styles.tagPurple;
      case "blue":
        return styles.tagBlue;
      case "red":
        return styles.tagRed;
      default:
        return styles.tagOrange;
    }
  };

  return (
    <div className={`${styles.notificationWrapper} ${className || ""}`} ref={dropdownRef}>
      {/* 1. Desktop Bell Trigger Button */}
      <button
        type="button"
        className={`${styles.bellButton} ${isOpen ? styles.bellButtonActive : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Notifications (${unreadCount} unread)`}
        title="Notifications"
        aria-expanded={isOpen}
      >
        <Bell size={22} strokeWidth={2.2} />
        {unreadCount > 0 && (
          <span className={styles.badge} suppressHydrationWarning>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* 2. Mobile Bell Trigger Button */}
      <button
        type="button"
        className={`${styles.mobileBellButton} ${isOpen ? styles.bellButtonActive : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Notifications (${unreadCount} unread)`}
        title="Notifications"
        aria-expanded={isOpen}
      >
        <Bell size={20} strokeWidth={2} />
        {unreadCount > 0 && (
          <span className={styles.badge} suppressHydrationWarning>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* 3. Popover Menu & Backdrop */}
      {isOpen && (
        <>
          <div className={styles.backdrop} onClick={() => setIsOpen(false)} />
          <div className={styles.dropdown} role="dialog" aria-label="Notifications Center">
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.headerTop}>
                <div className={styles.headerTitleGroup}>
                  <div className={styles.headerIconBox}>
                    <Bell size={16} strokeWidth={2.4} />
                  </div>
                  <h3 className={styles.title}>Notifications</h3>
                  {unreadCount > 0 && (
                    <span className={styles.unreadCountPill} suppressHydrationWarning>
                      {unreadCount} New
                    </span>
                  )}
                </div>

                <div className={styles.headerActions}>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      className={styles.markAllReadBtn}
                      onClick={handleMarkAllRead}
                      title="Mark all notifications as read"
                    >
                      <CheckCheck size={14} />
                      <span>Read all</span>
                    </button>
                  )}
                  {allNotifications.length > 0 && (
                    <button
                      type="button"
                      className={styles.clearAllBtn}
                      onClick={handleClearAll}
                      title="Clear all notifications"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Tabs */}
              <div className={styles.tabList} role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "all"}
                  className={`${styles.tabBtn} ${activeTab === "all" ? styles.tabBtnActive : ""}`}
                  onClick={() => setActiveTab("all")}
                >
                  All
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "orders"}
                  className={`${styles.tabBtn} ${activeTab === "orders" ? styles.tabBtnActive : ""}`}
                  onClick={() => setActiveTab("orders")}
                >
                  Orders
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "offers"}
                  className={`${styles.tabBtn} ${activeTab === "offers" ? styles.tabBtnActive : ""}`}
                  onClick={() => setActiveTab("offers")}
                >
                  Offers
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "updates"}
                  className={`${styles.tabBtn} ${activeTab === "updates" ? styles.tabBtnActive : ""}`}
                  onClick={() => setActiveTab("updates")}
                >
                  Updates
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className={styles.listContainer}>
              {filteredNotifications.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIconBox}>
                    <Bell size={24} strokeWidth={1.8} />
                  </div>
                  <h4 className={styles.emptyTitle}>All caught up!</h4>
                  <p className={styles.emptyDesc}>
                    You have no new notifications right now.
                  </p>
                </div>
              ) : (
                filteredNotifications.map((item) => (
                  <div
                    key={item.id}
                    className={`${styles.item} ${!item.isRead ? styles.itemUnread : ""}`}
                    onClick={() => handleItemClick(item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        handleItemClick(item);
                      }
                    }}
                  >
                    {renderItemIcon(item.type)}

                    <div className={styles.itemBody}>
                      <div className={styles.itemTopRow}>
                        <h4 className={styles.itemTitle}>{item.title}</h4>
                        <div className={styles.itemMetaRow}>
                          <span className={styles.itemTime}>{item.relativeTime}</span>
                          <button
                            type="button"
                            className={styles.deleteSingleBtn}
                            onClick={(e) => handleDeleteNotification(e, item.id)}
                            title="Delete notification"
                            aria-label="Delete notification"
                          >
                            <Trash2 size={13} strokeWidth={2.2} />
                          </button>
                        </div>
                      </div>

                      <p className={styles.itemMessage}>{item.message}</p>

                      <div className={styles.itemFooter}>
                        {item.tag && (
                          <span className={`${styles.itemTag} ${getTagClass(item.tagColor)}`}>
                            {item.tag}
                          </span>
                        )}

                        <span className={styles.itemAction}>
                          <span>{item.actionText || "View"}</span>
                          <ChevronRight size={13} strokeWidth={2.4} />
                        </span>
                      </div>
                    </div>

                    {!item.isRead && (
                      <span className={styles.unreadDot} title="Unread notification" />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer View All / Settings Link */}
            <div className={styles.footer}>
              <Link
                href="/settings-desktop"
                className={styles.viewAllLink}
                onClick={() => setIsOpen(false)}
              >
                <span>Manage Notification Preferences</span>
                <ChevronRight size={14} strokeWidth={2.2} />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CustomerNotificationBell;
