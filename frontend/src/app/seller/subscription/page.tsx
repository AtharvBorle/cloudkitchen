import type { Metadata } from "next";
import SubscriptionEditCanvasDas from "@/components/seller/subscription/SubscriptionEditCanvasDas";

export const metadata: Metadata = {
  title: "Edit Subscription Plan | Neo Cloud Kitchen",
  description: "Configure and manage subscription plan tiers, weekly inclusions, meal schedules, and pricing.",
};

export default function SellerSubscriptionPage() {
  return <SubscriptionEditCanvasDas />;
}
