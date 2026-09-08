"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ResponsiveAssignRider from "@/components/seller/seller-orders/responsive/ResponsiveAssignRider";
import { fetchApi } from "@/lib/fetch-api";

function AssignRiderContent() {
  const searchParams = useSearchParams();
  const rawId = searchParams.get("orderId") || "#1234";
  const cleanId = rawId.replace("#", "");

  const [order, setOrder] = useState<any>(null);
  const [riders, setRiders] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [ordersRes, deliveryRes] = await Promise.all([
          fetchApi<{ orders: any[] }>("/api/seller/orders"),
          fetchApi<{ deliveryPersons: any[] }>("/api/seller/delivery"),
        ]);

        if (ordersRes.data?.orders) {
          const found = ordersRes.data.orders.find(
            (o) => o.id === cleanId || o.id === rawId || `#${o.id.slice(0, 6)}` === rawId
          );
          if (found) setOrder(found);
        }

        if (deliveryRes.data?.deliveryPersons && deliveryRes.data.deliveryPersons.length > 0) {
          setRiders(
            deliveryRes.data.deliveryPersons.map((dp: any, idx: number) => ({
              id: dp.id,
              name: dp.name,
              initials: dp.name
                ? dp.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                : "RK",
              distance: `${(idx + 1) * 1.2} km away`,
            }))
          );
        }
      } catch (err) {
        console.error("Failed to load riders or order details:", err);
      }
    }
    loadData();
  }, [cleanId, rawId]);

  const handleAssign = async (riderId: string) => {
    const targetOrderId = order?.id || cleanId;
    try {
      await fetch(`/api/seller/orders/${targetOrderId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryPersonId: riderId }),
      });
    } catch (err) {
      console.error("Failed to assign rider to order:", err);
    }
  };

  let itemCount = 3;
  if (order?.items) {
    try {
      const parsed = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
      itemCount = parsed.length || 1;
    } catch {
      itemCount = 1;
    }
  }

  return (
    <ResponsiveAssignRider
      orderId={order ? `#${order.id.slice(0, 6)}` : rawId}
      itemCount={itemCount}
      orderTotal={order ? `₹${order.totalAmount}` : "₹850"}
      deliveryArea={order?.deliveryAddress?.split(",")[0] || "Powai"}
      riders={riders.length > 0 ? riders : undefined}
      onAssign={handleAssign}
    />
  );
}

export default function ResponsiveAssignRiderPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 20, textAlign: "center", color: "#64748B" }}>
          Loading Assign Rider...
        </div>
      }
    >
      <AssignRiderContent />
    </Suspense>
  );
}

