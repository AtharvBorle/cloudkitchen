"use client";

import React, { useState, useEffect, useMemo } from "react";
import ResponsiveSellerDashboard, {
  ResponsiveDashboardMetrics,
  ResponsiveOrderSummary,
} from "@/components/seller/seller-dashboard/responsive/ResponsiveSellerDashboard";
import { fetchApi } from "@/lib/fetch-api";
import { useRealtimeStream } from "@/hooks/useRealtimeStream";
import { playNewOrderChime } from "@/lib/audio-chime";

export default function ResponsiveSellerDashboardPage() {
  const [overviewData, setOverviewData] = useState<any | null>(null);
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      const [overviewRes, ordersRes] = await Promise.allSettled([
        fetchApi("/api/seller/dashboard/overview"),
        fetchApi("/api/seller/orders"),
      ]);

      if (overviewRes.status === "fulfilled" && overviewRes.value.ok) {
        const res = await overviewRes.value.json();
        const d = res.data || res;
        setOverviewData(d);
      }

      if (ordersRes.status === "fulfilled" && ordersRes.value.ok) {
        const res = await ordersRes.value.json();
        const d = res.data?.orders || res.orders || res.data || [];
        if (Array.isArray(d)) setOrdersList(d);
      }
    } catch (err) {
      console.error("Failed to load seller dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // Real-time SSE stream replaces 4s polling
  useRealtimeStream({
    url: "/api/seller/orders/stream",
    onConnected: () => {
      loadDashboard();
    },
    onOrder: (payload) => {
      if (payload.event === "ORDER_CREATED") {
        playNewOrderChime();
      }
      loadDashboard();
    },
  });

  const dynamicMetrics: ResponsiveDashboardMetrics | undefined = useMemo(() => {
    if (!overviewData) return undefined;
    return {
      todayRevenue: `₹${(overviewData.totalRevenue || 0).toLocaleString("en-IN")}`,
      ordersToday: overviewData.todayOrdersCount ?? 0,
      pendingBookings: overviewData.roomsCount ?? 0,
      codOutstanding: "₹0",
    };
  }, [overviewData]);

  const dynamicRecentOrders: ResponsiveOrderSummary[] | undefined = useMemo(() => {
    if (!ordersList || ordersList.length === 0) return undefined;
    return ordersList.slice(0, 5).map((o: any) => {
      let statusText: "New" | "Preparing" | "Delivered" | "Cancelled" | string = "New";
      const s = (o.status || "").toUpperCase();
      if (s === "PREPARING") statusText = "Preparing";
      else if (s === "DELIVERED") statusText = "Delivered";
      else if (s === "CANCELLED") statusText = "Cancelled";
      else statusText = "New";

      const timeAgoStr = o.createdAt
        ? new Date(o.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
        : "Recent";

      return {
        id: o.id,
        orderNumber: `#${o.id.slice(0, 6).toUpperCase()}`,
        customerName: o.user?.name || "Customer",
        amount: `₹${o.totalAmount || 0}`,
        timeAgo: timeAgoStr,
        status: statusText,
        href: `/seller/orders/details?orderId=${encodeURIComponent(o.id)}`,
      };
    });
  }, [ordersList]);

  const ownerDisplayName = overviewData?.sellerProfile?.businessName || overviewData?.sellerProfile?.user?.name || "Rahul";

  return (
    <ResponsiveSellerDashboard
      ownerName={ownerDisplayName}
      greetingSubtitle="Here is your business summary today"
      metrics={dynamicMetrics}
      recentOrders={dynamicRecentOrders}
    />
  );
}

