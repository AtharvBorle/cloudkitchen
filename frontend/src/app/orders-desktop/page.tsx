"use client";

import React from "react";
import { Navbar } from "@/components/navbar";
import { OrdersHeader } from "@/components/orders-desktop/orders-header";
import { ActiveOrders } from "@/components/orders-desktop/active-orders";
import { PastOrders } from "@/components/orders-desktop/past-orders";

import styles from "./OrdersPage.module.css";

export default function OrdersDesktopPage() {
  return (
    <div className={styles.pageWrapper}>
      {/* 1. Shared Desktop Navbar Component (hidden on mobile <=768px) */}
      <div className={styles.desktopNavbar}>
        <Navbar
          navItems={["Home", "Explore", "Orders", "Rooms", "Settings"]}
          initialActiveItem="Orders"
        />
      </div>

      <main className={styles.mainContent}>
        {/* 2. Orders Header & Category Filters */}
        <OrdersHeader />

        {/* 3. Active Orders Section (Food Live Tracking & Room Subscriptions) */}
        <ActiveOrders />

        {/* 4. Past Orders Section */}
        <PastOrders />
      </main>
    </div>
  );
}
