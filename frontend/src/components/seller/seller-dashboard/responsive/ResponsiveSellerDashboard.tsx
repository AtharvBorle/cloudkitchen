"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Menu,
  Bell,
  TrendingUp,
  ShoppingBag,
  Calendar,
  DollarSign,
  ChevronRight,
  Search,
  X,
} from "lucide-react";
import ResponsiveNavMenu from "../../nav/ResponsiveNavMenu";
import styles from "./ResponsiveSellerDashboard.module.css";

import { useSellerProfile } from "@/hooks/useSellerProfile";
import { useSellerNotifications } from "@/hooks/useSellerNotifications";

export interface ResponsiveOrderSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  amount: string;
  timeAgo: string;
  status: "New" | "Preparing" | "Delivered" | "Cancelled" | string;
  href?: string;
}

export interface ResponsiveDashboardMetrics {
  todayRevenue?: string;
  ordersToday?: string | number;
  pendingBookings?: string | number;
  codOutstanding?: string;
}

export interface ResponsiveSellerDashboardProps {
  ownerName?: string;
  greetingSubtitle?: string;
  metrics?: ResponsiveDashboardMetrics;
  recentOrders?: ResponsiveOrderSummary[];
  hasUnreadNotifications?: boolean;
  onNotificationClick?: () => void;
  onOrderClick?: (order: ResponsiveOrderSummary) => void;
  onSyncDevices?: () => void;
}

const DEFAULT_METRICS: ResponsiveDashboardMetrics = {
  todayRevenue: "₹0",
  ordersToday: 0,
  pendingBookings: 0,
  codOutstanding: "₹0",
};

export const ResponsiveSellerDashboard: React.FC<ResponsiveSellerDashboardProps> = ({
  ownerName,
  greetingSubtitle = "Here is your business summary today",
  metrics = DEFAULT_METRICS,
  recentOrders = [],
  hasUnreadNotifications,
  onNotificationClick,
  onOrderClick,
  onSyncDevices,
}) => {
  const router = useRouter();
  const seller = useSellerProfile();
  const { unreadCount } = useSellerNotifications();
  const isNotificationActive =
    hasUnreadNotifications !== undefined ? hasUnreadNotifications : unreadCount > 0;
  const effectiveOwnerName =
    ownerName &&
    ownerName !== "Rahul Sharma" &&
    ownerName !== "Rahul" &&
    ownerName !== "John Doe" &&
    ownerName !== "Kitchen Owner"
      ? ownerName
      : seller.ownerName;
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);

  // Verification status routing protection:
  // If seller is PENDING, REVISION, or REJECTED, redirect them to the verification status page.
  useEffect(() => {
    if (seller.authStatus === "authenticated") {
      const vStatus = seller.profile?.verificationStatus;
      if (vStatus === "PENDING" || vStatus === "REVISION" || vStatus === "REJECTED") {
        router.replace("/seller/verification-status");
      }
    }
  }, [seller.authStatus, seller.profile?.verificationStatus, router]);


  const getStatusBadgeStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "new":
        return styles.statusNew;
      case "preparing":
        return styles.statusPreparing;
      case "delivered":
      case "completed":
        return styles.statusDelivered;
      case "cancelled":
        return styles.statusCancelled;
      default:
        return styles.statusDefault;
    }
  };

  const handleOrderClick = (order: ResponsiveOrderSummary, e: React.MouseEvent) => {
    if (onOrderClick) {
      onOrderClick(order);
    }
  };

  const handleNotificationClick = () => {
    if (onNotificationClick) {
      onNotificationClick();
    } else {
      router.push("/seller/notifications");
    }
  };

  const [searchQuery, setSearchQuery] = useState("");

  const displayedRecentOrders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return recentOrders;
    return recentOrders.filter(
      (order) =>
        (order.customerName || "").toLowerCase().includes(q) ||
        (order.orderNumber || "").toLowerCase().includes(q) ||
        (order.id || "").toLowerCase().includes(q) ||
        (order.status || "").toLowerCase().includes(q)
    );
  }, [recentOrders, searchQuery]);

  return (
    <div className={styles.screenWrapper}>
      {/* Drawer Navigation Menu */}
      <ResponsiveNavMenu
        isOpen={isNavMenuOpen}
        onClose={() => setIsNavMenuOpen(false)}
        activeItemId="dashboard"
        ownerName={effectiveOwnerName}
        onSyncDevices={onSyncDevices}
      />

      {/* Main Responsive Mobile View Container */}
      <div className={styles.mobileContainer}>
        {/* Top Header with Hamburger, Logo and Notification */}
        <header className={styles.topBar}>
          {/* Top-Left Hamburger Menu + Logo */}
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
              <Menu size={24} />
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

          {/* Centered Page Title */}
          <h1 className={styles.pageTitle}>Dashboard</h1>

          {/* Top-Right Notification Bell */}
          <button
            type="button"
            className={styles.iconButton}
            onClick={handleNotificationClick}
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={22} />
            {isNotificationActive && <span className={styles.notificationDot} />}
          </button>
        </header>

        {/* Content Area */}
        <main className={styles.contentArea}>
          {/* Greeting Section */}
          <section className={styles.greetingSection}>
            <h2 className={styles.greetingTitle}>Hi, {effectiveOwnerName}</h2>
            <p className={styles.greetingSubtitle}>{greetingSubtitle}</p>
          </section>

          {/* 2x2 Metric Cards Grid */}
          <section className={styles.metricsGrid} aria-label="Business Metrics Summary">
            {/* 1. Today's Revenue */}
            <div className={styles.metricCard}>
              <div className={styles.metricIconWrapper}>
                <TrendingUp size={22} strokeWidth={2.5} />
              </div>
              <h3 className={styles.metricValue}>
                {metrics.todayRevenue ?? DEFAULT_METRICS.todayRevenue}
              </h3>
              <p className={styles.metricLabel}>Today's Revenue</p>
            </div>

            {/* 2. Orders Today */}
            <div className={styles.metricCard}>
              <div className={styles.metricIconWrapper}>
                <ShoppingBag size={22} strokeWidth={2.3} />
              </div>
              <h3 className={styles.metricValue}>
                {metrics.ordersToday ?? DEFAULT_METRICS.ordersToday}
              </h3>
              <p className={styles.metricLabel}>Orders Today</p>
            </div>

            {/* 3. Pending Bookings */}
            <div className={styles.metricCard}>
              <div className={styles.metricIconWrapper}>
                <Calendar size={22} strokeWidth={2.3} />
              </div>
              <h3 className={styles.metricValue}>
                {metrics.pendingBookings ?? DEFAULT_METRICS.pendingBookings}
              </h3>
              <p className={styles.metricLabel}>Pending Bookings</p>
            </div>

            {/* 4. COD Outstanding */}
            <div className={styles.metricCard}>
              <div className={styles.metricIconWrapper}>
                <DollarSign size={22} strokeWidth={2.5} />
              </div>
              <h3 className={styles.metricValue}>
                {metrics.codOutstanding ?? DEFAULT_METRICS.codOutstanding}
              </h3>
              <p className={styles.metricLabel}>COD Outstanding</p>
            </div>
          </section>

          {/* Search Bar for Orders */}
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              border: "1px solid #E2E8F0",
              padding: "9px 14px",
              gap: "10px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}
          >
            <Search size={17} color="#94A3B8" />
            <input
              type="text"
              placeholder="Search by customer name or order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                width: "100%",
                fontSize: "13.5px",
                color: "#0F172A",
                backgroundColor: "transparent",
              }}
              aria-label="Search orders"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94A3B8",
                  cursor: "pointer",
                  padding: "2px",
                  display: "flex",
                  alignItems: "center",
                }}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Section Header: RECENT ORDERS */}
          <div className={styles.sectionHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className={styles.sectionTitle}>RECENT ORDERS</span>
              {searchQuery.trim() && (
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#EA580C",
                    backgroundColor: "#FFF7ED",
                    padding: "2px 8px",
                    borderRadius: "6px",
                  }}
                >
                  {displayedRecentOrders.length} found
                </span>
              )}
            </div>
            <Link href="/seller/orders" className={styles.viewAllLink}>
              View all
              <ChevronRight size={14} />
            </Link>
          </div>

          {/* Recent Orders List */}
          <section className={styles.ordersList} aria-label="Recent Orders List">
            {displayedRecentOrders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 16px", color: "#64748b", backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <Search size={24} color="#94A3B8" style={{ marginBottom: "6px" }} />
                <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 600, color: "#1E293B" }}>
                  {searchQuery.trim()
                    ? `No orders matching "${searchQuery}"`
                    : "No recent orders yet"}
                </p>
                <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#94a3b8" }}>
                  {searchQuery.trim()
                    ? "Try searching with a different customer name or order ID."
                    : "New orders from customers will appear here."}
                </p>
                {searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    style={{
                      marginTop: "10px",
                      backgroundColor: "#FFF7ED",
                      border: "1px solid #FED7AA",
                      color: "#EA580C",
                      padding: "5px 12px",
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
              displayedRecentOrders.map((order) => {
                const badgeClass = getStatusBadgeStyle(order.status);
                const cardContent = (
                  <>
                    <div className={styles.orderLeft}>
                      <div className={styles.orderHeaderLine}>
                        <span className={styles.orderNumber}>{order.orderNumber}</span>
                        <span className={styles.customerName}>{order.customerName}</span>
                      </div>
                      <div className={styles.orderMetaLine}>
                        <span className={styles.orderAmount}>{order.amount}</span>
                        <span className={styles.metaDot}>•</span>
                        <span className={styles.orderTime}>{order.timeAgo}</span>
                      </div>
                    </div>

                    <div className={styles.orderRight}>
                      <span className={`${styles.statusBadge} ${badgeClass}`}>
                        {order.status}
                      </span>
                      <ChevronRight size={18} className={styles.chevronIcon} />
                    </div>
                  </>
                );

                if (order.href) {
                  return (
                    <Link
                      key={order.id}
                      href={order.href}
                      className={styles.orderCard}
                      onClick={(e) => handleOrderClick(order, e)}
                    >
                      {cardContent}
                    </Link>
                  );
                }

                return (
                  <div
                    key={order.id}
                    className={styles.orderCard}
                    onClick={(e) => handleOrderClick(order, e)}
                    role="button"
                    tabIndex={0}
                  >
                    {cardContent}
                  </div>
                );
              })
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default ResponsiveSellerDashboard;
