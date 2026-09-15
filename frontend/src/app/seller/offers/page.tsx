import React, { Suspense } from "react";
import type { Metadata } from "next";
import SellerOffersCanvasDas from "@/components/seller/seller-offers/SellerOffersCanvasDas";

export const metadata: Metadata = {
  title: "Offers & Coupons | Neo Cloud Kitchen",
  description: "Create and manage store offers, product coupons, and promotional discounts.",
};

export default function SellerOffersPage() {
  return (
    <Suspense fallback={<div style={{ padding: "32px", color: "#64748B" }}>Loading offers...</div>}>
      <SellerOffersCanvasDas />
    </Suspense>
  );
}
