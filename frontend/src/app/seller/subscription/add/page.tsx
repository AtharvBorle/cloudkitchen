import type { Metadata } from "next";
import SubscriptionEditCanvasDas from "@/components/seller/subscription/SubscriptionEditCanvasDas";

export const metadata: Metadata = {
  title: "Create New Subscription Plan | Neo Cloud Kitchen",
  description: "Create and publish a new meal subscription plan tier with custom inclusions and schedules.",
};

const NEW_PLAN_DEFAULTS = {
  planName: "New Plan Tier",
  planTier: "Standard",
  monthlyPrice: "₹ 799.00",
  quarterlyPrice: "₹ 2,199.00",
  yearlyPrice: "₹ 7,999.00",
  includedFeatures: [
    { id: "feat-1", label: "6 Meals per week (Monday to Saturday)", checked: true },
    { id: "feat-2", label: "1 Dal + 1 Sabzi + Roti + Rice", checked: true },
    { id: "feat-3", label: "Salad & Pickle", checked: true },
  ],
  customFeature: "",
  planDuration: "1 Month",
  mealTimings: [
    { id: "time-1", mealName: "Lunch", timing: "12:30 PM – 2:00 PM" },
  ],
  allowCancelSubscription: true,
  allowPauseBilling: true,
  metrics: {
    subscribers: 0,
    monthlyRevenue: "₹0.00",
  },
  metadata: {
    planId: "PLN-NEW",
    deployedDate: "Today",
    taxCode: "GST 18% Extra",
    tierBadgeText: "NEW TIER",
  },
};

export default function SellerSubscriptionAddPage() {
  return <SubscriptionEditCanvasDas initialData={NEW_PLAN_DEFAULTS} />;
}
