import type { Metadata } from "next";
import { Suspense } from "react";
import OrderConfirmation from "@/components/order-confirmation/OrderConfirmation";

export const metadata: Metadata = {
  title: "Track Order | Neo Cloud Bites",
  description: "Track your cloud kitchen food order live in real-time.",
};

export default async function TrackOrderIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return (
    <Suspense fallback={<div style={{ padding: "40px", textAlign: "center" }}>Loading order status...</div>}>
      <OrderConfirmation orderIdProp={resolvedParams?.id} />
    </Suspense>
  );
}
