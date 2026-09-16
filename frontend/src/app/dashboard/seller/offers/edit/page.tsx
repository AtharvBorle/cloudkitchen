import type { Metadata } from "next";
import EditOfferCanvasDas from "@/components/seller/seller-offers/EditOfferCanvasDas";

export const metadata: Metadata = {
  title: "Edit Offer | Neo Cloud Kitchen",
  description: "Update store discount, coupon, or promotional rule.",
};

export default function DashboardEditOfferPage() {
  return <EditOfferCanvasDas />;
}
