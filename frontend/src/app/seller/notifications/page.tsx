import type { Metadata } from "next";
import { SellerNotificationsCanvasDas, SellerResponsiveWrapper } from "@/components/seller";
import ResponsiveSellerNotificationsPage from "@/app/seller/res/notifications/page";

export const metadata: Metadata = {
  title: "Notifications | Neo Cloud Kitchen",
  description: "View and manage all real-time seller alerts, stock updates, incoming orders, and kitchen delivery notifications.",
};

export default function SellerNotificationsPage() {
  return (
    <SellerResponsiveWrapper
      desktop={<SellerNotificationsCanvasDas />}
      mobile={<ResponsiveSellerNotificationsPage />}
    />
  );
}
