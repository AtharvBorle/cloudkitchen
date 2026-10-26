import type { Metadata } from "next";
import { Suspense } from "react";
import { SellerMenu, SellerResponsiveWrapper } from "@/components/seller";
import ResponsiveMenuPage from "@/app/seller/res/menu/page";

export const metadata: Metadata = {
  title: "Menu Inventory | Neo Cloud Kitchen",
  description: "Publish dishes, update pricing, toggle real-time availability in rooms.",
};

export default function SellerMenuPage() {
  return (
    <Suspense fallback={<div style={{ padding: "32px", textAlign: "center", color: "#6b7280" }}>Loading menu...</div>}>
      <SellerResponsiveWrapper
        desktop={<SellerMenu />}
        mobile={<ResponsiveMenuPage />}
      />
    </Suspense>
  );
}
