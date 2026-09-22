import type { Metadata } from "next";
import ResponsiveAddAgent from "@/components/seller/delivery/responsive/ResponsiveAddAgent";

export const metadata: Metadata = {
  title: "Add Delivery Agent | Neo Cloud Kitchen",
  description: "Add and register a new delivery partner in your kitchen hub.",
};

export default function ResponsiveAddDeliveryAgentPage() {
  return <ResponsiveAddAgent />;
}
