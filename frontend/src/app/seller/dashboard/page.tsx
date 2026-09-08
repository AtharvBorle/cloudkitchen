import type { Metadata } from "next";
import { SellerDashboard } from "@/components/seller";

export const metadata: Metadata = {
  title: "Operations Dashboard | Neo Cloud Kitchen",
  description: "Real-time tracking of Neo Cloud Room revenue and food delivery metrics.",
};

export default function SellerOperationsDashboardPage() {
  return <SellerDashboard />;
}
