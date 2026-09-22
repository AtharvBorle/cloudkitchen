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
  PlusCircle,
  RotateCcw,
  X,
} from "lucide-react";
import {
  SellerNotificationItem,
  NotificationCategory,
} from "./notificationData";
import { useSellerNotifications } from "@/hooks/useSellerNotifications";
import styles from "./SellerNotificationsCanvas.module.css";

export type FilterTab = "all" | "unread" | "orders" | "stock" | "delivery" | "timings" | "bookings";

export interface SellerNotificationsCanvasProps {
  initialNotifications?: SellerNotificationItem[];
  onNotificationAction?: (notification: SellerNotificationItem) => void;
}

export const SellerNotificationsCanvas: React.FC<SellerNotificationsCanvasProps> = ({
  onNotificationAction,
}) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    toggleRead,
    deleteNotification,
    markAllAsRead,
    clearAllNotifications,
    generateSampleAlert,
    resetToDefaults,
  } = useSellerNotifications();

  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  const handleToggleRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleRead(id);
  };

  const handleDeleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotification(id);
    showToast("Notification dismissed");
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    showToast("All notifications marked as read");
  };

  const handleClearAll = () => {
    clearAllNotifications();
    showToast("All notifications cleared");
  };

  const handleGenerateAlert = (category: NotificationCategory) => {
    const alert = generateSampleAlert(category);
    showToast(`New ${category} notification alert created!`);
  };

  const handleResetDefaults = () => {
    resetToDefaults();
    showToast("Notifications reset to initial 4 alerts");
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
            {unreadCount > 0 ? (
              <span className={styles.unreadCountBadge}>{unreadCount} Unread</span>
            ) : (
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#16A34A", backgroundColor: "#F0FDF4", padding: "3px 10px", borderRadius: "20px", border: "1px solid #BBF7D0" }}>
                All Read
              </span>
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

      {/* Quick Test Alert Bar (Allows Seller to simulate real-time alerts and observe live bell icon counter updates) */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: "12px",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <PlusCircle size={16} color="#EA580C" />
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A" }}>
            Generate Real-Time Alerts:
          </span>
          <span style={{ fontSize: "11px", color: "#64748B" }}>
            (Increases unread count in Topbar)
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => handleGenerateAlert("orders")}
            style={{
              padding: "5px 11px",
              backgroundColor: "#FFF7ED",
              color: "#C2410C",
              border: "1px solid #FED7AA",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + New Order
          </button>
          <button
            type="button"
            onClick={() => handleGenerateAlert("stock")}
            style={{
              padding: "5px 11px",
              backgroundColor: "#FEF3C7",
              color: "#B45309",
              border: "1px solid #FDE68A",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Low Stock
          </button>
          <button
            type="button"
            onClick={() => handleGenerateAlert("delivery")}
            style={{
              padding: "5px 11px",
              backgroundColor: "#EFF6FF",
              color: "#1D4ED8",
              border: "1px solid #BFDBFE",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Rider Update
          </button>
          <button
            type="button"
            onClick={() => handleGenerateAlert("bookings")}
            style={{
              padding: "5px 11px",
              backgroundColor: "#F5F3FF",
              color: "#6D28D9",
              border: "1px solid #DDD6FE",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Booking
          </button>
          <button
            type="button"
            onClick={handleResetDefaults}
            style={{
              padding: "5px 10px",
              backgroundColor: "#F8FAFC",
              color: "#64748B",
              border: "1px solid #E2E8F0",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <RotateCcw size={12} /> Reset
          </button>
        </div>
      </div>

      {/* 2. Settings Notification Preferences Banner */}
      {showBanner && (
        <div className={styles.settingsBanner}>
          <div className={styles.settingsBannerLeft}>
            <SlidersHorizontal size={18} className={styles.settingsBannerIcon} />
            <p className={styles.settingsBannerText}>
              Notifications are delivered based on your active preferences in <strong>Settings &gt; Notifications</strong>. You can customize audio chimes, low-stock thresholds, and closing alerts at any time.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            <Link href="/seller/settings" className={styles.settingsLink}>
              Manage Alerts
            </Link>
            <button
              type="button"
              onClick={() => setShowBanner(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                color: "#C2410C",
                display: "inline-flex",
                alignItems: "center",
                opacity: 0.8,
              }}
              title="Dismiss banner"
              aria-label="Dismiss banner"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

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
