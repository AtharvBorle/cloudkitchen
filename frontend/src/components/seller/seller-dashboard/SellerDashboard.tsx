"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ConsoleSidebar from "../sidebar/Sidebar";
import Topbar from "../nav/Topbar";
import {
  ShoppingBag,
  Truck,
  Calendar,
  CreditCard,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Lock,
} from "lucide-react";
import { fetchApi } from "@/lib/fetch-api";
import { useSellerProfile } from "@/hooks/useSellerProfile";
import { useRealtimeStream } from "@/hooks/useRealtimeStream";
import { playNewOrderChime } from "@/lib/audio-chime";
import { performLogout } from "@/lib/logout";
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
  ownerName: initialOwnerName,
  partnerRole: initialPartnerRole,
  avatarInitials: initialAvatarInitials,
  orders: initialOrders,
  onSearch,
  onNotificationClick,
  onSyncDevices,
  onRenewPlan,
}) => {
  const router = useRouter();
  const seller = useSellerProfile();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [orders, setOrders] = useState<OrderItem[]>(initialOrders || []);
  const [overview, setOverview] = useState<any>(null);
  const [statusData, setStatusData] = useState<any>(null);

  const ownerName = initialOwnerName || seller.ownerName;
  const partnerRole = initialPartnerRole || seller.partnerRole;
  const avatarInitials = initialAvatarInitials || seller.avatarInitials;

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

  useEffect(() => {
    async function loadStatus() {
      try {
        const res = await fetchApi("/api/seller/dashboard/status");
        if (res.ok) {
          const d = await res.json();
          setStatusData(d.data || d);
        }
      } catch (err) {
        console.error("Failed to load dashboard status:", err);
      }
    }
    loadStatus();
  }, []);

  useEffect(() => {
    if (initialOrders && initialOrders.length > 0) {
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
        }

        if (ordersRes.status === "fulfilled" && ordersRes.value.ok) {
          const res = await ordersRes.value.json();
          const list = res.data?.orders || res.orders || res.data || [];
          if (Array.isArray(list)) {
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

  // Real-time SSE stream subscription (replaces 4s polling)
  useRealtimeStream({
    url: "/api/seller/orders/stream",
    onConnected: () => {
      fetchApi("/api/seller/dashboard/overview")
        .then((r) => r.ok && r.json())
        .then((d) => d && setOverview(d.data || d))
        .catch(() => {});
    },
    onOrder: (payload) => {
      if (payload.event === "ORDER_CREATED") {
        playNewOrderChime();
      }
      // Instant reload of metrics & recent orders upon new order or status change
      fetchApi("/api/seller/dashboard/overview")
        .then((r) => r.ok && r.json())
        .then((d) => d && setOverview(d.data || d))
        .catch(() => {});

      fetchApi("/api/seller/orders")
        .then((r) => r.ok && r.json())
        .then((res) => {
          const list = res.data?.orders || res.orders || res.data || [];
          if (Array.isArray(list)) {
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
        })
        .catch(() => {});
    },
  });

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

  const isRejected = seller.profile?.verificationStatus === "REJECTED";
  const hasActiveSub = statusData ? Boolean(statusData.hasActiveSub) : true;

  const handleOpenSubscriptionModal = () => {
    window.dispatchEvent(
      new CustomEvent("open-subscription-modal", {
        detail: { category: seller.profile?.businessCategory || "FOOD" },
      })
    );
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* 1. Left Sidebar Component with active Dashboard tab */}
      <ConsoleSidebar
        activeItemId="dashboard"
        isMobileOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        ownerName={ownerName}
        partnerRole={partnerRole}
        avatarInitials={avatarInitials}
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
          {isRejected ? (
            <div style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "20px",
              border: "1px solid #FEE2E2",
              padding: "48px 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              maxWidth: "540px",
              margin: "40px auto",
              boxShadow: "0 10px 30px rgba(220, 38, 38, 0.06)",
              gap: "14px",
            }}>
              <div style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                backgroundColor: "#FEF2F2",
                color: "#DC2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <ShieldAlert size={36} />
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#991B1B", margin: 0 }}>
                Application Declined
              </h2>
              <p style={{ fontSize: "14px", color: "#64748B", lineHeight: 1.5, margin: 0 }}>
                Your seller application has been declined by the administration team. Dashboard operations are currently disabled.
              </p>
              {seller.profile?.verificationNote && (
                <div style={{
                  backgroundColor: "#FFF5F5",
                  border: "1px solid #FECACA",
                  borderRadius: "10px",
                  padding: "14px 18px",
                  fontSize: "13px",
                  color: "#991B1B",
                  textAlign: "left",
                  width: "100%",
                  boxSizing: "border-box",
                }}>
                  <strong style={{ display: "block", marginBottom: "4px" }}>Admin Feedback:</strong>
                  <p style={{ margin: 0, color: "#7F1D1D" }}>{seller.profile.verificationNote}</p>
                </div>
              )}
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center", marginTop: "10px" }}>
                <Link
                  href="/seller/verification-status"
                  style={{
                    padding: "11px 20px",
                    background: "linear-gradient(135deg, #EA580C, #F97316)",
                    color: "#FFFFFF",
                    borderRadius: "10px",
                    fontSize: "13.5px",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  View Verification Status
                </Link>
                <Link
                  href="/seller/support"
                  style={{
                    padding: "11px 20px",
                    backgroundColor: "#F1F5F9",
                    color: "#334155",
                    borderRadius: "10px",
                    fontSize: "13.5px",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  Contact Support
                </Link>
                <button
                  type="button"
                  onClick={() => performLogout({ role: "SELLER" })}
                  style={{
                    padding: "11px 20px",
                    background: "none",
                    border: "1px solid #CBD5E1",
                    color: "#64748B",
                    borderRadius: "10px",
                    fontSize: "13.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Inactive Subscription Notice Banner */}
              {!hasActiveSub && (
                <div style={{
                  backgroundColor: "#FFF1E8",
                  border: "1.5px solid #FFD4C2",
                  borderRadius: "16px",
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  marginBottom: "20px",
                  flexWrap: "wrap",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      backgroundColor: "#FF5500",
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: "14.5px", fontWeight: "700", color: "#0F172A", margin: "0 0 2px 0" }}>
                        Account Verified — Subscription Plan Required
                      </h3>
                      <p style={{ fontSize: "12.5px", color: "#64748B", margin: 0 }}>
                        Activate your partner subscription to unlock live order processing, menu management, and room booking tools.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/seller/payment"
                    style={{
                      padding: "10px 18px",
                      backgroundColor: "#FF5500",
                      color: "#FFFFFF",
                      borderRadius: "10px",
                      fontSize: "13px",
                      fontWeight: 600,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 2px 8px rgba(255, 85, 0, 0.25)",
                    }}
                  >
                    <span>Pay Subscription</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              )}

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
                    {overview ? `₹${(overview.totalRevenue || 0).toLocaleString("en-IN")}` : "₹0"}
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
                    {overview?.todayOrdersCount !== undefined ? overview.todayOrdersCount : 0}
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
                    {overview?.roomsCount !== undefined ? `${overview.roomsCount} Rooms` : "0 Rooms"}
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
                    {overview?.codOutstanding !== undefined ? `₹${(overview.codOutstanding || 0).toLocaleString("en-IN")}` : "₹0"}
                  </h2>
                  <div className={styles.cardFooter}>
                    <span className={styles.badgeOrange}>Audit</span>
                    <span className={styles.footerMuted}>rider cash balance</span>
                  </div>
                </div>
              </div>

              {/* 3. Subscription Warning Banner (only if validUntilDate is approaching or present) */}
              {overview?.validUntilDate && new Date(overview.validUntilDate).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000 && (
                <div className={styles.warningBanner}>
                  <div className={styles.warningLeft}>
                    <AlertTriangle className={styles.warningIcon} size={22} strokeWidth={2.2} />
                    <div className={styles.warningTextGroup}>
                      <h3 className={styles.warningTitle}>Subscription Renewing Soon!</h3>
                      <p className={styles.warningDescription}>
                        Your Partner Plan expires on {new Date(overview.validUntilDate).toLocaleDateString("en-IN")}. Renew to avoid interruption.
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
              )}

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
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: "center", padding: "36px 16px", color: "#64748b", fontSize: "14px" }}>
                            No recent orders received yet today.
                          </td>
                        </tr>
                      ) : (
                        orders.map((order) => (
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
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default SellerDashboard;
