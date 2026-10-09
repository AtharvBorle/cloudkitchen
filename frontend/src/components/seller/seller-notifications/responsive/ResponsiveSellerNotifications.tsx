"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Menu as MenuIcon,
  Bell,
  Package,
  Clock,
  Truck,
  Calendar,
  Star,
  DollarSign,
  CheckCircle2,
  X,
  ChevronRight,
  Settings,
  AlertCircle,
  Inbox,
  Search,
} from "lucide-react";
import ResponsiveNavMenu from "../../nav/ResponsiveNavMenu";
import {
  SellerNotificationItem,
  INITIAL_SELLER_NOTIFICATIONS,
  NotificationCategory,
} from "../notificationData";
import styles from "./ResponsiveSellerNotifications.module.css";

type TabFilter = "all" | "unread" | "orders" | "stock" | "delivery" | "timings" | "bookings" | "reviews" | "settlements";

interface TabItem {
  id: TabFilter;
  label: string;
}

const TABS: TabItem[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "orders", label: "Orders" },
  { id: "stock", label: "Stock" },
  { id: "delivery", label: "Delivery" },
  { id: "timings", label: "Timings" },
  { id: "bookings", label: "Bookings" },
  { id: "reviews", label: "Reviews" },
  { id: "settlements", label: "Settlements" },
];

import { useSellerProfile } from "@/hooks/useSellerProfile";
import { useSellerNotifications } from "@/hooks/useSellerNotifications";
import { formatNotificationTime } from "../notificationData";

export interface ResponsiveSellerNotificationsProps {
  ownerName?: string;
  onSyncDevices?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const ResponsiveSellerNotifications: React.FC<ResponsiveSellerNotificationsProps> = ({
  ownerName,
  onSyncDevices,
  searchQuery: searchQueryProp,
  onSearchChange,
}) => {
  const seller = useSellerProfile();
  const effectiveOwnerName =
    ownerName &&
    ownerName !== "Rahul Sharma" &&
    ownerName !== "Rahul" &&
    ownerName !== "John Doe" &&
    ownerName !== "Kitchen Owner"
      ? ownerName
      : seller.ownerName;
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
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [searchQuery, setSearchQuery] = useState(searchQueryProp || "");
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(true);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = (params.get("tab") || params.get("filter") || "").toLowerCase();
      if (
        tabParam === "unread" ||
        tabParam === "orders" ||
        tabParam === "stock" ||
        tabParam === "delivery" ||
        tabParam === "timings" ||
        tabParam === "bookings" ||
        tabParam === "reviews" ||
        tabParam === "settlements"
      ) {
        setActiveTab(tabParam as TabFilter);
      }
    }
  }, []);

  React.useEffect(() => {
    if (searchQueryProp !== undefined) {
      setSearchQuery(searchQueryProp);
    }
  }, [searchQueryProp]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (onSearchChange) onSearchChange(query);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
    showToast("All notifications marked as read");
  };

  const handleToggleRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleRead(id);
  };

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotification(id);
    showToast("Notification dismissed");
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
    // Auto mark read on expansion only if not viewing unread tab
    if (activeTab !== "unread") {
      markAsRead(id);
    }
  };

  // Filtered list
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (activeTab === "unread" && item.isRead) return false;
      if (activeTab !== "all" && activeTab !== "unread" && item.category !== activeTab) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const tokens = q.split(/\s+/).filter(Boolean);

      const title = (item.title || "").toLowerCase();
      const message = (item.message || "").toLowerCase();
      const details = (item.details || "").toLowerCase();
      const category = (item.category || "").toLowerCase();
      const severity = (item.severity || "").toLowerCase();
      const actionLabel = (item.actionLabel || "").toLowerCase();
      const timeAgo = (item.timeAgo || "").toLowerCase();
      const readStatus = item.isRead ? "read" : "unread";

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
  }, [notifications, activeTab, searchQuery]);

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case "stock":
        return <Package size={18} />;
      case "orders":
        return <Bell size={18} />;
      case "delivery":
        return <Truck size={18} />;
      case "timings":
        return <Clock size={18} />;
      case "bookings":
        return <Calendar size={18} />;
      case "reviews":
        return <Star size={18} />;
      case "settlements":
        return <DollarSign size={18} />;
      default:
        return <AlertCircle size={18} />;
    }
  };

  const getCategoryIconStyle = (category: NotificationCategory) => {
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
        return "";
    }
  };

  const getSeverityStyle = (severity: string) => {
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

  const getCountForTab = (tabId: TabFilter) => {
    const list = searchQuery.trim()
      ? notifications.filter((item) => {
          const q = searchQuery.toLowerCase().trim();
          const tokens = q.split(/\s+/).filter(Boolean);
          const title = (item.title || "").toLowerCase();
          const message = (item.message || "").toLowerCase();
          const details = (item.details || "").toLowerCase();
          const category = (item.category || "").toLowerCase();
          const severity = (item.severity || "").toLowerCase();
          const actionLabel = (item.actionLabel || "").toLowerCase();
          const timeAgo = (item.timeAgo || "").toLowerCase();
          const readStatus = item.isRead ? "read" : "unread";

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
        })
      : notifications;

    if (tabId === "all") return list.length;
    if (tabId === "unread") return list.filter((n) => !n.isRead).length;
    return list.filter((n) => n.category === tabId).length;
  };

  return (
    <div className={styles.screenWrapper}>
      {/* Slide-out Navigation Drawer */}
      <ResponsiveNavMenu
        isOpen={isNavMenuOpen}
        onClose={() => setIsNavMenuOpen(false)}
        activeItemId="notifications"
        ownerName={effectiveOwnerName}
        onSyncDevices={onSyncDevices}
      />

      <div className={styles.mobileContainer}>
        {/* Top Sticky Header */}
        <header className={styles.topBar}>
          <div className={styles.headerLeftGroup}>
            <button
              type="button"
              className={styles.iconButton}
              onClick={(e) => {
                e.stopPropagation();
                setIsNavMenuOpen(true);
              }}
              aria-label="Open Navigation Menu"
              title="Menu"
            >
              <MenuIcon size={24} />
            </button>
            <Link href="/seller/dashboard" className={styles.headerLogoLink} title="Neo Cloud Bites">
              <div className={styles.headerLogoWrapper}>
                <Image
                  src="/images/logo-nav.png"
                  alt="Neo Cloud Bites"
                  width={30}
                  height={30}
                  className={styles.headerLogoImg}
                  priority
                />
              </div>
            </Link>
          </div>

          <div className={styles.pageTitleGroup}>
            <h1 className={styles.pageTitle}>Notifications</h1>
            {unreadCount > 0 && <span className={styles.unreadBadge}>{unreadCount}</span>}
          </div>

          <div className={styles.headerRight}>
            {unreadCount > 0 && (
              <button
                type="button"
                className={styles.headerTextBtn}
                onClick={handleMarkAllRead}
              >
                Mark all read
              </button>
            )}
          </div>
        </header>

        {/* Settings Notice Banner */}
        {showBanner && (
          <div className={styles.settingsBanner}>
            <p className={styles.settingsBannerText}>
              Notifications reflect your active preferences in <strong>Settings &gt; Notifications</strong>.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Link href="/seller/settings?tab=notifications" className={styles.settingsBannerLink}>
                Edit
              </Link>
              <button
                type="button"
                onClick={() => setShowBanner(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "2px",
                  color: "#C2410C",
                  display: "inline-flex",
                  alignItems: "center",
                  opacity: 0.8,
                }}
                title="Dismiss"
                aria-label="Dismiss banner"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div
          style={{
            margin: "10px 16px 2px 16px",
            display: "flex",
            alignItems: "center",
            backgroundColor: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "10px",
            padding: "8px 12px",
            gap: "8px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
          }}
        >
          <Search size={16} color="#64748B" />
          <input
            type="text"
            placeholder="Search notifications..."
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
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Horizontal Scrollable Tabs */}
        <div className={styles.pillsContainer}>
          {TABS.map((tab) => {
            const count = getCountForTab(tab.id);
            return (
              <button
                key={tab.id}
                type="button"
                className={`${styles.pillBtn} ${activeTab === tab.id ? styles.activePill : ""}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (syncNotifications) syncNotifications();
                }}
              >
                <span>{tab.label}</span>
                {count > 0 && <span className={styles.pillBadge}>{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Notification List */}
        <main className={styles.contentArea}>
          {filteredNotifications.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIconWrapper}>
                {searchQuery.trim() ? <Search size={24} color="#64748B" /> : <Inbox size={26} />}
              </div>
              <h3 className={styles.emptyTitle}>
                {searchQuery.trim()
                  ? `No Notifications Matching "${searchQuery}"`
                  : activeTab === "unread"
                  ? "All Caught Up"
                  : "No Notifications Here"}
              </h3>
              <p className={styles.emptyDesc}>
                {searchQuery.trim()
                  ? "We couldn't find any notifications matching your keyword. Try a different search term."
                  : activeTab === "unread"
                  ? "You are all caught up! No unread notifications."
                  : `No notifications in this category yet.`}
              </p>
              {searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  style={{
                    marginTop: "8px",
                    padding: "6px 14px",
                    backgroundColor: "#FF5200",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isExpanded = expandedId === notif.id;
              return (
                <div
                  key={notif.id}
                  className={`${styles.notificationCard} ${!notif.isRead ? styles.unreadCard : ""}`}
                  onClick={() => toggleExpand(notif.id)}
                >
                  <div
                    className={`${styles.iconWrapper} ${getCategoryIconStyle(
                      notif.category
                    )}`}
                  >
                    {getCategoryIcon(notif.category)}
                  </div>

                  <div className={styles.cardContent}>
                    <div className={styles.cardTopMeta}>
                      <span
                        className={`${styles.severityTag} ${getSeverityStyle(
                          notif.severity
                        )}`}
                      >
                        {notif.severity}
                      </span>
                      <span
                        className={styles.timeAgo}
                        title={notif.timestamp ? new Date(notif.timestamp).toLocaleString("en-IN") : undefined}
                      >
                        {formatNotificationTime(notif.timestamp, notif.timeAgo)}
                      </span>
                    </div>

                    <div className={styles.cardHeaderRow}>
                      <h4 className={styles.cardTitle}>
                        {!notif.isRead && <span className={styles.unreadDot} />}
                        {notif.title}
                      </h4>
                    </div>

                    <p className={styles.cardMessage}>{notif.message}</p>

                    {(isExpanded || notif.details) && (
                      <div className={styles.cardDetails}>
                        {notif.details}
                      </div>
                    )}


                    <div className={styles.cardFooter}>
                      {notif.actionHref && (
                        <Link
                          href={(() => {
                            if (notif.actionLabel === "Track Dispatch" && notif.actionHref === "/seller/delivery") {
                              return "/seller/orders";
                            }
                            if (notif.category === "orders") {
                              const match = notif.title.match(/#([A-Za-z0-9-]+)/) || notif.id.match(/notif-order-([A-Za-z0-9-]+)/);
                              if (match && (!notif.actionHref || notif.actionHref === "/seller/orders")) {
                                return `/seller/orders/details?orderId=${encodeURIComponent(match[1])}`;
                              }
                            }
                            return notif.actionHref;
                          })()}
                          className={styles.cardActionLink}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {notif.actionLabel || "View"} <ChevronRight size={14} />
                        </Link>
                      )}

                      <button
                        type="button"
                        className={styles.dismissBtn}
                        onClick={(e) => handleToggleRead(notif.id, e)}
                        title={notif.isRead ? "Mark unread" : "Mark as read"}
                        aria-label="Toggle read status"
                        style={{ marginRight: "4px" }}
                      >
                        <CheckCircle2 size={15} color={notif.isRead ? "#10B981" : "#94A3B8"} />
                      </button>

                      <button
                        type="button"
                        className={styles.dismissBtn}
                        onClick={(e) => handleDismiss(notif.id, e)}
                        title="Dismiss"
                        aria-label="Dismiss notification"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </main>

        {/* Toast */}
        {toastMessage && <div className={styles.toast}>{toastMessage}</div>}
      </div>
    </div>
  );
};

export default ResponsiveSellerNotifications;
