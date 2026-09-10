import type { Metadata } from "next";
import { ManageSubscriptionCanvasDas, SellerResponsiveWrapper } from "@/components/seller";
import ResponsiveSellerSubscriptionPage from "@/app/seller/res/subscription/page";

export const metadata: Metadata = {
  title: "Manage Subscriptions | Neo Cloud Kitchen",
  description:
    "Manage active meal subscription packages, active subscriber accounts, revenue streams, and plan tiers.",
};

export default function SellerSubscriptionPage() {
  return (
    <SellerResponsiveWrapper
      desktop={<ManageSubscriptionCanvasDas />}
      mobile={<ResponsiveSellerSubscriptionPage />}
    />
  );
}
