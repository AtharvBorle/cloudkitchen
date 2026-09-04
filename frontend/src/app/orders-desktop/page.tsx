"use client";

import React from "react";
import { Navbar } from "@/components/navbar";
import { OrdersHeader } from "@/components/orders-desktop/orders-header";
import { ActiveOrders } from "@/components/orders-desktop/active-orders";
import { PastOrders } from "@/components/orders-desktop/past-orders";

export default function OrdersDesktopPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFF4E6", display: "flex", flexDirection: "column" }}>
      {/* 1. Shared Desktop Navbar Component */}
      <Navbar
        navItems={["Home", "Explore", "Orders", "Rooms", "Settings"]}
        initialActiveItem="Orders"
      />

      <main style={{ maxWidth: "1400px", width: "100%", margin: "0 auto", padding: "32px 32px 64px 32px", boxSizing: "border-box", flex: 1 }}>
        {/* 2. My Orders Header & Category Filters */}
        <OrdersHeader />

        {/* 3. Active Orders Section (Food Live Tracking & Room Subscriptions) */}
        <ActiveOrders />

        {/* 4. Past Orders Section */}
        <PastOrders />
      </main>
    </div>
  );
}
