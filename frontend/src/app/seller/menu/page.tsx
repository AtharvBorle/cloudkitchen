import type { Metadata } from "next";
import { SellerMenu } from "@/components/seller";

export const metadata: Metadata = {
  title: "Menu Inventory | Neo Cloud Kitchen",
  description: "Publish dishes, update pricing, toggle real-time availability in rooms.",
};

export default function SellerMenuPage() {
  return <SellerMenu />;
}
