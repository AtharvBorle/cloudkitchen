"use client";

import React, { useState, useEffect, useMemo } from "react";
import ResponsiveSellerOrders, {
  ResponsiveOrderItem,
} from "@/components/seller/seller-orders/responsive/ResponsiveSellerOrders";
import { fetchApi } from "@/lib/fetch-api";

export default function ResponsiveSellerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    try {
      const res = await fetchApi("/api/seller/orders");
      if (res.ok) {
        const data = await res.json();
        const list = data.data?.orders || data.orders || data.data || [];
        if (Array.isArray(list)) {
          setOrders(list);
        }
      }
    } catch (err) {
      console.error("Failed to load seller orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await fetchApi(`/api/seller/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PREPARING" }),
      });
      loadOrders();
    } catch (err) {
      console.error("Failed to accept order:", err);
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    try {
      await fetchApi(`/api/seller/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      loadOrders();
    } catch (err) {
      console.error("Failed to reject order:", err);
    }
  };

  const mappedOrders: ResponsiveOrderItem[] | undefined = useMemo(() => {
    if (!orders || orders.length === 0) return undefined;
    return orders.map((o: any) => {
      let itemsSummary = "";
      let itemCount = 1;
      try {
        const parsed = typeof o.items === "string" ? JSON.parse(o.items) : o.items;
        if (Array.isArray(parsed)) {
          itemCount = parsed.length;
          itemsSummary = parsed.map((i: any) => `${i.quantity || 1}x ${i.name}`).join(", ");
        }
      } catch (e) {
        itemsSummary = "Kitchen Items";
      }

      let statusVal: "New" | "Preparing" | "Out" | "Done" | "Cancelled" = "New";
      const s = (o.status || "").toUpperCase();
      if (s === "PREPARING") statusVal = "Preparing";
      else if (s === "OUT_FOR_DELIVERY" || s === "ON_THE_WAY") statusVal = "Out";
      else if (s === "DELIVERED" || s === "COMPLETED") statusVal = "Done";
      else if (s === "CANCELLED") statusVal = "Cancelled";
      else statusVal = "New";

      const timeAgoStr = o.createdAt
        ? new Date(o.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
        : "Just now";

      return {
        id: o.id,
        orderNumber: `#${o.id.slice(0, 6).toUpperCase()}`,
        timeAgo: timeAgoStr,
        customerName: o.user?.name || "Customer",
        itemsText: `${itemCount} items • ₹${o.totalAmount || 0}`,
        priorOrdersCount: 5,
        totalAmount: `₹${o.totalAmount || 0}`,
        rating: 4.8,
        deliveredCount: 42,
        cancelledCount: 1,
        status: statusVal,
      };
    });
  }, [orders]);

  return (
    <ResponsiveSellerOrders
      orders={mappedOrders}
      onAccept={handleAcceptOrder}
      onReject={handleRejectOrder}
    />
  );
}

