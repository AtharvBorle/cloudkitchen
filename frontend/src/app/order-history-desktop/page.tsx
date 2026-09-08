"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { SettingsSidebar } from "@/components/settings-desktop/settings-sidebar";
import { OrderHistoryHeader } from "@/components/order-history-desktop/order-history-header";
import { OrderFilters, OrderFilterTab } from "@/components/order-history-desktop/order-filters";
import { OrderList, OrderItemData, SAMPLE_ORDERS } from "@/components/order-history-desktop/order-list";
import { fetchApi } from "@/lib/fetch-api";

export default function OrderHistoryDesktopPage() {
  const [activeTab, setActiveTab] = useState<OrderFilterTab>("all");
  const [liveOrders, setLiveOrders] = useState<OrderItemData[] | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      try {
        const res = await fetchApi("/api/user/orders");
        if (res.ok) {
          const data = await res.json();
          const list = data.data || data || [];
          if (Array.isArray(list) && list.length > 0 && isMounted) {
            const mapped: OrderItemData[] = list.map((o: any) => {
              let itemsDesc = "";
              try {
                const parsed = typeof o.items === "string" ? JSON.parse(o.items) : o.items;
                if (Array.isArray(parsed)) {
                  itemsDesc = parsed.map((i: any) => `${i.quantity || 1}x ${i.name}`).join(", ");
                }
              } catch (e) {
                itemsDesc = "Order Items";
              }

              const dateStr = o.createdAt
                ? new Date(o.createdAt).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Recent";

              let statusVal: "DELIVERED" | "CANCELLED" | "IN_PROGRESS" = "IN_PROGRESS";
              const s = (o.status || "").toUpperCase();
              if (s === "DELIVERED") statusVal = "DELIVERED";
              else if (s === "CANCELLED") statusVal = "CANCELLED";

              return {
                id: o.id,
                restaurantName: o.seller?.businessName || "Neo Cloud Kitchen",
                orderNumber: `Order #${o.id.slice(0, 8).toUpperCase()}`,
                orderDate: dateStr,
                status: statusVal,
                itemsOrdered: itemsDesc || "Delicious Meals",
                totalAmount: o.totalAmount || 0,
                deliveryAddress: o.deliveryAddress ? `Delivered to ${o.deliveryAddress}` : "Pickup",
                hasViewDetails: true,
              };
            });
            setLiveOrders(mapped);
          }
        }
      } catch (err) {
        console.error("Failed to load live orders for history:", err);
      }
    }

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  const ordersToFilter = liveOrders && liveOrders.length > 0 ? liveOrders : SAMPLE_ORDERS;

  const filteredOrders = useMemo(() => {
    return ordersToFilter.filter((order) => {
      if (activeTab === "delivered") return order.status === "DELIVERED";
      if (activeTab === "cancelled") return order.status === "CANCELLED";
      return true;
    });
  }, [ordersToFilter, activeTab]);

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

