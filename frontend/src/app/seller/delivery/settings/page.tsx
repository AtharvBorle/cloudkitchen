import type { Metadata } from "next";
import { SellerResponsiveWrapper } from "@/components/seller";
import ResponsiveDeliverySettingsPage from "@/app/seller/res/delivery/settings/page";

export const metadata: Metadata = {
  title: "Delivery Settings | Neo Cloud Kitchen",
  description: "Configure delivery zones, rates, auto-assignment rules, and tracking parameters.",
};

export default function SellerDeliverySettingsPage() {
  return (
    <SellerResponsiveWrapper
      desktop={<ResponsiveDeliverySettingsPage />}
      mobile={<ResponsiveDeliverySettingsPage />}
    />
  );
}
