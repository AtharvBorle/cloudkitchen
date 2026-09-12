"use client";

import React, { useState, useEffect } from "react";
import ConsoleSidebar from "../sidebar/Sidebar";
import Topbar from "../nav/Topbar";
import { fetchApi } from "@/lib/fetch-api";
import { useSellerProfile } from "@/hooks/useSellerProfile";
import styles from "./SellerOrders.module.css";

export type OrderStatusFilter =
  | "All"
  | "Pending"
  | "Preparing"
  | "Out for Delivery"
  | "Completed"
  | "Cancelled";

export interface OrderRow {
  id: string;
  orderId: string;
  customer: string;
  room: string;
  items: string;
  total: string;
  status: "Preparing" | "Pending" | "Out for Delivery" | "Completed" | "Cancelled";
  time: string;
}

export interface SellerOrdersProps {
  ownerName?: string;
  partnerRole?: string;
  avatarInitials?: string;
  orders?: OrderRow[];
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
}

export const SellerOrders: React.FC<SellerOrdersProps> = ({
  ownerName: initialOwnerName,
  partnerRole: initialPartnerRole,
  avatarInitials: initialAvatarInitials,
  orders,
  onSearch,
  onNotificationClick,
}) => {
  const seller = useSellerProfile();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<OrderStatusFilter>("All");
  const [orderList, setOrderList] = useState<OrderRow[]>(orders || []);
  const [loading, setLoading] = useState(false);

  const ownerName = initialOwnerName || seller.ownerName;
  const partnerRole = initialPartnerRole || seller.partnerRole;
  const avatarInitials = initialAvatarInitials || seller.avatarInitials;

  useEffect(() => {
    if (orders) {
      setOrderList(orders);
      return;
    }

    async function loadOrders() {
      try {
        setLoading(true);
        const res = await fetchApi("/api/seller/orders");
        if (res.ok) {
          const data = await res.json();
          const list = data.data?.orders || data.orders || data.data || [];
          if (Array.isArray(list)) {
            const mapped: OrderRow[] = list.map((o: any) => {
              let itemsSummary = "";
              try {
                const parsed = typeof o.items === "string" ? JSON.parse(o.items) : o.items;
                if (Array.isArray(parsed)) {
                  itemsSummary = parsed.map((i: any) => `${i.quantity || 1}x ${i.name}`).join(", ");
                }
              } catch (e) {
                itemsSummary = "Kitchen Items";
              }

              let statusVal: OrderRow["status"] = "Pending";
              const s = (o.status || "").toUpperCase();
              if (s === "PREPARING") statusVal = "Preparing";
              else if (s === "OUT_FOR_DELIVERY" || s === "ON_THE_WAY") statusVal = "Out for Delivery";
              else if (s === "DELIVERED" || s === "COMPLETED") statusVal = "Completed";
              else if (s === "CANCELLED") statusVal = "Cancelled";
              else statusVal = "Pending";

              const timeAgoStr = o.createdAt
                ? new Date(o.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                : "Just now";

              return {
                id: o.id,
                orderId: `#NCR-${o.id.slice(0, 4).toUpperCase()}`,
                customer: o.user?.name || "Customer",
                room: o.room?.title || o.deliveryAddress || "Room 101",
                items: itemsSummary || "1x Dish Item",
                total: `₹${o.totalAmount || 0}`,
                status: statusVal,
                time: timeAgoStr,
              };
            });
            setOrderList(mapped);
          }
        }
      } catch (err) {
        console.error("Failed to load seller orders:", err);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [orders]);

  const statusFilters: OrderStatusFilter[] = [
    "All",
    "Pending",
    "Preparing",
    "Out for Delivery",
    "Completed",
    "Cancelled",
  ];

  const filteredOrders =
    activeFilter === "All"
      ? orderList
      : orderList.filter((order) => order.status === activeFilter);

  const getStatusBadgeClass = (status: OrderRow["status"]) => {
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
    <div className={styles.ordersContainer}>
      {/* 1. Left Sidebar Component with active Orders tab */}
      <ConsoleSidebar
        activeItemId="orders"
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

        {/* Main Orders Content */}
        <main className={styles.mainContent}>
          {/* Header Title & Subtitle */}
          <div className={styles.headerGroup}>
            <h1 className={styles.title}>Food & Service Orders</h1>
            <p className={styles.subtitle}>
              Manage active incoming, preparation, and delivery cycles.
            </p>
          </div>

          {/* Control Bar: Status Filter Tabs + Right Filter/Sort Buttons */}
          <div className={styles.controlBar}>
            {/* Status Segmented Pill Group */}
            <div className={styles.statusPillGroup}>
              {statusFilters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`${styles.statusPillBtn} ${
                    activeFilter === filter ? styles.activePill : ""
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Right Side Options */}
            <div className={styles.rightFilters}>
              <button type="button" className={styles.filterBtn}>
                <span>Filter: Today</span>
              </button>
              <button type="button" className={styles.filterBtn}>
                <span>Sort: Newest</span>
              </button>
            </div>
          </div>

          {/* Orders Table Card */}
          <div className={styles.tableCard}>
            <div className={styles.tableContainer}>
              <table className={styles.ordersTable}>
                <thead>
                  <tr>
                    <th>ORDER ID</th>
                    <th>CUSTOMER</th>
                    <th>ROOM</th>
                    <th>ITEMS</th>
                    <th>TOTAL</th>
                    <th>STATUS</th>
                    <th>TIME</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "40px 16px", color: "#64748b", fontSize: "14px" }}>
                        {loading ? "Loading orders..." : `No ${activeFilter !== "All" ? activeFilter.toLowerCase() : ""} orders found.`}
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        onClick={() => {
                          window.location.href = "/seller/order-default";
                        }}
                        style={{ cursor: "pointer" }}
                        title="Click to view order details"
                      >
                        <td className={styles.orderIdText}>{order.orderId}</td>
                        <td className={styles.customerText}>{order.customer}</td>
                        <td className={styles.roomText}>{order.room}</td>
                        <td className={styles.itemsText}>{order.items}</td>
                        <td className={styles.totalText}>{order.total}</td>
                        <td>
                          <span
                            className={`${styles.statusBadge} ${getStatusBadgeClass(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className={styles.timeText}>{order.time}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SellerOrders;
