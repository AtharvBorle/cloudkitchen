"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { SettingsSidebar } from "@/components/settings-desktop/settings-sidebar";
import { OrderHistoryHeader } from "@/components/order-history-desktop/order-history-header";
import { OrderFilters, OrderFilterTab } from "@/components/order-history-desktop/order-filters";
import { OrderList, OrderItemData, SAMPLE_ORDERS } from "@/components/order-history-desktop/order-list";
import { fetchApi } from "@/lib/fetch-api";
import { Footer } from "@/components/explore-desktop/footer";

import styles from "./OrderHistoryPage.module.css";

import { useRouter } from "next/navigation";

export default function OrderHistoryDesktopPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<OrderFilterTab>("all");
  const [selectedDateRange, setSelectedDateRange] = useState<string>("All Time");
  const [liveOrders, setLiveOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadOrders(initial = false) {
      if (initial) setLoading(true);
      try {
        const res = await fetchApi("/api/user/orders");
        if (res.ok) {
          const data = await res.json();
          const list = data.data || data || [];
          if (Array.isArray(list) && isMounted) {
            setLiveOrders(list);
          }
        }
      } catch (err) {
        console.error("Failed to load live orders for history:", err);
      } finally {
        if (initial && isMounted) setLoading(false);
      }
    }

    loadOrders(true);

    const interval = setInterval(() => {
      loadOrders(false);
    }, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const formattedOrders: (OrderItemData & { rawDate?: Date })[] = useMemo(() => {
    return liveOrders.map((o: any) => {
      let itemsDesc = "";
      try {
        const parsed = typeof o.items === "string" ? JSON.parse(o.items) : o.items;
        if (Array.isArray(parsed)) {
          itemsDesc = parsed.map((i: any) => `${i.quantity || 1}x ${i.name}`).join(", ");
        }
      } catch (e) {
        itemsDesc = "Order Items";
      }

      const rawDate = o.createdAt ? new Date(o.createdAt) : new Date();
      const dateStr = rawDate.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      let statusVal: "DELIVERED" | "CANCELLED" | "IN_PROGRESS" = "IN_PROGRESS";
      const s = (o.status || "").toUpperCase();
      if (s === "DELIVERED") statusVal = "DELIVERED";
      else if (s === "CANCELLED") statusVal = "CANCELLED";

      return {
        id: o.id,
        restaurantName: o.seller?.businessName || "Neo Cloud Kitchen",
        orderNumber: `Order #${o.id.slice(0, 8).toUpperCase()}`,
        orderDate: dateStr,
        rawDate,
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
    return formattedOrders.filter((order) => {
      // 1. Status Filter
      if (activeTab === "delivered" && order.status !== "DELIVERED") return false;
      if (activeTab === "cancelled" && order.status !== "CANCELLED") return false;

      // 2. Date Range Filter
      if (order.rawDate && selectedDateRange !== "All Time") {
        const orderTime = order.rawDate.getTime();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
        const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0).getTime();
        const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999).getTime();
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay(), 0, 0, 0, 0).getTime();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).getTime();

        if (selectedDateRange === "Today") {
          if (orderTime < startOfToday || orderTime > endOfToday) return false;
        } else if (selectedDateRange === "Yesterday") {
          if (orderTime < startOfYesterday || orderTime > endOfYesterday) return false;
        } else if (selectedDateRange === "This Week") {
          if (orderTime < startOfWeek) return false;
        } else if (selectedDateRange === "This Month") {
          if (orderTime < startOfMonth) return false;
        } else if (selectedDateRange === "Last 7 Days") {
          const sevenDaysAgo = startOfToday - 7 * 24 * 60 * 60 * 1000;
          if (orderTime < sevenDaysAgo) return false;
        } else if (selectedDateRange === "Last 30 Days") {
          const thirtyDaysAgo = startOfToday - 30 * 24 * 60 * 60 * 1000;
          if (orderTime < thirtyDaysAgo) return false;
        } else if (selectedDateRange === "Last 3 Months") {
          const threeMonthsAgo = startOfToday - 90 * 24 * 60 * 60 * 1000;
          if (orderTime < threeMonthsAgo) return false;
        } else if (selectedDateRange === "This Year") {
          const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0).getTime();
          if (orderTime < startOfYear) return false;
        }
      }

      return true;
    });
  }, [formattedOrders, activeTab, selectedDateRange]);

  const handleViewDetails = (orderId: string) => {
    router.push(`/order-confirmation?orderId=${orderId}`);
  };

  const handleReorderMeal = (orderId: string) => {
    router.push("/food");
  };

  return (
    <div className={styles.pageWrapper}>
      {/* 1. Shared Desktop Navbar with Settings Active */}
      <div className={styles.desktopNavbar}>
        <Navbar
          navItems={["Home", "Explore", "Orders", "Rooms", "Settings"]}
          initialActiveItem="Settings"
          hideSearch={true}
          hideVegToggle={true}
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
              dateRangeText={selectedDateRange}
              onDateRangeChange={(range) => setSelectedDateRange(range)}
            />

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

