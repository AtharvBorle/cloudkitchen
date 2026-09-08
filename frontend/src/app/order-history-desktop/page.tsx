"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/navbar";
import { SettingsSidebar } from "@/components/settings-desktop/settings-sidebar";
import { OrderHistoryHeader } from "@/components/order-history-desktop/order-history-header";
import { OrderFilters, OrderFilterTab } from "@/components/order-history-desktop/order-filters";
import { OrderList, SAMPLE_ORDERS } from "@/components/order-history-desktop/order-list";

export default function OrderHistoryDesktopPage() {
  const [activeTab, setActiveTab] = useState<OrderFilterTab>("all");

  const filteredOrders = SAMPLE_ORDERS.filter((order) => {
    if (activeTab === "delivered") return order.status === "DELIVERED";
    if (activeTab === "cancelled") return order.status === "CANCELLED";
    return true;
  });

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFF4E6", display: "flex", flexDirection: "column" }}>
      {/* 1. Shared Desktop Navbar with Settings Active */}
      <Navbar
        navItems={["Home", "Explore", "Orders", "Rooms", "Settings"]}
        initialActiveItem="Settings"
      />

      <main style={{ maxWidth: "1400px", width: "100%", margin: "0 auto", padding: "32px 32px 64px 32px", boxSizing: "border-box", flex: 1 }}>
        <div style={{ display: "flex", gap: "32px", alignItems: "flex-start" }}>
          {/* Left Column: Shared Profile Sidebar with Order History Active */}
          <SettingsSidebar activeTabId="order-history" />

          {/* Right Column: Order History Content Sections */}
          <div style={{ flex: 1, minWidth: 0 }}>
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
