"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  Package,
  ShoppingBag,
  Truck,
  Clock,
  CalendarCheck,
  Star,
  CreditCard,
  Settings,
  CheckCheck,
  Trash2,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import {
  SellerNotificationItem,
  NotificationCategory,
  INITIAL_SELLER_NOTIFICATIONS,
} from "./notificationData";
import styles from "./SellerNotificationsCanvas.module.css";

export type FilterTab = "all" | "unread" | "orders" | "stock" | "delivery" | "timings" | "bookings";

export interface SellerNotificationsCanvasProps {
  initialNotifications?: SellerNotificationItem[];
  onNotificationAction?: (notification: SellerNotificationItem) => void;
}

export const SellerNotificationsCanvas: React.FC<SellerNotificationsCanvasProps> = ({
  initialNotifications = INITIAL_SELLER_NOTIFICATIONS,
  onNotificationAction,
}) => {
  const [notifications, setNotifications] = useState<SellerNotificationItem[]>(initialNotifications);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleToggleRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n))
    );
  };

  const handleDeleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    showToast("Notification dismissed");
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    showToast("All notifications marked as read");
  };

  const handleClearAll = () => {
    setNotifications([]);
    showToast("All notifications cleared");
  };

  // Filtered Notifications
  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "unread") return !n.isRead;
    if (activeFilter === "orders") return n.category === "orders";
    if (activeFilter === "stock") return n.category === "stock";
    if (activeFilter === "delivery") return n.category === "delivery";
    if (activeFilter === "timings") return n.category === "timings";
    if (activeFilter === "bookings") return n.category === "bookings" || n.category === "reviews" || n.category === "settlements";
    return true;
  });

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case "stock":
        return <Package size={20} />;
      case "orders":
        return <ShoppingBag size={20} />;
      case "delivery":
        return <Truck size={20} />;
      case "timings":
        return <Clock size={20} />;
      case "bookings":
        return <CalendarCheck size={20} />;
      case "reviews":
        return <Star size={20} />;
      case "settlements":
        return <CreditCard size={20} />;
      default:
        return <Bell size={20} />;
    }
  };

  const getIconClass = (category: NotificationCategory) => {
    switch (category) {
      case "stock":
        return styles.iconStock;
      case "orders":
        return styles.iconOrders;
      case "delivery":
        return styles.iconDelivery;
      case "timings":
        return styles.iconTimings;
      case "bookings":
        return styles.iconBookings;
      case "reviews":
        return styles.iconReviews;
      case "settlements":
        return styles.iconSettlements;
      default:
        return styles.iconOrders;
    }
  };

  const getSeverityClass = (severity: SellerNotificationItem["severity"]) => {
    switch (severity) {
      case "critical":
        return styles.severityCritical;
      case "warning":
        return styles.severityWarning;
      case "info":
        return styles.severityInfo;
      case "success":
        return styles.severitySuccess;
      default:
        return styles.severityInfo;
    }
  };

  const getCountByFilter = (filter: FilterTab) => {
    if (filter === "all") return notifications.length;
    if (filter === "unread") return unreadCount;
    if (filter === "orders") return notifications.filter((n) => n.category === "orders").length;
    if (filter === "stock") return notifications.filter((n) => n.category === "stock").length;
    if (filter === "delivery") return notifications.filter((n) => n.category === "delivery").length;
    if (filter === "timings") return notifications.filter((n) => n.category === "timings").length;
    if (filter === "bookings") return notifications.filter((n) => n.category === "bookings" || n.category === "reviews" || n.category === "settlements").length;
    return 0;
  };

  return (
    <div className={styles.canvasContainer}>
      {/* 1. Header Section */}
      <div className={styles.headerSection}>
        <div className={styles.titleGroup}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Notifications Center</h1>
            {unreadCount > 0 && (
              <span className={styles.unreadCountBadge}>{unreadCount} Unread</span>
            )}
          </div>
          <p className={styles.subtitle}>
            Live operational updates, stock alerts, delivery tracking, and kitchen alerts.
          </p>
        </div>

        <div className={styles.headerActions}>
          {unreadCount > 0 && (
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
              onClick={handleMarkAllAsRead}
            >
              <CheckCheck size={16} />
              <span>Mark all read</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              className={styles.actionBtn}
              onClick={handleClearAll}
            >
              <Trash2 size={16} />
              <span>Clear all</span>
            </button>
          )}

          <Link href="/seller/settings" className={styles.actionBtn}>
            <Settings size={16} />
            <span>Preferences</span>
          </Link>
        </div>
      </div>

      {/* 2. Settings Notification Preferences Banner */}
      <div className={styles.settingsBanner}>
        <div className={styles.settingsBannerLeft}>
          <SlidersHorizontal size={18} className={styles.settingsBannerIcon} />
          <p className={styles.settingsBannerText}>
            Notifications are delivered based on your active preferences in <strong>Settings &gt; Notifications</strong>. You can customize audio chimes, low-stock thresholds, and closing alerts at any time.
          </p>
        </div>
        <Link href="/seller/settings" className={styles.settingsLink}>
          Manage Alerts
        </Link>
      </div>

      {/* 3. Filter Tabs */}
      <div className={styles.tabsContainer} role="tablist">
        {(
          [
            { id: "all", label: "All Alerts" },
            { id: "unread", label: "Unread" },
            { id: "orders", label: "Orders & Kitchen" },
            { id: "stock", label: "Stock & Inventory" },
            { id: "delivery", label: "Delivery & Riders" },
            { id: "timings", label: "Shop Timings" },
            { id: "bookings", label: "Bookings & Reports" },
          ] as { id: FilterTab; label: string }[]
        ).map((tab) => {
          const count = getCountByFilter(tab.id);
          const active = activeFilter === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`${styles.tabBtn} ${active ? styles.activeTab : ""}`}
              onClick={() => setActiveFilter(tab.id)}
            >
              <span>{tab.label}</span>
              <span className={styles.tabBadge}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Notifications Card Stack */}
      {filteredNotifications.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIconWrapper}>
            <Bell size={26} />
          </div>
          <h3 className={styles.emptyTitle}>
            {notifications.length === 0 ? "No Notifications Yet" : "No Notifications in this Category"}
          </h3>
          <p className={styles.emptyDesc}>
            {notifications.length === 0
              ? "You're all caught up! New orders, inventory updates, and delivery alerts will appear here in real-time."
              : "No notifications match this filter. Check other categories or view all alerts."}
          </p>
          {notifications.length > 0 && activeFilter !== "all" && (
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
              onClick={() => setActiveFilter("all")}
            >
              Show All Notifications
            </button>
          )}
        </div>
      ) : (
        <div className={styles.notificationList}>
          {filteredNotifications.map((item) => {
            return (
              <div
                key={item.id}
                className={`${styles.notificationCard} ${!item.isRead ? styles.unreadCard : ""}`}
                onClick={() => handleMarkAsRead(item.id)}
              >
                {/* Category Icon */}
                <div className={`${styles.iconWrapper} ${getIconClass(item.category)}`}>
                  {getCategoryIcon(item.category)}
                </div>

                {/* Main Content Area */}
                <div className={styles.cardContent}>
                  <div className={styles.cardHeaderRow}>
                    <div className={styles.titleArea}>
                      {!item.isRead && <span className={styles.unreadDot} />}
                      <h3 className={styles.cardTitle}>{item.title}</h3>
                    </div>

                    <div className={styles.metaArea}>
                      <span className={`${styles.severityBadge} ${getSeverityClass(item.severity)}`}>
                        {item.severity}
                      </span>
                      <span className={styles.timeAgo}>{item.timeAgo}</span>
                    </div>
                  </div>

                  {/* Message */}
                  <p className={styles.cardMessage}>{item.message}</p>

                  {/* Detailed Briefing / Action Context */}
                  {item.details && (
                    <div className={styles.cardDetails}>
                      <strong>Detail:</strong> {item.details}
                    </div>
                  )}

                  {/* Card Footer Actions */}
                  <div className={styles.cardFooter}>
                    {item.actionLabel && item.actionHref ? (
                      <Link
                        href={item.actionHref}
                        className={styles.cardActionLink}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(item.id);
                          if (onNotificationAction) onNotificationAction(item);
                        }}
                      >
                        <span>{item.actionLabel}</span>
                        <ChevronRight size={15} />
                      </Link>
                    ) : (
                      <div />
                    )}

                    <div className={styles.cardManageBtns}>
                      <button
                        type="button"
                        className={styles.toggleReadBtn}
                        onClick={(e) => handleToggleRead(item.id, e)}
                      >
                        {item.isRead ? "Mark unread" : "Mark as read"}
                      </button>

                      <button
                        type="button"
                        className={styles.dismissBtn}
                        onClick={(e) => handleDeleteNotification(item.id, e)}
                        title="Dismiss notification"
                        aria-label="Dismiss"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Toast Confirmation */}
      {toastMessage && (
        <div className={styles.toast}>
          <CheckCircle2 size={18} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default SellerNotificationsCanvas;
