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
          fetchApi("/api/seller/orders"),
          fetchApi("/api/seller/delivery"),
        ]);

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          const ordersList = ordersData.data?.orders || ordersData.orders || ordersData.data || [];
          if (Array.isArray(ordersList)) {
            const found = ordersList.find(
              (o: any) => o.id === cleanId || o.id === rawId || `#${o.id.slice(0, 6)}` === rawId
            );
            if (found) setOrder(found);
          }
        }

        if (deliveryRes.ok) {
          const deliveryData = await deliveryRes.json();
          const deliveryList = deliveryData.data?.deliveryPersons || deliveryData.deliveryPersons || deliveryData.data || [];
          if (Array.isArray(deliveryList) && deliveryList.length > 0) {
            setRiders(
              deliveryList.map((dp: any, idx: number) => ({
                id: dp.id,
                name: dp.name,
                initials: dp.name
                  ? dp.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : "RK",
                distance: `${(idx + 1) * 1.2} km away`,
              }))
            );
          }
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
      await fetchApi(`/api/seller/orders/${targetOrderId}/assign`, {
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

