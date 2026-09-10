import type { Metadata } from "next";
import { RiderCanvasDas, SellerResponsiveWrapper } from "@/components/seller";
import ResponsiveManageRidersPage from "@/app/seller/res/delivery/riders/page";

export const metadata: Metadata = {
  title: "Managed Riders | Neo Cloud Kitchen",
  description: "View online/offline status and outstanding balances for delivery riders.",
};

export default function SellerDeliveryRidersPage() {
  return (
    <SellerResponsiveWrapper
      desktop={<RiderCanvasDas />}
      mobile={<ResponsiveManageRidersPage />}
    />
  );
}
