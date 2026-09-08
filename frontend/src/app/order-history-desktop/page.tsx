"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/navbar";
import { SettingsSidebar } from "@/components/settings-desktop/settings-sidebar";
import { OrderHistoryHeader } from "@/components/order-history-desktop/order-history-header";
import { OrderFilters, OrderFilterTab } from "@/components/order-history-desktop/order-filters";
import { OrderList, SAMPLE_ORDERS } from "@/components/order-history-desktop/order-list";

import styles from "./OrderHistoryPage.module.css";

export default function OrderHistoryDesktopPage() {
  const [activeTab, setActiveTab] = useState<OrderFilterTab>("all");

  const filteredOrders = SAMPLE_ORDERS.filter((order) => {
    if (activeTab === "delivered") return order.status === "DELIVERED";
    if (activeTab === "cancelled") return order.status === "CANCELLED";
    return true;
  });

  return (
    <div className={styles.pageWrapper}>
      {/* 1. Shared Desktop Navbar with Settings Active */}
      <div className={styles.desktopNavbar}>
        <Navbar
          navItems={["Home", "Explore", "Orders", "Rooms", "Settings"]}
          initialActiveItem="Settings"
        />
      </div>

      <main className={styles.mainContainer}>
        <div className={styles.layoutRow}>
          {/* Left Column: Shared Profile Sidebar with Order History Active */}
          <div className={styles.sidebarWrapper}>
            <SettingsSidebar activeTabId="order-history" />
          </div>

          {/* Right Column: Order History Content Sections */}
          <div className={styles.contentWrapper}>
            {/* 2. Order History Header */}
            <OrderHistoryHeader />

            {/* 3. Order Status & Date Filters */}
            <OrderFilters
              activeTab={activeTab}
              onTabChange={(tab) => setActiveTab(tab)}
            />

            {/* 4. Order List */}
            <OrderList orders={filteredOrders} />
          </div>
        </div>
      </main>
    </div>
  );
}
