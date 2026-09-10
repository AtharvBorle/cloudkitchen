"use client";

import React, { Suspense } from "react";
import ResponsiveSellerSettings from "@/components/seller/seller-settings/responsive/ResponsiveSellerSettings";

export default function ResponsiveSellerSettingsPage() {
  return (
    <Suspense fallback={<div>Loading settings...</div>}>
      <ResponsiveSellerSettings />
    </Suspense>
  );
}
