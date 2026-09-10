import type { Metadata } from "next";
import { TC, SellerResponsiveWrapper } from "@/components/seller";

export const metadata: Metadata = {
  title: "Terms & Conditions & Privacy | Neo Cloud Kitchen",
  description: "Terms of service, privacy policy, and partner agreement policies.",
};

export default function SellerTCPage() {
  return (
    <SellerResponsiveWrapper
      desktop={<TC />}
      mobile={<TC />}
    />
  );
}
