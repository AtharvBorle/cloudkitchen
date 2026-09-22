import type { Metadata } from "next";
import { SellerMenu, SellerResponsiveWrapper } from "@/components/seller";
import ResponsiveMenuPage from "@/app/seller/res/menu/page";

export const metadata: Metadata = {
  title: "Menu Inventory | Neo Cloud Kitchen",
  description: "Publish dishes, update pricing, toggle real-time availability in rooms.",
};

export default function SellerMenuPage() {
  return (
    <SellerResponsiveWrapper
      desktop={<SellerMenu />}
      mobile={<ResponsiveMenuPage />}
    />
  );
}
