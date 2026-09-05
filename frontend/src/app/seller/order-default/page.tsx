import type { Metadata } from "next";
import { OrderDefault } from "@/components/seller";

export const metadata: Metadata = {
  title: "Order Details #NCR-8291 | Neo Cloud Kitchen",
  description: "View order lifecycle, resident details, and order items.",
};

export default function OrderDefaultPage() {
  return <OrderDefault />;
}
