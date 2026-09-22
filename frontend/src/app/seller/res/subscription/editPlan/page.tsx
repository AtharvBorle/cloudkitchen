"use client";

import React, { Suspense } from "react";
import ResSellerSubEdit from "@/components/seller/subscription/responsive/ResSellerSubEdit";

export default function EditSubscriptionPlanPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResSellerSubEdit />
    </Suspense>
  );
}
