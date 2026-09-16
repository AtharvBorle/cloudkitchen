import type { Metadata } from "next";
import CreateOfferCanvasDas from "@/components/seller/seller-offers/CreateOfferCanvasDas";

export const metadata: Metadata = {
  title: "Create New Offer | Neo Cloud Kitchen",
  description: "Setup a new discount, coupon, or promotional rule for your store.",
};

export default function DashboardCreateOfferPage() {
  return <CreateOfferCanvasDas />;
}
