import type { Metadata } from "next";
import ManageSubscriptionCanvasDas from "@/components/seller/subscription/ManageSubscriptionCanvasDas";

export const metadata: Metadata = {
  title: "Manage Subscriptions | Neo Cloud Kitchen",
  description:
    "Manage active meal subscription packages, active subscriber accounts, revenue streams, and plan tiers.",
};

export default function SellerSubscriptionPage() {
  return <ManageSubscriptionCanvasDas />;
}
