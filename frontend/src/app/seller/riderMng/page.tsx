import type { Metadata } from "next";
import RiderCanvasDas from "@/components/seller/delivery/manage_rider/RiderCanvasDas";

export const metadata: Metadata = {
  title: "Rider Management & COD Delivery Logs | Neo Cloud Kitchen",
  description: "Audit outstanding cash collections and assign delivery routes to riders.",
};

export default function RiderManagementPage() {
  return <RiderCanvasDas />;
}
