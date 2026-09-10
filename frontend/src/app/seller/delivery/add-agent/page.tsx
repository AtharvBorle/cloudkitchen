import type { Metadata } from "next";
import { AgentCanvasDas, SellerResponsiveWrapper } from "@/components/seller";
import ResponsiveAddDeliveryAgentPage from "@/app/seller/res/delivery/add-agent/page";

export const metadata: Metadata = {
  title: "Add Delivery Agent | Neo Cloud Kitchen",
  description: "Create and register a new delivery partner in your kitchen hub.",
};

export default function SellerAddDeliveryAgentPage() {
  return (
    <SellerResponsiveWrapper
      desktop={<AgentCanvasDas />}
      mobile={<ResponsiveAddDeliveryAgentPage />}
    />
  );
}
