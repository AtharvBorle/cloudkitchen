"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ResponsiveSellerOrdersDetails from "@/components/seller/seller-orders/responsive/ResponsiveSellerOrdersDetails";
import { formatOrderDeliveryAddress } from "@/components/seller/seller-orders/SellerOrders";
import { fetchApi } from "@/lib/fetch-api";

function DetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawId = searchParams.get("orderId") || "#1234";
  const cleanId = rawId.replace("#", "");
  const from = searchParams.get("from");

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const handleBack = () => {
    if (from === "dashboard") {
      router.push("/seller/res/dashboard");
      return;
    }
    if (from === "orders") {
      router.push("/seller/res/orders");
      return;
    }
    if (typeof document !== "undefined" && document.referrer) {
      if (
        document.referrer.includes("/seller/res/dashboard") ||
        document.referrer.includes("/seller/dashboard")
      ) {
        router.push("/seller/res/dashboard");
        return;
      }
      if (
        document.referrer.includes("/seller/orders") ||
        document.referrer.includes("/seller/res/orders")
      ) {
        router.push("/seller/res/orders");
        return;
      }
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      const prevPath = window.location.pathname;
      router.back();
      setTimeout(() => {
        if (window.location.pathname === prevPath) {
          router.push("/seller/res/dashboard");
        }
      }, 200);
      return;
    }
    router.push("/seller/res/dashboard");
  };

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await fetchApi("/api/seller/orders");
        if (res.ok) {
          const ordersData = await res.json();
          const list = ordersData.data?.orders || ordersData.orders || ordersData.data || [];
          if (Array.isArray(list)) {
            const rawTarget = cleanId.trim().toLowerCase();
            const target = rawTarget.replace(/^(?:ord|ncr)-/i, "").trim();
            const found = list.find((o: any) => {
              const oId = (o.id || "").toLowerCase();
              return (
                oId === rawTarget ||
                oId === target ||
                oId.startsWith(target) ||
                oId.endsWith(target) ||
                `#${oId.slice(0, 6)}` === rawId.toLowerCase() ||
                oId.slice(0, 6) === target
              );
            });
            if (found) {
              setOrder(found);
            }
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
    ? parsedItems.map((it: any, idx: number) => {
        const addonsList = Array.isArray(it.selectedAddons) ? it.selectedAddons : [];
        const addonStr = addonsList.length > 0 ? ` (+ ${addonsList.map((a: any) => `${a.name} ₹${a.price}`).join(', ')})` : '';
        return {
          id: it.id || String(idx),
          name: `${it.name || "Food Item"}${addonStr}`,
          qty: it.quantity || it.qty || 1,
          price: `₹${it.price || 0}`,
        };
      })
    : undefined;

  const mapStatusToStep = (st: string) => {
    const s = (st || "").toUpperCase();
    switch (s) {
      case "OUT_FOR_DELIVERY":
      case "ON_THE_WAY":
      case "DISPATCHED":
        return "On the way" as const;
      case "DELIVERED":
      case "COMPLETED":
        return "Delivered" as const;
      case "PREPARING":
      case "CONFIRMED":
      case "ACCEPTED":
        return "Preparing" as const;
      case "CANCELLED":
      case "REJECTED":
        return "Cancelled" as const;
      case "PENDING":
      case "PLACED":
      case "NEW":
      default:
        return "Order Placed" as const;
    }
  };

  const calculatedSubtotal = Array.isArray(parsedItems)
    ? parsedItems.reduce((sum: number, it: any) => sum + (Number(it.price) || 0) * (Number(it.quantity || it.qty) || 1), 0)
    : 0;

  const totalNum = order?.totalAmount !== undefined && order?.totalAmount !== null ? Number(order.totalAmount) : calculatedSubtotal;
  const subtotalNum = calculatedSubtotal > 0 ? calculatedSubtotal : totalNum;
  const discountNum = Math.max(0, subtotalNum - totalNum);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#F8FAFC", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#64748B", fontSize: "0.92rem", fontWeight: 500 }}>
        Loading Order Details...
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#F8FAFC", padding: "40px 16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#1E293B", margin: "0 0 8px 0" }}>Order Not Found</h2>
        <p style={{ fontSize: "0.88rem", color: "#64748B", margin: "0 0 20px 0" }}>The requested order could not be located or has expired.</p>
        <button
          type="button"
          onClick={handleBack}
          style={{
            padding: "10px 20px",
            backgroundColor: "#FF5500",
            color: "#FFFFFF",
            borderRadius: "8px",
            border: "none",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <ResponsiveSellerOrdersDetails
      orderId={order ? `#${order.id.slice(0, 6).toUpperCase()}` : rawId}
      customerName={order?.user?.name || order?.customerName || "Customer"}
      customerPhone={order?.customerPhone || order?.user?.phone || ""}
      deliveryAddress={formatOrderDeliveryAddress(order?.deliveryAddress, order?.room?.title)}
      riderName={order?.deliveryPerson?.name || ""}
      riderInitials={
        order?.deliveryPerson?.name
          ? order.deliveryPerson.name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
          : ""
      }
      riderPhone={order?.deliveryPerson?.phone || ""}
      riderEta={order?.deliveryPerson ? "Assigned" : ""}
      items={formattedItems || []}
      subtotal={`₹${subtotalNum}`}
      deliveryFee="Free"
      discount={discountNum > 0 ? `₹${discountNum}` : undefined}
      total={`₹${totalNum}`}
      paymentMethod={`${order?.paymentMethod || "COD"} (${order?.isPaid ? "Paid" : "Unpaid"})`}
      initialStatus={order ? mapStatusToStep(order.status) : "Order Placed"}
      createdAt={order?.createdAt}
      onBack={handleBack}
      onStatusChange={async (newStep) => {
        if (!order?.id) return;
        let backendStatus = "PENDING";
        if (newStep === "Preparing") backendStatus = "PREPARING";
        else if (newStep === "On the way") backendStatus = "OUT_FOR_DELIVERY";
        else if (newStep === "Delivered") backendStatus = "DELIVERED";
        else if (newStep === "Cancelled") backendStatus = "CANCELLED";

        const res = await fetchApi(`/api/seller/orders/${order.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: backendStatus,
            ...(newStep === "Delivered" ? { isPaid: true } : {}),
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.message || data?.error || "Failed to update order status");
        }
        setOrder((prev: any) =>
          prev
            ? {
                ...prev,
                status: backendStatus,
                isPaid: newStep === "Delivered" ? true : prev.isPaid,
              }
            : null
        );
      }}
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

