import type { Metadata } from "next";
import { SubscriptionEditCanvasDas, SellerResponsiveWrapper } from "@/components/seller";
import EditSubscriptionPlanPage from "@/app/seller/res/subscription/editPlan/page";

export const metadata: Metadata = {
  title: "Edit Subscription Plan | Neo Cloud Kitchen",
  description: "Configure and manage subscription plan tiers, weekly inclusions, meal schedules, and pricing.",
};

export default function SellerSubscriptionEditPlanWithParamPage() {
  return (
    <SellerResponsiveWrapper
      desktop={<SubscriptionEditCanvasDas />}
      mobile={<EditSubscriptionPlanPage />}
    />
  );
}
