"use client";

import React, { Suspense } from "react";
import ResSellerSubEdit from "@/components/seller/subscription/responsive/ResSellerSubEdit";

export default function EditSubscriptionPlanResPage() {
  return (
    <Suspense fallback={<div style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>Loading plan configuration...</div>}>
      <ResSellerSubEdit />
    </Suspense>
  );
}
