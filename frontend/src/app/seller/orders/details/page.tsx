import type { Metadata } from "next";
import { SellerResponsiveWrapper } from "@/components/seller";
import ResponsiveSellerOrdersDetailsPage from "@/app/seller/res/orders/details/page";

export const metadata: Metadata = {
  title: "Order Details | Neo Cloud Kitchen",
  description: "View and track kitchen order line items, customer address, and rider assignment.",
};

export default function SellerOrdersDetailsPage() {
  return (
    <SellerResponsiveWrapper
      desktop={<ResponsiveSellerOrdersDetailsPage />}
      mobile={<ResponsiveSellerOrdersDetailsPage />}
    />
  );
}
