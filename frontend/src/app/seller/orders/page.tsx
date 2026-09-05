import type { Metadata } from "next";
import { SellerOrders } from "@/components/seller";

export const metadata: Metadata = {
  title: "Food & Service Orders | Neo Cloud Kitchen",
  description: "Manage active incoming, preparation, and delivery cycles.",
};

export default function SellerOrdersPage() {
  return <SellerOrders />;
}
