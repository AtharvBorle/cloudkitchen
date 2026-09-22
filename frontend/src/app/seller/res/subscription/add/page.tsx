"use client";

import React, { Suspense } from "react";
import ResSellerSubPlan from "@/components/seller/subscription/responsive/ResSellerSubPlan";

export default function AddSubscriptionPlanResPage() {
  return (
    <Suspense fallback={<div style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>Loading plan configuration...</div>}>
      <ResSellerSubPlan />
    </Suspense>
  );
}
