import type { Metadata } from "next";
import { Suspense } from "react";
import OrderConfirmation from "@/components/order-confirmation/OrderConfirmation";

export const metadata: Metadata = {
  title: "Order Confirmed | Neo Cloud Bites",
  description: "Your cloud kitchen order is confirmed and being prepared.",
};

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", textAlign: "center" }}>Loading order status...</div>}>
      <OrderConfirmation />
    </Suspense>
  );
}
