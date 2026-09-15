"use client";

import React, { Suspense } from "react";
import { Navbar } from "@/components/navbar";
import { MyOrdersView } from "@/components/orders-desktop/my-orders";
import { Footer } from "@/components/explore-desktop/footer";

export default function OrdersDesktopPage() {
  return (
    <div style={{ width: "100%", minHeight: "100vh", backgroundColor: "#FDF8F4", overflowX: "hidden" }}>
      {/* 1. Shared Desktop Navbar Component */}
      <Navbar />

      {/* 2. My Orders View (2-Column Layout matching design mockup) */}
      <main>
        <Suspense fallback={<div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading orders...</div>}>
          <MyOrdersView />
        </Suspense>
      </main>

      {/* Global Responsive Footer */}
      <Footer />
    </div>
  );
}


