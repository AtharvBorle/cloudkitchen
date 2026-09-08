"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ResponsiveAssignRider from "@/components/seller/seller-orders/responsive/ResponsiveAssignRider";

function AssignRiderContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "#1234";

  return <ResponsiveAssignRider orderId={orderId} />;
}

export default function ResponsiveAssignRiderPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20, textAlign: "center" }}>Loading Assign Rider...</div>}>
      <AssignRiderContent />
    </Suspense>
  );
}
