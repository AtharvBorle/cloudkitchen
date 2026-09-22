import type { Metadata } from "next";
import { SellerDashboard, SellerResponsiveWrapper } from "@/components/seller";
import ResponsiveSellerDashboardPage from "@/app/seller/res/dashboard/page";

export const metadata: Metadata = {
  title: "Operations Dashboard | Neo Cloud Kitchen",
  description: "Real-time tracking of Neo Cloud Room revenue and food delivery metrics.",
};

export default function SellerOperationsDashboardPage() {
  return (
    <SellerResponsiveWrapper
      desktop={<SellerDashboard />}
      mobile={<ResponsiveSellerDashboardPage />}
    />
  );
}
