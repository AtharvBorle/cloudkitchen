"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ResponsiveSellerOrdersDetails from "@/components/seller/seller-orders/responsive/ResponsiveSellerOrdersDetails";
import { fetchApi } from "@/lib/fetch-api";

function DetailsContent() {
  const searchParams = useSearchParams();
  const rawId = searchParams.get("orderId") || "#1234";
  const cleanId = rawId.replace("#", "");

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await fetchApi<{ orders: any[] }>("/api/seller/orders");
        if (res.data?.orders) {
          const found = res.data.orders.find(
            (o) => o.id === cleanId || o.id === rawId || `#${o.id.slice(0, 6)}` === rawId
          );
          if (found) {
            setOrder(found);
          }
        }
      } catch (err) {
        console.error("Failed to load seller order details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [cleanId, rawId]);

  let parsedItems: any[] = [];
  if (order?.items) {
    try {
      parsedItems = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
    } catch {
      parsedItems = [];
    }
  }

  const formattedItems = parsedItems.length > 0
    ? parsedItems.map((it: any, idx: number) => ({
        id: it.id || String(idx),
        name: it.name || "Food Item",
        qty: it.quantity || it.qty || 1,
        price: `₹${it.price || 0}`,
      }))
    : undefined;

  const mapStatusToStep = (st: string) => {
    switch (st) {
      case "OUT_FOR_DELIVERY":
        return "On the way" as const;
      case "DELIVERED":
        return "Delivered" as const;
      case "PREPARING":
        return "Preparing" as const;
      default:
        return "Order Placed" as const;
    }
  };

  return (
    <ResponsiveSellerOrdersDetails
      orderId={order ? `#${order.id.slice(0, 6)}` : rawId}
      customerName={order?.user?.name || (order ? "Customer" : "Priya Mehta")}
      customerPhone={order?.customerPhone || order?.user?.phone || "+91 98765 43210"}
      deliveryAddress={
        order?.deliveryAddress ||
        "Flat 402, Building 5A, Horizon Heights, Powai, Mumbai - 400076"
      }
      riderName={order?.deliveryPerson?.name || "Rahul Kumar"}
      riderInitials={
        order?.deliveryPerson?.name
          ? order.deliveryPerson.name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
          : "RK"
      }
      riderPhone={order?.deliveryPerson?.phone || "+919876500101"}
      riderEta="Live ETA: ~12 min"
      items={formattedItems}
      total={order ? `₹${order.totalAmount}` : "₹850"}
      paymentMethod={order?.paymentMethod || "COD"}
      initialStatus={order ? mapStatusToStep(order.status) : "Preparing"}
    />
  );
}

export default function ResponsiveSellerOrdersDetailsPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 20, textAlign: "center", color: "#64748B" }}>
          Loading Order Details...
        </div>
      }
    >
      <DetailsContent />
    </Suspense>
  );
}

