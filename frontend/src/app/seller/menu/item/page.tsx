import type { Metadata } from "next";
import { SellerResponsiveWrapper } from "@/components/seller";
import ResponsiveMenuItemPage from "@/app/seller/res/menu/item/page";

export const metadata: Metadata = {
  title: "Menu Item Details | Neo Cloud Kitchen",
  description: "Create or edit dishes, pricing, dietary tags, stock levels, and food imagery.",
};

export default function SellerMenuItemPage() {
  return (
    <SellerResponsiveWrapper
      desktop={<ResponsiveMenuItemPage />}
      mobile={<ResponsiveMenuItemPage />}
    />
  );
}
