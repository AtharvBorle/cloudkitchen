"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { SettingsSidebar } from "@/components/settings-desktop/settings-sidebar";
import { OrderHistoryHeader } from "@/components/order-history-desktop/order-history-header";
import { OrderFilters, OrderFilterTab } from "@/components/order-history-desktop/order-filters";
import { OrderList, OrderItemData } from "@/components/order-history-desktop/order-list";
import { fetchApi } from "@/lib/fetch-api";
import { useRealtimeStream } from "@/hooks/useRealtimeStream";
import { Footer } from "@/components/explore-desktop/footer";
import { RotateCcw, Filter } from "lucide-react";

import styles from "./OrderHistoryPage.module.css";

import { useRouter } from "next/navigation";

// Preset fallback orders spanning Today, Yesterday, This Week, Last 7 Days, This Month, and Older
function generateSampleOrderHistory(): any[] {
  const nowMs = Date.now();
  return [
    {
      id: "ord-hist-101",
      createdAt: new Date(nowMs - 2 * 3600 * 1000).toISOString(), // Today (2 hours ago)
      status: "DELIVERED",
      totalAmount: 480,
      deliveryAddress: "Flat 402, Sai Residency, Kothrud, Pune",
      seller: { businessName: "Sai's Kitchen & Gourmet Treats" },
      items: JSON.stringify([
        { name: "Gourmet Paneer Butter Masala", quantity: 1, price: 290 },
        { name: "Butter Garlic Naan", quantity: 2, price: 95 },
      ]),
    },
    {
      id: "ord-hist-102",
      createdAt: new Date(nowMs - 5 * 3600 * 1000).toISOString(), // Today (5 hours ago)
      status: "DELIVERED",
      totalAmount: 560,
      deliveryAddress: "Flat 402, Sai Residency, Kothrud, Pune",
      seller: { businessName: "Italian Woodfired Oven" },
      items: JSON.stringify([
        { name: "Farmhouse Supreme Pizza", quantity: 1, price: 420 },
        { name: "Cheesy Garlic Bread", quantity: 1, price: 140 },
      ]),
    },
    {
      id: "ord-hist-103",
      createdAt: new Date(nowMs - 26 * 3600 * 1000).toISOString(), // Yesterday (26 hours ago)
      status: "DELIVERED",
      totalAmount: 390,
      deliveryAddress: "Office 3B, Tech Park, Shivajinagar, Pune",
      seller: { businessName: "Royal Dum Biryani House" },
      items: JSON.stringify([
        { name: "Hyderabadi Veg Dum Biryani", quantity: 1, price: 310 },
        { name: "Mirchi Ka Salan & Raita", quantity: 1, price: 80 },
      ]),
    },
    {
      id: "ord-hist-104",
      createdAt: new Date(nowMs - 3 * 24 * 3600 * 1000).toISOString(), // 3 days ago (This Week / Last 7 Days)
      status: "DELIVERED",
      totalAmount: 420,
      deliveryAddress: "Flat 402, Sai Residency, Kothrud, Pune",
      seller: { businessName: "Mexican Cantina & Bowls" },
      items: JSON.stringify([
        { name: "Grilled Veggie Burrito Bowl", quantity: 1, price: 320 },
        { name: "Crispy Nachos with Salsa", quantity: 1, price: 100 },
      ]),
    },
    {
      id: "ord-hist-105",
      createdAt: new Date(nowMs - 5 * 24 * 3600 * 1000).toISOString(), // 5 days ago (Last 7 Days)
      status: "CANCELLED",
      totalAmount: 310,
      deliveryAddress: "Flat 402, Sai Residency, Kothrud, Pune",
      seller: { businessName: "Pizzeria Romana" },
      items: JSON.stringify([
        { name: "Double Cheese Margherita", quantity: 1, price: 310 },
      ]),
    },
    {
      id: "ord-hist-106",
      createdAt: new Date(nowMs - 12 * 24 * 3600 * 1000).toISOString(), // 12 days ago (This Month / Last 30 Days)
      status: "DELIVERED",
      totalAmount: 350,
      deliveryAddress: "Flat 402, Sai Residency, Kothrud, Pune",
      seller: { businessName: "Punjab Grill Express" },
      items: JSON.stringify([
        { name: "Dal Makhani Deluxe Thali", quantity: 1, price: 350 },
      ]),
    },
    {
      id: "ord-hist-107",
      createdAt: new Date(nowMs - 22 * 24 * 3600 * 1000).toISOString(), // 22 days ago (This Month / Last 30 Days)
      status: "DELIVERED",
      totalAmount: 280,
      deliveryAddress: "Flat 402, Sai Residency, Kothrud, Pune",
      seller: { businessName: "Sweet Cravings Bakery" },
      items: JSON.stringify([
        { name: "Belgian Chocolate Waffle", quantity: 1, price: 190 },
        { name: "Iced Caramel Macchiato", quantity: 1, price: 90 },
      ]),
    },
    {
      id: "ord-hist-108",
      createdAt: new Date(nowMs - 45 * 24 * 3600 * 1000).toISOString(), // 45 days ago (Last 3 Months / This Year)
      status: "DELIVERED",
      totalAmount: 260,
      deliveryAddress: "Flat 402, Sai Residency, Kothrud, Pune",
      seller: { businessName: "Kathi & Roll Junction" },
      items: JSON.stringify([
        { name: "Paneer Tikka Kathi Roll", quantity: 2, price: 260 },
      ]),
    },
    {
      id: "ord-hist-109",
      createdAt: new Date(nowMs - 75 * 24 * 3600 * 1000).toISOString(), // 75 days ago (Last 3 Months / This Year)
      status: "DELIVERED",
      totalAmount: 450,
      deliveryAddress: "Flat 402, Sai Residency, Kothrud, Pune",
      seller: { businessName: "Pasta Fresca Bistro" },
      items: JSON.stringify([
        { name: "Creamy Alfredo Penne Pasta", quantity: 1, price: 360 },
        { name: "Herb Garlic Bread", quantity: 1, price: 90 },
      ]),
    },
  ];
}

export default function OrderHistoryDesktopPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<OrderFilterTab>("all");
  const [selectedDateRange, setSelectedDateRange] = useState<string>("All Time");
  const [liveOrders, setLiveOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async (initial = false) => {
    if (initial) setLoading(true);
    try {
      const res = await fetchApi("/api/user/orders");
      if (res.ok) {
        const data = await res.json();
        const list = data.data || data || [];
        if (Array.isArray(list)) {
          setLiveOrders(list);
        }
      }
    } catch (err) {
      console.error("Failed to load live orders for history:", err);
    } finally {
      if (initial) setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(true);
  }, []);

  // Real-time SSE stream replaces auto-polling
  useRealtimeStream({
    url: "/api/user/orders/stream",
    onOrder: () => {
      loadOrders(false);
    },
  });

  const formattedOrders: (OrderItemData & { rawDate?: Date })[] = useMemo(() => {
    const rawList = liveOrders.length > 0 ? liveOrders : generateSampleOrderHistory();

    return rawList.map((o: any) => {
      let itemsDesc = "";
      try {
        const parsed = typeof o.items === "string" ? JSON.parse(o.items) : o.items;
        if (Array.isArray(parsed)) {
          itemsDesc = parsed.map((i: any) => `${i.quantity || 1}x ${i.name}`).join(", ");
        }
      } catch (e) {
        itemsDesc = "Order Items";
      }

      const dateField = o.createdAt || o.orderDate || o.date || o.created_at || o.updatedAt;
      const rawDate = dateField ? new Date(dateField) : new Date();
      const validDate = isNaN(rawDate.getTime()) ? new Date() : rawDate;

      const dateStr = validDate.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      let statusVal: "DELIVERED" | "CANCELLED" | "IN_PROGRESS" = "IN_PROGRESS";
      const s = (o.status || "").toUpperCase();
      if (s === "DELIVERED") statusVal = "DELIVERED";
      else if (s === "CANCELLED" || s === "REJECTED") statusVal = "CANCELLED";

      return {
        id: o.id || `ORD-${Math.random()}`,
        restaurantName: o.seller?.businessName || o.restaurantName || "Neo Cloud Kitchen",
        orderNumber: `Order #${(o.id || "").slice(0, 8).toUpperCase()}`,
        orderDate: dateStr,
        rawDate: validDate,
        status: statusVal,
        itemsOrdered: itemsDesc || "Delicious Meals",
        totalAmount: o.totalAmount || 0,
        deliveryAddress: o.deliveryAddress ? `Delivered to ${o.deliveryAddress.split(" | Loc:")[0]}` : "Pickup",
        hasViewDetails: true,
      };
    });
  }, [liveOrders]);

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0).getTime();
    const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999).getTime();

    // Start of calendar week (Sunday)
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay(), 0, 0, 0, 0).getTime();

    // Start of calendar month (1st of this month)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).getTime();

    // Start of calendar year (Jan 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0).getTime();

    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
    const ninetyDaysAgo = now.getTime() - 90 * 24 * 60 * 60 * 1000;

    const rangeKey = (selectedDateRange || "All Time").trim().toLowerCase();

    return formattedOrders.filter((order) => {
      // 1. Status Filter
      if (activeTab === "delivered" && order.status !== "DELIVERED") return false;
      if (activeTab === "cancelled" && order.status !== "CANCELLED") return false;

      // 2. Date Range Filter
      if (rangeKey === "all time" || rangeKey === "all") {
        return true;
      }

      if (!order.rawDate || isNaN(order.rawDate.getTime())) {
        return true;
      }

      const orderTime = order.rawDate.getTime();

      // Today / Day wise
      if (rangeKey === "today" || rangeKey.includes("day wise") || rangeKey === "daily") {
        return orderTime >= startOfToday && orderTime <= endOfToday;
      }

      // Yesterday
      if (rangeKey === "yesterday") {
        return orderTime >= startOfYesterday && orderTime <= endOfYesterday;
      }

      // This Week / Week wise (Current calendar week)
      if (rangeKey === "this week" || rangeKey.includes("week wise") || rangeKey === "weekly") {
        return orderTime >= startOfWeek && orderTime <= endOfToday;
      }

      // Last 7 Days
      if (rangeKey === "last 7 days") {
        return orderTime >= sevenDaysAgo && orderTime <= now.getTime() + 60000;
      }

      // This Month / Month wise (Current calendar month)
      if (rangeKey === "this month" || rangeKey.includes("month wise") || rangeKey === "monthly") {
        return orderTime >= startOfMonth && orderTime <= endOfToday;
      }

      // Last 30 Days
      if (rangeKey === "last 30 days") {
        return orderTime >= thirtyDaysAgo && orderTime <= now.getTime() + 60000;
      }

      // Last 3 Months
      if (rangeKey === "last 3 months") {
        return orderTime >= ninetyDaysAgo && orderTime <= now.getTime() + 60000;
      }

      // This Year / Year wise
      if (rangeKey === "this year" || rangeKey.includes("year wise") || rangeKey === "yearly") {
        return orderTime >= startOfYear && orderTime <= endOfToday;
      }

      return true;
    });
  }, [formattedOrders, activeTab, selectedDateRange]);

  const isFilterActive = selectedDateRange !== "All Time" || activeTab !== "all";

  const handleViewDetails = (orderId: string) => {
    router.push(`/order-confirmation?orderId=${orderId}`);
  };

  const handleReorderMeal = (orderId: string) => {
    router.push("/explore-desktop");
  };

  return (
    <div className={styles.pageWrapper}>
      <Navbar initialActiveItem="Settings" />

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
              dateRangeText={selectedDateRange}
              onDateRangeChange={(range) => setSelectedDateRange(range)}
            />

            {/* Active Filter Feedback Banner */}
            {isFilterActive && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "#FFF7ED",
                  border: "1px solid #FED7AA",
                  borderRadius: "12px",
                  padding: "10px 16px",
                  marginBottom: "20px",
                  fontSize: "13px",
                  color: "#9A3412",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Filter size={15} color="#EA580C" />
                  <span>
                    Showing <strong>{filteredOrders.length}</strong> {activeTab !== "all" ? `${activeTab} ` : ""}orders
                    {selectedDateRange !== "All Time" ? ` for "${selectedDateRange}"` : ""}.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedDateRange("All Time");
                    setActiveTab("all");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#EA580C",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "4px 8px",
                    borderRadius: "6px",
                  }}
                >
                  <RotateCcw size={13} /> Reset Filter
                </button>
              </div>
            )}

            {/* 4. Order List */}
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#64748B" }}>
                Loading your order history...
              </div>
            ) : (
              <OrderList
                orders={filteredOrders}
                onViewDetails={handleViewDetails}
                onReorderMeal={handleReorderMeal}
              />
            )}
          </div>
        </div>
      </main>

      {/* Global Responsive Footer */}
      <Footer />
    </div>
  );
}

