import type { Metadata } from "next";
import AgentCanvasDas from "@/components/seller/delivery/manage_rider/AgentCanvasDas";

export const metadata: Metadata = {
  title: "Add Delivery Agent | Neo Cloud Kitchen",
  description: "Create and register a new delivery agent profile with COD collection settings.",
};

export default function AddDeliveryAgentPage() {
  return <AgentCanvasDas />;
}
