import type { Metadata } from "next";
import RiderSettlementDas from "@/components/seller/delivery/rider_settlement/RiderSettlementDas";

export const metadata: Metadata = {
  title: "Rider Settlements & Ledger History | Neo Cloud Kitchen",
  description: "Manage delivery agents, view cash balance, and record settlement ledger.",
};

export default function RiderSettlementsPage() {
  return <RiderSettlementDas />;
}
