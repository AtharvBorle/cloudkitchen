"use client";

import React, { useState } from "react";
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

export interface ResponsiveSellerNotificationsProps {
  ownerName?: string;
  onSyncDevices?: () => void;
}

export const ResponsiveSellerNotifications: React.FC<ResponsiveSellerNotificationsProps> = ({
  ownerName,
  onSyncDevices,
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
  const [notifications, setNotifications] = useState<SellerNotificationItem[]>(
    INITIAL_SELLER_NOTIFICATIONS
  );
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    showToast("All notifications marked as read");
  };

  const handleToggleRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n))
    );
  };

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    showToast("Notification dismissed");
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
    // Auto mark read on expansion
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  // Filtered list
  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !item.isRead;
    return item.category === activeTab;
  });

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

    if (tabId === "all") return notifications.length;
    if (tabId === "unread") return unreadCount;
    return notifications.filter((n) => n.category === tabId).length;
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
        <div className={styles.settingsBanner}>
          <p className={styles.settingsBannerText}>
            Notifications reflect your active preferences in <strong>Settings &gt; Notifications</strong>.
          </p>
          <Link href="/seller/settings" className={styles.settingsBannerLink}>
            Edit
          </Link>
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
                onClick={() => setActiveTab(tab.id)}
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
                <Inbox size={26} />
              </div>
              <h3 className={styles.emptyTitle}>No Notifications Here</h3>
              <p className={styles.emptyDesc}>
                {activeTab === "unread"
                  ? "You are all caught up! No unread notifications."
                  : `No notifications in this category yet.`}
              </p>
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
                      <span className={styles.timeAgo}>{notif.timeAgo}</span>
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
                          href={notif.actionHref}
                          className={styles.cardActionLink}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {notif.actionLabel || "View"} <ChevronRight size={14} />
                        </Link>
                      )}

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
