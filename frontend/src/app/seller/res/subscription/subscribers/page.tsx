import React from "react";
import type { Metadata } from "next";
import SubscribersCanvasDas from "@/components/seller/subscription/SubscribersCanvasDas";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Active Subscribers | Kitchen Operations",
  description: "Manage active subscriber accounts and meal subscriptions.",
};

export default function ResSubscribersPage() {
  return <SubscribersCanvasDas />;
}
