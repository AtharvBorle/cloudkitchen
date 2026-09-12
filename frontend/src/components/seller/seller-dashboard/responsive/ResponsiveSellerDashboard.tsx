"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import ResponsiveNavMenu from "../../nav/ResponsiveNavMenu";
import styles from "./ResponsiveSellerDashboard.module.css";

import { useSellerProfile } from "@/hooks/useSellerProfile";

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
  hasUnreadNotifications = true,
  onNotificationClick,
  onOrderClick,
  onSyncDevices,
}) => {
  const router = useRouter();
  const seller = useSellerProfile();
  const effectiveOwnerName = ownerName && ownerName !== "Rahul" && ownerName !== "Rahul Sharma" && ownerName !== "John Doe" ? ownerName : seller.ownerName;
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);


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
            {hasUnreadNotifications && <span className={styles.notificationDot} />}
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

          {/* Section Header: RECENT ORDERS */}
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>RECENT ORDERS</span>
            <Link href="/seller/orders" className={styles.viewAllLink}>
              View all
              <ChevronRight size={14} />
            </Link>
          </div>

          {/* Recent Orders List */}
          <section className={styles.ordersList} aria-label="Recent Orders List">
            {recentOrders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 16px", color: "#64748b", backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 500 }}>No recent orders yet</p>
                <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#94a3b8" }}>New orders from customers will appear here.</p>
              </div>
            ) : (
              recentOrders.map((order) => {
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
