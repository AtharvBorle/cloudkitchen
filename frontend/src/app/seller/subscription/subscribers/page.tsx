import type { Metadata } from "next";
import SubscribersCanvasDas from "@/components/seller/subscription/SubscribersCanvasDas";

export const metadata: Metadata = {
  title: "Subscribers | Manage Subscriptions | Neo Cloud Kitchen",
  description:
    "View and filter all active and expired meal plan subscribers, delivery addresses, renewal dates, and subscription statuses.",
};

export default function SellerSubscriptionSubscribersPage() {
  return <SubscribersCanvasDas />;
}
