"use client";

import React, { useState } from "react";
import ConsoleSidebar from "../sidebar/Sidebar";
import Topbar from "../nav/Topbar";
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

const DEFAULT_ORDERS: OrderRow[] = [
  {
    id: "1",
    orderId: "#NCR-8291",
    customer: "Aditya Sharma",
    room: "Room 102",
    items: "1x Butter Chicken, 2x Butter Naan",
    total: "₹480",
    status: "Preparing",
    time: "10 mins ago",
  },
  {
    id: "2",
    orderId: "#NCR-8290",
    customer: "Sneha Patel",
    room: "Room 304",
    items: "1x Margherita Pizza, 1x Coke",
    total: "₹350",
    status: "Pending",
    time: "14 mins ago",
  },
  {
    id: "3",
    orderId: "#NCR-8289",
    customer: "Rohit Verma",
    room: "Room 211",
    items: "1x Veg Biryani, 1x Raita",
    total: "₹290",
    status: "Out for Delivery",
    time: "22 mins ago",
  },
  {
    id: "4",
    orderId: "#NCR-8288",
    customer: "Priya Nair",
    room: "Room 105",
    items: "2x Paneer Tikka, 1x Garlic Naan",
    total: "₹520",
    status: "Completed",
    time: "45 mins ago",
  },
  {
    id: "5",
    orderId: "#NCR-8287",
    customer: "Karan Johar",
    room: "Room 401",
    items: "1x Hakka Noodles, 1x Chilli Chicken",
    total: "₹440",
    status: "Cancelled",
    time: "1 hour ago",
  },
  {
    id: "6",
    orderId: "#NCR-8286",
    customer: "Vikram Malhotra",
    room: "Room 302",
    items: "2x Club Sandwich, 2x Cold Coffee",
    total: "₹610",
    status: "Completed",
    time: "2 hours ago",
  },
];

export interface SellerOrdersProps {
  ownerName?: string;
  partnerRole?: string;
  avatarInitials?: string;
  orders?: OrderRow[];
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
}

export const SellerOrders: React.FC<SellerOrdersProps> = ({
  ownerName = "John Doe",
  partnerRole = "Neo Cloud Partner",
  avatarInitials = "JD",
  orders = DEFAULT_ORDERS,
  onSearch,
  onNotificationClick,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<OrderStatusFilter>("All");

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
      ? orders
      : orders.filter((order) => order.status === activeFilter);

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
                  {filteredOrders.map((order) => (
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

export default SellerOrders;
