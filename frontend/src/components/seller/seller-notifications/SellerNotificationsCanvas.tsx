"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Search,
  X,
} from "lucide-react";
import {
  SellerNotificationItem,
  NotificationCategory,
  formatNotificationTime,
} from "./notificationData";
import { useSellerNotifications } from "@/hooks/useSellerNotifications";
import styles from "./SellerNotificationsCanvas.module.css";

export type FilterTab = "all" | "unread" | "orders" | "stock" | "delivery" | "timings" | "bookings";

export interface SellerNotificationsCanvasProps {
  initialNotifications?: SellerNotificationItem[];
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onNotificationAction?: (notification: SellerNotificationItem) => void;
}

export const SellerNotificationsCanvas: React.FC<SellerNotificationsCanvasProps> = ({
  searchQuery: searchQueryProp = "",
  onSearchChange,
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
    syncNotifications,
  } = useSellerNotifications();
  const router = useRouter();

  const resolveOrderTargetHref = (item: SellerNotificationItem) => {
    let targetHref = item.actionHref;
    if (item.actionLabel === "Track Dispatch" && item.actionHref === "/seller/delivery") {
      return "/seller/orders";
    }
    if (item.category === "orders" || item.title?.toLowerCase().includes("order")) {
      let orderId = item.metadata?.orderId;
      if (!orderId && targetHref) {
        try {
          const parsed = new URL(targetHref, "http://localhost");
          orderId = parsed.searchParams.get("orderId") || parsed.searchParams.get("id");
        } catch {}
      }
      if (!orderId) {
        const match = item.title.match(/#([A-Za-z0-9-]+)/) || item.id.match(/(?:notif-order-|ord-[a-z]+-)([A-Za-z0-9-]+)/);
        if (match) {
          orderId = match[1].replace(/^ORD-/, "");
        }
      }
      if (orderId) {
        return `/seller/orders/details?orderId=${encodeURIComponent(orderId)}`;
      }
    }
    return targetHref || "/seller/orders";
  };

  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(true);

  const [localSearchQuery, setLocalSearchQuery] = useState(searchQueryProp || "");
  const searchQuery = searchQueryProp !== undefined ? searchQueryProp : localSearchQuery;

  useEffect(() => {
    if (searchQueryProp !== undefined) {
      setLocalSearchQuery(searchQueryProp);
    }
  }, [searchQueryProp]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = (params.get("tab") || params.get("filter") || "").toLowerCase();
      if (
        tabParam === "unread" ||
        tabParam === "orders" ||
        tabParam === "stock" ||
        tabParam === "delivery" ||
        tabParam === "timings" ||
        tabParam === "bookings"
      ) {
        setActiveFilter(tabParam as FilterTab);
      }
    }
  }, []);

  const handleSearchChange = (q: string) => {
    setLocalSearchQuery(q);
    if (onSearchChange) onSearchChange(q);
  };

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

  // Filtered Notifications with Tab & Search Filter
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // 1. Tab filter
      if (activeFilter === "unread" && n.isRead) return false;
      if (activeFilter === "orders" && n.category !== "orders") return false;
      if (activeFilter === "stock" && n.category !== "stock") return false;
      if (activeFilter === "delivery" && n.category !== "delivery") return false;
      if (activeFilter === "timings" && n.category !== "timings") return false;
      if (
        activeFilter === "bookings" &&
        !(n.category === "bookings" || n.category === "reviews" || n.category === "settlements")
      ) {
        return false;
      }

      // 2. Search query filter
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const tokens = q.split(/\s+/).filter(Boolean);

      const title = (n.title || "").toLowerCase();
      const message = (n.message || "").toLowerCase();
      const details = (n.details || "").toLowerCase();
      const category = (n.category || "").toLowerCase();
      const severity = (n.severity || "").toLowerCase();
      const actionLabel = (n.actionLabel || "").toLowerCase();
      const timeAgo = (n.timeAgo || "").toLowerCase();
      const readStatus = n.isRead ? "read" : "unread";

      // Direct full match
      if (
        title.includes(q) ||
        message.includes(q) ||
        details.includes(q) ||
        category.includes(q) ||
        severity.includes(q) ||
        actionLabel.includes(q) ||
        timeAgo.includes(q) ||
        readStatus.includes(q)
      ) {
        return true;
      }

      // Multi-token match (all words match some attribute)
      if (tokens.length > 1) {
        return tokens.every(
          (token) =>
            title.includes(token) ||
            message.includes(token) ||
            details.includes(token) ||
            category.includes(token) ||
            severity.includes(token) ||
            actionLabel.includes(token) ||
            timeAgo.includes(token) ||
            readStatus.includes(token)
        );
      }

      return false;
    });
  }, [notifications, activeFilter, searchQuery]);

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
    const list = searchQuery.trim()
      ? notifications.filter((n) => {
          const q = searchQuery.toLowerCase().trim();
          const tokens = q.split(/\s+/).filter(Boolean);
          const title = (n.title || "").toLowerCase();
          const message = (n.message || "").toLowerCase();
          const details = (n.details || "").toLowerCase();
          const category = (n.category || "").toLowerCase();
          const severity = (n.severity || "").toLowerCase();
          const actionLabel = (n.actionLabel || "").toLowerCase();
          const timeAgo = (n.timeAgo || "").toLowerCase();
          const readStatus = n.isRead ? "read" : "unread";
          if (
            title.includes(q) ||
            message.includes(q) ||
            details.includes(q) ||
            category.includes(q) ||
            severity.includes(q) ||
            actionLabel.includes(q) ||
            timeAgo.includes(q) ||
            readStatus.includes(q)
          ) {
            return true;
          }
          if (tokens.length > 1) {
            return tokens.every(
              (t) =>
                title.includes(t) ||
                message.includes(t) ||
                details.includes(t) ||
                category.includes(t) ||
                severity.includes(t) ||
                actionLabel.includes(t) ||
                timeAgo.includes(t) ||
                readStatus.includes(t)
            );
          }
          return false;
        })
      : notifications;

    if (filter === "all") return list.length;
    if (filter === "unread") return list.filter((n) => !n.isRead).length;
    if (filter === "orders") return list.filter((n) => n.category === "orders").length;
    if (filter === "stock") return list.filter((n) => n.category === "stock").length;
    if (filter === "delivery") return list.filter((n) => n.category === "delivery").length;
    if (filter === "timings") return list.filter((n) => n.category === "timings").length;
    if (filter === "bookings") {
      return list.filter(
        (n) => n.category === "bookings" || n.category === "reviews" || n.category === "settlements"
      ).length;
    }
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

          <Link href="/seller/settings?tab=notifications" className={styles.actionBtn}>
            <Settings size={16} />
            <span>Preferences</span>
          </Link>
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
            <Link href="/seller/settings?tab=notifications" className={styles.settingsLink}>
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

      {/* In-page Search Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          backgroundColor: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: "10px",
          padding: "8px 14px",
          marginBottom: "16px",
          gap: "10px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
        }}
      >
        <Search size={16} color="#64748B" />
        <input
          type="text"
          placeholder="Search notifications by title, message, or keyword..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          style={{
            border: "none",
            backgroundColor: "transparent",
            outline: "none",
            fontSize: "13px",
            color: "#1E293B",
            width: "100%",
          }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => handleSearchChange("")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              color: "#94A3B8",
              display: "flex",
              alignItems: "center",
            }}
            title="Clear search"
          >
            <X size={15} />
          </button>
        )}
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
              onClick={() => {
                setActiveFilter(tab.id);
                if (syncNotifications) {
                  syncNotifications();
                }
              }}
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
            {searchQuery.trim() ? <Search size={26} color="#64748B" /> : <Bell size={26} />}
          </div>
          <h3 className={styles.emptyTitle}>
            {searchQuery.trim()
              ? `No Notifications Matching "${searchQuery}"`
              : activeFilter === "unread"
              ? "All Caught Up"
              : notifications.length === 0
              ? "No Notifications Yet"
              : "No Notifications in this Category"}
          </h3>
          <p className={styles.emptyDesc}>
            {searchQuery.trim()
              ? "We couldn't find any received notifications matching your keyword. Try checking for typos or searching a different term."
              : activeFilter === "unread"
              ? "You're all caught up! No unread notifications at the moment."
              : notifications.length === 0
              ? "You're all caught up! New orders, inventory updates, and delivery alerts will appear here in real-time."
              : "No notifications match this filter. Check other categories or view all alerts."}
          </p>
          {searchQuery.trim() ? (
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
              onClick={() => handleSearchChange("")}
            >
              Clear Search
            </button>
          ) : (
            notifications.length > 0 && activeFilter !== "all" && (
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                onClick={() => setActiveFilter("all")}
              >
                Show All Notifications
              </button>
            )
          )}
        </div>
      ) : (
        <div className={styles.notificationList}>
          {filteredNotifications.map((item) => {
            return (
              <div
                key={item.id}
                className={`${styles.notificationCard} ${!item.isRead ? styles.unreadCard : ""}`}
                style={{ cursor: "pointer" }}
                onClick={() => {
                  handleMarkAsRead(item.id);
                  const target = resolveOrderTargetHref(item);
                  if (target) {
                    router.push(target);
                  }
                }}
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
                      <span
                        className={styles.timeAgo}
                        title={item.timestamp ? new Date(item.timestamp).toLocaleString("en-IN") : undefined}
                      >
                        {formatNotificationTime(item.timestamp, item.timeAgo)}
                      </span>
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
                        href={resolveOrderTargetHref(item)}
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
