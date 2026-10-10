"use client";

import React, { useState, useEffect, useMemo } from "react";
import ResponsiveSellerDashboard, {
  ResponsiveDashboardMetrics,
  ResponsiveOrderSummary,
} from "@/components/seller/seller-dashboard/responsive/ResponsiveSellerDashboard";
import { SellerCalendarModal, formatDateToYMD } from "@/components/seller/seller-dashboard/SellerCalendarModal";
import { fetchApi } from "@/lib/fetch-api";
import { useRealtimeStream } from "@/hooks/useRealtimeStream";
import { addSellerNotification } from "@/hooks/useSellerNotifications";
import { playNewOrderChime } from "@/lib/audio-chime";
import { formatOrderDeliveryAddress } from "@/components/seller/seller-orders/SellerOrders";

export default function ResponsiveSellerDashboardPage() {
  const [overviewData, setOverviewData] = useState<any | null>(null);
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const todayYMD = useMemo(() => formatDateToYMD(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayYMD);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const isViewingToday = selectedDate === todayYMD;

  const loadDashboard = async (customDate?: string) => {
    try {
      const activeDate = customDate !== undefined ? customDate : selectedDate;
      const overviewUrl = activeDate
        ? `/api/seller/dashboard/overview?date=${encodeURIComponent(activeDate)}`
        : "/api/seller/dashboard/overview";

      const [overviewRes, ordersRes] = await Promise.allSettled([
        fetchApi(overviewUrl),
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
        if (Array.isArray(d)) {
          setOrdersList(d);
          d.forEach((o: any) => {
            const s = (o.status || "").toUpperCase();
            if (s === "PENDING" || s === "PREPARING") {
              let itemsText = "";
              try {
                const parsed = typeof o.items === "string" ? JSON.parse(o.items) : o.items;
                if (Array.isArray(parsed)) {
                  itemsText = parsed.map((i: any) => `${i.quantity || 1}x ${i.name}`).join(", ");
                }
              } catch {
                itemsText = "Kitchen Items";
              }
              const customerPhone = o.customerPhone || o.user?.phone || "";
              const cleanedAddr = formatOrderDeliveryAddress(o.deliveryAddress, o.room?.title);
              const address = cleanedAddr !== "N/A" ? cleanedAddr : "";
              addSellerNotification({
                id: `notif-order-${o.id}`,
                category: "orders",
                settingKey: "orderAlerts",
                title: `New Incoming Order #${o.id.slice(0, 8)}`,
                message: `${itemsText || "1x Food Item"}. Total: ₹${o.totalAmount || 0}.`,
                details: `Customer: ${o.user?.name || "Customer"}${customerPhone ? ` • Phone: ${customerPhone}` : ""}${address ? ` • Address: ${address}` : ""}`,
                severity: "success",
                actionLabel: "View Order",
                actionHref: `/seller/orders/details?orderId=${encodeURIComponent(o.id)}&from=dashboard`,
              });
            }
          });
        }
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
        if (payload.order) {
          const o = payload.order;
          let itemsText = "";
          try {
            const parsed = typeof o.items === "string" ? JSON.parse(o.items) : o.items;
            if (Array.isArray(parsed)) {
              itemsText = parsed.map((i: any) => `${i.quantity || 1}x ${i.name}`).join(", ");
            }
          } catch {
            itemsText = "Kitchen Items";
          }
          const orderId = o.id || payload.orderId || `ORD-${Date.now().toString().slice(-4)}`;
          const customerPhone = o.customerPhone || o.user?.phone || "";
          const cleanedAddr = formatOrderDeliveryAddress(o.deliveryAddress, o.room?.title);
          const address = cleanedAddr !== "N/A" ? cleanedAddr : "";
          addSellerNotification({
            id: `notif-order-${orderId}`,
            category: "orders",
            settingKey: "orderAlerts",
            title: `New Incoming Order #${orderId.slice(0, 8)}`,
            message: `${itemsText || "1x Food Item"}. Total: ₹${o.totalAmount || 0}.`,
            details: `Customer: ${o.user?.name || "Customer"}${customerPhone ? ` • Phone: ${customerPhone}` : ""}${address ? ` • Address: ${address}` : ""}`,
            severity: "success",
            actionLabel: "View Order",
            actionHref: `/seller/orders/details?orderId=${encodeURIComponent(orderId)}&from=dashboard`,
          });
        }
      }
      loadDashboard();
    },
  });

  const dynamicMetrics: ResponsiveDashboardMetrics | undefined = useMemo(() => {
    if (!overviewData) return undefined;
    const revenueVal = overviewData.todayRevenue !== undefined ? overviewData.todayRevenue : overviewData.totalRevenue || 0;
    const codVal = (overviewData.codOutstanding !== undefined ? overviewData.codOutstanding : overviewData.riderTotalCodOutstanding) || 0;
    return {
      todayRevenue: `₹${revenueVal.toLocaleString("en-IN")}`,
      ordersToday: overviewData.todayOrdersCount ?? 0,
      pendingBookings: overviewData.roomsCount ?? 0,
      codOutstanding: `₹${codVal.toLocaleString("en-IN")}`,
    };
  }, [overviewData]);

  const dateFilteredOrders = useMemo(() => {
    if (isViewingToday) return ordersList;
    return ordersList.filter((o: any) => {
      if (!o.createdAt) return false;
      return formatDateToYMD(new Date(o.createdAt)) === selectedDate;
    });
  }, [ordersList, selectedDate, isViewingToday]);

  const dynamicRecentOrders: ResponsiveOrderSummary[] = useMemo(() => {
    if (!dateFilteredOrders || dateFilteredOrders.length === 0) {
      return [];
    }
    return dateFilteredOrders.map((o: any) => {
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
        customerName: o.user?.name || o.customerName || "Customer",
        amount: `₹${o.totalAmount || 0}`,
        timeAgo: timeAgoStr,
        status: statusText,
        href: `/seller/orders/details?orderId=${encodeURIComponent(o.id)}&from=dashboard`,
      };
    });
  }, [dateFilteredOrders]);

  const ownerDisplayName = overviewData?.sellerProfile?.businessName || overviewData?.sellerProfile?.user?.name || "Rahul";

  return (
    <>
      <ResponsiveSellerDashboard
        ownerName={ownerDisplayName}
        greetingSubtitle="Here is your business summary today"
        metrics={dynamicMetrics}
        recentOrders={dynamicRecentOrders}
        selectedDate={selectedDate}
        onOpenCalendar={() => setIsCalendarOpen(true)}
        onResetToday={() => {
          setSelectedDate(todayYMD);
          loadDashboard(todayYMD);
        }}
      />

      <SellerCalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        selectedDate={selectedDate}
        onSelectDate={(newDate) => {
          setSelectedDate(newDate);
          loadDashboard(newDate);
        }}
      />
    </>
  );
}

