import type { Metadata } from "next";
import { RiderSettlementDas, SellerResponsiveWrapper } from "@/components/seller";
import ResponsiveCashHandoverPage from "@/app/seller/res/delivery/handover/page";

export const metadata: Metadata = {
  title: "Cash Handover & Settlement | Neo Cloud Kitchen",
  description: "Audit and confirm cash collected by delivery riders on order deliveries.",
};

export default function SellerDeliveryHandoverPage() {
  return (
    <SellerResponsiveWrapper
      desktop={<RiderSettlementDas />}
      mobile={<ResponsiveCashHandoverPage />}
    />
  );
}
