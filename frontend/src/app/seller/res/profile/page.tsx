"use client";

import React, { Suspense } from "react";
import ResSellerProfile from "@/components/seller/seller-profile/responsive/ResSellerProfile";

export default function ResponsiveSellerProfilePage() {
  return (
    <Suspense fallback={<div>Loading profile...</div>}>
      <ResSellerProfile />
    </Suspense>
  );
}
