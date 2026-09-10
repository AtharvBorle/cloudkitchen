"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Menu,
  Bell,
  Star,
  ShoppingBag,
  ChevronRight,
  PackageCheck,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import ResponsiveNavMenu from "../../nav/ResponsiveNavMenu";
import styles from "./ResponsiveSellerOrders.module.css";

export type OrderFilterTab = "New" | "Preparing" | "Out" | "Done" | "All";

export interface ResponsiveOrderItem {
  id: string;
  orderNumber: string;
  timeAgo: string;
  customerName: string;
  itemsText: string;
  priorOrdersCount: number;
  totalAmount: string;
  rating: number;
  deliveredCount: number;
  cancelledCount: number;
  status: "New" | "Preparing" | "Out" | "Done" | "Cancelled";
}

export interface ResponsiveSellerOrdersProps {
  orders?: ResponsiveOrderItem[];
  ownerName?: string;
  hasUnreadNotifications?: boolean;
  onAccept?: (orderId: string) => void;
  onReject?: (orderId: string) => void;
  onOrderClick?: (order: ResponsiveOrderItem) => void;
  onNotificationClick?: () => void;
  onSyncDevices?: () => void;
}

const DEFAULT_ORDERS: ResponsiveOrderItem[] = [
  {
    id: "1",
    orderNumber: "#1234",
    timeAgo: "12 min ago",
    customerName: "Priya Mehta",
    itemsText: "32 items • ₹850",
    priorOrdersCount: 18,
    totalAmount: "₹1,200",
    rating: 4.5,
    deliveredCount: 128,
    cancelledCount: 3,
    status: "New",
  },
  {
    id: "2",
    orderNumber: "#1235",
    timeAgo: "15 min ago",
    customerName: "Priya Mehta",
    itemsText: "32 items • ₹850",
    priorOrdersCount: 18,
    totalAmount: "₹1,200",
    rating: 4.5,
    deliveredCount: 128,
    cancelledCount: 3,
    status: "New",
  },
  {
    id: "3",
    orderNumber: "#1236",
    timeAgo: "22 min ago",
    customerName: "Priya Mehta",
    itemsText: "32 items • ₹850",
    priorOrdersCount: 18,
    totalAmount: "₹1,200",
    rating: 4.5,
    deliveredCount: 128,
    cancelledCount: 3,
    status: "New",
  },
  {
    id: "4",
    orderNumber: "#1237",
    timeAgo: "30 min ago",
    customerName: "Priya Mehta",
    itemsText: "32 items • ₹850",
    priorOrdersCount: 18,
    totalAmount: "₹1,200",
    rating: 4.5,
    deliveredCount: 128,
    cancelledCount: 3,
    status: "New",
  },
  {
    id: "5",
    orderNumber: "#1233",
    timeAgo: "24 min ago",
    customerName: "Rohan Sharma",
    itemsText: "14 items • ₹420",
    priorOrdersCount: 6,
    totalAmount: "₹420",
    rating: 4.8,
    deliveredCount: 42,
    cancelledCount: 1,
    status: "Preparing",
  },
  {
    id: "6",
    orderNumber: "#1231",
    timeAgo: "35 min ago",
    customerName: "Sneha Kapoor",
    itemsText: "8 items • ₹650",
    priorOrdersCount: 12,
    totalAmount: "₹650",
    rating: 4.9,
    deliveredCount: 89,
    cancelledCount: 0,
    status: "Preparing",
  },
  {
    id: "7",
    orderNumber: "#1230",
    timeAgo: "40 min ago",
    customerName: "Amit Kumar",
    itemsText: "5 items • ₹290",
    priorOrdersCount: 3,
    totalAmount: "₹290",
    rating: 4.2,
    deliveredCount: 15,
    cancelledCount: 2,
    status: "Out",
  },
  {
    id: "8",
    orderNumber: "#1229",
    timeAgo: "1 hr ago",
    customerName: "Anjali Gupta",
    itemsText: "18 items • ₹1,150",
    priorOrdersCount: 24,
    totalAmount: "₹1,150",
    rating: 4.7,
    deliveredCount: 154,
    cancelledCount: 4,
    status: "Done",
  },
];

export const ResponsiveSellerOrders: React.FC<ResponsiveSellerOrdersProps> = ({
  orders = DEFAULT_ORDERS,
  ownerName = "Rahul Sharma",
  hasUnreadNotifications = true,
  onAccept,
  onReject,
  onOrderClick,
  onNotificationClick,
  onSyncDevices,
}) => {
  const router = useRouter();
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<OrderFilterTab>("New");
  const [ordersList, setOrdersList] = useState<ResponsiveOrderItem[]>(orders);

  // Filter tab counts
  const newCount = ordersList.filter((o) => o.status === "New").length;
  const preparingCount = ordersList.filter((o) => o.status === "Preparing").length;
  const outCount = ordersList.filter((o) => o.status === "Out").length;
  const doneCount = ordersList.filter((o) => o.status === "Done").length;

  const filteredOrders = ordersList.filter((order) => {
    if (selectedTab === "All") return true;
    return order.status === selectedTab;
  });

  const handleCardClick = (order: ResponsiveOrderItem) => {
    if (onOrderClick) {
      onOrderClick(order);
    } else {
      router.push("/seller/orders/details");
    }
  };

  const handleAcceptOrder = (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAccept) {
      onAccept(orderId);
    } else {
      setOrdersList((prev) =>
        prev.map((ord) => (ord.id === orderId ? { ...ord, status: "Preparing" as const } : ord))
      );
    }
  };

  const handleRejectOrder = (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onReject) {
      onReject(orderId);
    } else {
      setOrdersList((prev) =>
        prev.map((ord) => (ord.id === orderId ? { ...ord, status: "Cancelled" as const } : ord))
      );
    }
  };

  return (
    <div className={styles.screenWrapper}>
      {/* Drawer Navigation Menu */}
      <ResponsiveNavMenu
        isOpen={isNavMenuOpen}
        onClose={() => setIsNavMenuOpen(false)}
        activeItemId="orders"
        ownerName={ownerName}
        onSyncDevices={onSyncDevices}
      />

      {/* Main Responsive Mobile View Container */}
      <div className={styles.mobileContainer}>
        {/* Top Header */}
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

          <h1 className={styles.pageTitle}>Orders</h1>

          <button
            type="button"
            className={styles.iconButton}
            onClick={onNotificationClick}
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={22} />
            {hasUnreadNotifications && <span className={styles.notificationDot} />}
          </button>
        </header>

        {/* Status Filter Tabs (Horizontal scrolling capsule pills) */}
        <div className={styles.filterTabsWrapper} role="tablist" aria-label="Order Status Filters">
          <button
            type="button"
            role="tab"
            aria-selected={selectedTab === "New"}
            className={`${styles.filterPill} ${selectedTab === "New" ? styles.filterPillActive : ""}`}
            onClick={() => setSelectedTab("New")}
          >
            <span>New</span>
            <span className={styles.pillBadge}>{newCount}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={selectedTab === "Preparing"}
            className={`${styles.filterPill} ${selectedTab === "Preparing" ? styles.filterPillActive : ""}`}
            onClick={() => setSelectedTab("Preparing")}
          >
            <span>Preparing</span>
            <span className={styles.pillBadge}>{preparingCount}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={selectedTab === "Out"}
            className={`${styles.filterPill} ${selectedTab === "Out" ? styles.filterPillActive : ""}`}
            onClick={() => setSelectedTab("Out")}
          >
            <span>Out</span>
            <span className={styles.pillBadge}>{outCount}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={selectedTab === "Done"}
            className={`${styles.filterPill} ${selectedTab === "Done" ? styles.filterPillActive : ""}`}
            onClick={() => setSelectedTab("Done")}
          >
            <span>Done</span>
            <span className={styles.pillBadge}>{doneCount}</span>
          </button>
        </div>

        {/* Orders Content Area */}
        <main className={styles.contentArea}>
          {filteredOrders.length > 0 ? (
            <div className={styles.ordersList}>
              {filteredOrders.map((order) => (
                <article
                  key={order.id}
                  className={styles.orderCard}
                  onClick={() => handleCardClick(order)}
                >
                  {/* Top Meta Line: #1234 • 12 min ago > */}
                  <div className={styles.cardTopRow}>
                    <span className={styles.orderMetaText}>
                      {order.orderNumber} • {order.timeAgo}
                    </span>
                    <ChevronRight size={18} className={styles.chevronIcon} />
                  </div>

                  {/* Customer Info & Items */}
                  <div className={styles.customerSection}>
                    <h2 className={styles.customerName}>{order.customerName}</h2>
                    <p className={styles.itemsLine}>{order.itemsText}</p>
                  </div>

                  {/* Prior Orders & Total */}
                  <div className={styles.secondaryInfoRow}>
                    <div className={styles.priorOrdersWrapper}>
                      <ShoppingBag size={14} className={styles.packageIcon} />
                      <span>({order.priorOrdersCount} orders)</span>
                    </div>
                    <span className={styles.totalAmountText}>{order.totalAmount}</span>
                  </div>

                  {/* Customer Stats: ⭐ 4.5 • 128 Delivered • 3 Cancelled (Click to view Reliability Modal) */}
                  <div
                    className={styles.customerStatsRow}
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push("/seller/res/orders/reliability");
                    }}
                    title="View Customer Reliability Score"
                    style={{ cursor: "pointer" }}
                  >
                    <div className={styles.ratingStat}>
                      <Star size={14} className={styles.starIcon} />
                      <span>{order.rating.toFixed(1)}</span>
                    </div>

                    <div className={styles.deliveredStat}>
                      <span className={styles.statDotGreen} />
                      <span>{order.deliveredCount} Delivered</span>
                    </div>

                    <div className={styles.cancelledStat}>
                      <span className={styles.statDotRed} />
                      <span>{order.cancelledCount} Cancelled</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {order.status === "New" && (
                    <div className={styles.actionsRow}>
                      <button
                        type="button"
                        className={styles.acceptButton}
                        onClick={(e) => handleAcceptOrder(order.id, e)}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className={styles.rejectButton}
                        onClick={(e) => handleRejectOrder(order.id, e)}
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {order.status === "Preparing" && (
                    <div className={styles.actionsRow}>
                      <button
                        type="button"
                        className={styles.acceptButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOrdersList((prev) =>
                            prev.map((o) => (o.id === order.id ? { ...o, status: "Out" as const } : o))
                          );
                        }}
                      >
                        Ready for Delivery
                      </button>
                    </div>
                  )}

                  {order.status === "Out" && (
                    <div className={styles.actionsRow}>
                      <button
                        type="button"
                        className={styles.acceptButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOrdersList((prev) =>
                            prev.map((o) => (o.id === order.id ? { ...o, status: "Done" as const } : o))
                          );
                        }}
                      >
                        Mark Delivered
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <PackageCheck size={26} />
              </div>
              <h3 className={styles.emptyTitle}>No {selectedTab} Orders</h3>
              <p className={styles.emptySubtitle}>
                There are currently no orders in {selectedTab.toLowerCase()} status.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ResponsiveSellerOrders;
