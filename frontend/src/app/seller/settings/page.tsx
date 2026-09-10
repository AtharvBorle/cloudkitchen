import type { Metadata } from "next";
import { SettingsCanvasDas, SellerResponsiveWrapper } from "@/components/seller";
import ResponsiveSellerSettingsPage from "@/app/seller/res/settings/page";

export const metadata: Metadata = {
  title: "Settings | Neo Cloud Kitchen",
  description: "Manage your account preferences, notifications, and application settings.",
};

export default function SellerSettingsPage() {
  return (
    <SellerResponsiveWrapper
      desktop={<SettingsCanvasDas />}
      mobile={<ResponsiveSellerSettingsPage />}
    />
  );
}
