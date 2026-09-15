import type { Metadata } from "next";
import { Suspense } from "react";
import { SellerResponsiveWrapper, OrderDefault } from "@/components/seller";
import ResponsiveSellerOrdersDetailsPage from "@/app/seller/res/orders/details/page";

export const metadata: Metadata = {
  title: "Order Details | Neo Cloud Kitchen",
  description: "View and track kitchen order line items, customer address, and rider assignment.",
};

export default function SellerOrdersDetailsPage() {
  return (
    <SellerResponsiveWrapper
      desktop={
        <Suspense fallback={<div style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>Loading order details...</div>}>
          <OrderDefault />
        </Suspense>
      }
      mobile={<ResponsiveSellerOrdersDetailsPage />}
    />
  );
}

