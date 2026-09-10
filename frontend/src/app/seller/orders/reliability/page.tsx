import type { Metadata } from "next";
import { SellerResponsiveWrapper } from "@/components/seller";
import ResponsiveCustomerReliabilityPage from "@/app/seller/res/orders/reliability/page";

export const metadata: Metadata = {
  title: "Customer Reliability Score | Neo Cloud Kitchen",
  description: "View customer cancellation rate, delivery success score, and trust metrics.",
};

export default function SellerCustomerReliabilityPage() {
  return (
    <SellerResponsiveWrapper
      desktop={<ResponsiveCustomerReliabilityPage />}
      mobile={<ResponsiveCustomerReliabilityPage />}
    />
  );
}
