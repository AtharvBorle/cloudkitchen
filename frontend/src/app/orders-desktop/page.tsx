"use client";

import React, { Suspense } from "react";
import { Navbar } from "@/components/navbar";
import { MyOrdersView } from "@/components/orders-desktop/my-orders";

export default function OrdersDesktopPage() {
  return (
    <div style={{ width: "100%", minHeight: "100vh", backgroundColor: "#FDF8F4", overflowX: "hidden" }}>
      {/* 1. Shared Desktop Navbar Component with active Orders tab */}
      <Navbar
        navItems={["Home", "Explore", "Orders", "Rooms", "Settings"]}
        initialActiveItem="Orders"
        hideVegToggle={true}
      />

      {/* 2. My Orders View (2-Column Layout matching design mockup) */}
      <main>
        <Suspense fallback={<div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading orders...</div>}>
          <MyOrdersView />
        </Suspense>
      </main>
    </div>
  );
}


