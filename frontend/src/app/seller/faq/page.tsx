import type { Metadata } from "next";
import { FAQ, SellerResponsiveWrapper } from "@/components/seller";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | Neo Cloud Kitchen",
  description: "Find answers regarding kitchen operations, room bookings, settlements, and platform support.",
};

export default function SellerFAQPage() {
  return (
    <SellerResponsiveWrapper
      desktop={<FAQ />}
      mobile={<FAQ />}
    />
  );
}
