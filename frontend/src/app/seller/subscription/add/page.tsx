import type { Metadata } from "next";
import CreateSubscriptionPlan from "@/components/seller/create-subscription-plan/CreateSubscriptionPlan";

export const metadata: Metadata = {
  title: "Create New Subscription Plan | Neo Cloud Kitchen",
  description: "Create and publish a new meal subscription plan tier with custom inclusions and schedules.",
};

export default function SellerSubscriptionAddPage() {
  return <CreateSubscriptionPlan />;
}
