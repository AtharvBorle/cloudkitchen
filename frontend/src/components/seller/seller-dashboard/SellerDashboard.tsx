"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ConsoleSidebar from "../sidebar/Sidebar";
import Topbar from "../nav/Topbar";
import {
  ShoppingBag,
  Truck,
  Calendar,
  CreditCard,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { fetchApi } from "@/lib/fetch-api";
import styles from "./SellerDashboard.module.css";

export interface OrderItem {
  id: string;
  orderId: string;
  customer: string;
  roomNo: string;
  items: string;
  total: string;
  status: "Preparing" | "Pending" | "Out for Delivery" | "Completed" | "Cancelled";
}

const DEFAULT_ORDERS: OrderItem[] = [
  {
    id: "1",
    orderId: "#NCR-8291",
    customer: "Aditya Sharma",
    roomNo: "Room 102",
    items: "1x Butter Chicken, 2x Butter Naan",
    total: "₹480",
    status: "Preparing",
  },
  {
    id: "2",
    orderId: "#NCR-8290",
    customer: "Sneha Patel",
    roomNo: "Room 304",
    items: "1x Margherita Pizza, 1x Coke",
    total: "₹350",
    status: "Pending",
  },
  {
    id: "3",
    orderId: "#NCR-8289",
    customer: "Rohit Verma",
    roomNo: "Room 211",
    items: "1x Veg Biryani, 1x Raita",
    total: "₹290",
    status: "Out for Delivery",
  },
  {
    id: "4",
    orderId: "#NCR-8288",
    customer: "Priya Nair",
    roomNo: "Room 105",
    items: "2x Paneer Tikka, 1x Garlic Naan",
    total: "₹520",
    status: "Completed",
  },
  {
    id: "5",
    orderId: "#NCR-8287",
    customer: "Karan Johar",
    roomNo: "Room 401",
    items: "1x Hakka Noodles, 1x Chilli Chicken",
    total: "₹440",
    status: "Cancelled",
  },
];

export interface SellerDashboardProps {
  ownerName?: string;
  partnerRole?: string;
  avatarInitials?: string;
  orders?: OrderItem[];
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
  onSyncDevices?: () => void;
  onRenewPlan?: () => void;
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({
  ownerName: initialOwnerName = "John Doe",
  partnerRole: initialPartnerRole = "Neo Cloud Partner",
  avatarInitials: initialAvatarInitials = "JD",
  orders: initialOrders,
  onSearch,
  onNotificationClick,
  onSyncDevices,
  onRenewPlan,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [orders, setOrders] = useState<OrderItem[]>(initialOrders || DEFAULT_ORDERS);
  const [overview, setOverview] = useState<any>(null);
  const [ownerName, setOwnerName] = useState(initialOwnerName);
  const [avatarInitials, setAvatarInitials] = useState(initialAvatarInitials);

  useEffect(() => {
    if (initialOrders) {
      setOrders(initialOrders);
      return;
    }

    async function loadDashboard() {
      try {
        const [overviewRes, ordersRes] = await Promise.allSettled([
          fetchApi("/api/seller/dashboard/overview"),
          fetchApi("/api/seller/orders"),
        ]);

        if (overviewRes.status === "fulfilled" && overviewRes.value.ok) {
          const res = await overviewRes.value.json();
          const d = res.data || res;
          setOverview(d);
          if (d.sellerProfile?.businessName) {
            setOwnerName(d.sellerProfile.businessName);
            const words = d.sellerProfile.businessName.split(" ");
            setAvatarInitials(
              words.length > 1
                ? `${words[0][0]}${words[1][0]}`.toUpperCase()
                : words[0].slice(0, 2).toUpperCase()
            );
          }
        }

        if (ordersRes.status === "fulfilled" && ordersRes.value.ok) {
          const res = await ordersRes.value.json();
          const list = res.data?.orders || res.orders || res.data || [];
          if (Array.isArray(list) && list.length > 0) {
            const mapped: OrderItem[] = list.slice(0, 5).map((o: any) => {
              let itemsSummary = "";
              try {
                const parsed = typeof o.items === "string" ? JSON.parse(o.items) : o.items;
                if (Array.isArray(parsed)) {
                  itemsSummary = parsed.map((i: any) => `${i.quantity || 1}x ${i.name}`).join(", ");
                }
              } catch (e) {
                itemsSummary = "Kitchen Items";
              }

              let statusVal: OrderItem["status"] = "Pending";
              const s = (o.status || "").toUpperCase();
              if (s === "PREPARING") statusVal = "Preparing";
              else if (s === "OUT_FOR_DELIVERY" || s === "ON_THE_WAY") statusVal = "Out for Delivery";
              else if (s === "DELIVERED" || s === "COMPLETED") statusVal = "Completed";
              else if (s === "CANCELLED") statusVal = "Cancelled";
              else statusVal = "Pending";

              return {
                id: o.id,
                orderId: `#NCR-${o.id.slice(0, 4).toUpperCase()}`,
                customer: o.user?.name || "Customer",
                roomNo: o.room?.title || o.deliveryAddress || "Room 101",
                items: itemsSummary || "1x Food Item",
                total: `₹${o.totalAmount || 0}`,
                status: statusVal,
              };
            });
            setOrders(mapped);
          }
        }
      } catch (err) {
        console.error("Failed to load seller dashboard data:", err);
      }
    }

    loadDashboard();
  }, [initialOrders]);

  const partnerRole = initialPartnerRole;

  const getStatusBadgeClass = (status: OrderItem["status"]) => {
    switch (status) {
      case "Preparing":
        return styles.statusPreparing;
      case "Pending":
        return styles.statusPending;
      case "Out for Delivery":
        return styles.statusOutForDelivery;
      case "Completed":
        return styles.statusCompleted;
      case "Cancelled":
        return styles.statusCancelled;
      default:
        return styles.statusPending;
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* 1. Left Sidebar Component with active Dashboard tab */}
      <ConsoleSidebar
        activeItemId="dashboard"
        isMobileOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
      />

      {/* 2. Right Content Section */}
      <div className={styles.rightSection}>
        {/* Top Navbar */}
        <Topbar
          title="Owner Operations Console"
          ownerName={ownerName}
          partnerRole={partnerRole}
          avatarInitials={avatarInitials}
          onSearch={onSearch}
          onNotificationClick={onNotificationClick}
          onMenuToggle={() => setIsMobileOpen((prev) => !prev)}
        />

        {/* Main Canvas Area */}
        <main className={styles.mainContent}>
          {/* Header Row: Title & Subtitle + Sync Devices Button */}
          <div className={styles.headerRow}>
            <div className={styles.headerGroup}>
              <h1 className={styles.title}>Operations Dashboard</h1>
              <p className={styles.subtitle}>
                Real-time tracking of Neo Cloud Room revenue and food delivery metrics.
              </p>
            </div>
            <button
              type="button"
              className={styles.syncBtn}
              onClick={onSyncDevices}
            >
              Sync Devices
            </button>
          </div>

          {/* 4-Stat Cards Row */}
          <div className={styles.statsGrid}>
            {/* Card 1: Revenue Today */}
            <div className={styles.statCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardLabel}>Revenue Today</span>
                <div className={styles.iconBadge}>
                  <ShoppingBag size={18} strokeWidth={2.4} />
                </div>
              </div>
              <h2 className={styles.cardValue}>
                {overview ? `₹${(overview.totalRevenue || 0).toLocaleString("en-IN")}` : "₹24,500"}
              </h2>
              <div className={styles.cardFooter}>
                <span className={styles.badgeOrange}>Live</span>
                <span className={styles.footerMuted}>total revenue</span>
              </div>
            </div>

            {/* Card 2: Orders Today */}
            <div className={styles.statCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardLabel}>Orders Today</span>
                <div className={styles.iconBadge}>
                  <Truck size={18} strokeWidth={2.4} />
                </div>
              </div>
              <h2 className={styles.cardValue}>
                {overview?.todayOrdersCount !== undefined ? overview.todayOrdersCount : 18}
              </h2>
              <div className={styles.cardFooter}>
                <span className={styles.badgeOrange}>Active</span>
                <span className={styles.footerMuted}>orders today</span>
              </div>
            </div>

            {/* Card 3: Pending Bookings */}
            <div className={styles.statCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardLabel}>Rooms & Bookings</span>
                <div className={styles.iconBadge}>
                  <Calendar size={18} strokeWidth={2.4} />
                </div>
              </div>
              <h2 className={styles.cardValue}>
                {overview?.roomsCount !== undefined ? `${overview.roomsCount} Rooms` : "4 Rooms"}
              </h2>
              <div className={styles.cardFooter}>
                <span className={styles.badgeOrange}>Inventory</span>
                <span className={styles.footerMuted}>configured units</span>
              </div>
            </div>

            {/* Card 4: COD Outstanding */}
            <div className={styles.statCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardLabel}>COD Outstanding</span>
                <div className={styles.iconBadge}>
                  <CreditCard size={18} strokeWidth={2.4} />
                </div>
              </div>
              <h2 className={styles.cardValue}>
                {overview?.codOutstanding !== undefined ? `₹${(overview.codOutstanding || 0).toLocaleString("en-IN")}` : "₹8,200"}
              </h2>
              <div className={styles.cardFooter}>
                <span className={styles.badgeOrange}>Audit</span>
                <span className={styles.footerMuted}>rider cash balance</span>
              </div>
            </div>
          </div>

          {/* 3. Subscription Warning Banner */}
          <div className={styles.warningBanner}>
            <div className={styles.warningLeft}>
              <AlertTriangle className={styles.warningIcon} size={22} strokeWidth={2.2} />
              <div className={styles.warningTextGroup}>
                <h3 className={styles.warningTitle}>Subscription Renewing Soon!</h3>
                <p className={styles.warningDescription}>
                  Your Neo Partner Gold Plan expires in 4 days. Renew today to avoid interruption in automatic room assignment & delivery dispatcher.
                </p>
              </div>
            </div>
            <button
              type="button"
              className={styles.renewBtn}
              onClick={onRenewPlan}
            >
              Renew Plan
            </button>
          </div>

          {/* 4. Recent Food & Room Orders Table Card */}
          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <h3 className={styles.tableTitle}>Recent Food & Room Orders</h3>
              <Link href="/seller/orders" className={styles.viewAllLink}>
                <span>View All Orders</span>
                <ArrowRight size={16} strokeWidth={2.4} />
              </Link>
            </div>

            <div className={styles.tableContainer}>
              <table className={styles.ordersTable}>
                <thead>
                  <tr>
                    <th>ORDER ID</th>
                    <th>CUSTOMER</th>
                    <th>ROOM NO</th>
                    <th>ITEMS</th>
                    <th>TOTAL</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className={styles.orderIdText}>{order.orderId}</td>
                      <td className={styles.customerText}>{order.customer}</td>
                      <td className={styles.roomNoText}>{order.roomNo}</td>
                      <td className={styles.itemsText}>{order.items}</td>
                      <td className={styles.totalPriceText}>{order.total}</td>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${getStatusBadgeClass(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SellerDashboard;
