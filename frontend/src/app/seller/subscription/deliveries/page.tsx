import type { Metadata } from "next";
import DeliveriesCanvas from "@/components/seller/subscription/DeliveriesCanvas";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Meal Subscription Deliveries | Neo Cloud Kitchen",
  description: "Organize and fulfill scheduled meal subscription deliveries by predefined meal slot.",
};

export default function DeliveriesPage() {
  return <DeliveriesCanvas />;
}
