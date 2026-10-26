import type { Metadata } from "next";
import { Suspense } from "react";
import { EditMenu, SellerResponsiveWrapper } from "@/components/seller";
import ResponsiveMenuItemPage from "@/app/seller/res/menu/item/page";

export const metadata: Metadata = {
  title: "Menu Item Details | Neo Cloud Kitchen",
  description: "Create or edit dishes, pricing, dietary tags, stock levels, and food imagery.",
};

export default function SellerMenuItemPage() {
  return (
    <Suspense fallback={<div style={{ padding: "32px", textAlign: "center", color: "#64748B" }}>Loading Menu Item...</div>}>
      <SellerResponsiveWrapper
        desktop={<EditMenu />}
        mobile={<ResponsiveMenuItemPage />}
      />
    </Suspense>
  );
}
