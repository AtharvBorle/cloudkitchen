import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderDefault } from "@/components/seller";

export const metadata: Metadata = {
  title: "Order Lifecycle & Details | Neo Cloud Kitchen",
  description: "View order lifecycle, resident details, and order items.",
};

export default function OrderDefaultPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>Loading order details...</div>}>
      <OrderDefault />
    </Suspense>
  );
}

