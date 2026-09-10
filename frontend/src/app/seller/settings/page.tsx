import type { Metadata } from "next";
import SettingsCanvasDas from "@/components/seller/seller-settings/SettingsCanvasDas";

export const metadata: Metadata = {
  title: "Settings | Neo Cloud Kitchen",
  description: "Manage your account preferences, notifications, and application settings.",
};

export default function SellerSettingsPage() {
  return <SettingsCanvasDas />;
}
