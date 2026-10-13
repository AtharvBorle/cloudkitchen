import { Suspense } from "react";
import type { Metadata } from "next";
import { SellerOrders, SellerResponsiveWrapper } from "@/components/seller";
import ResponsiveSellerOrdersPage from "@/app/seller/res/orders/page";

export const metadata: Metadata = {
  title: "Food & Service Orders | Neo Cloud Kitchen",
  description: "Manage active incoming, preparation, and delivery cycles.",
};

export default function SellerOrdersPage() {
  return (
    <Suspense fallback={null}>
      <SellerResponsiveWrapper
        desktop={<SellerOrders />}
        mobile={<ResponsiveSellerOrdersPage />}
      />
    </Suspense>
  );
}
