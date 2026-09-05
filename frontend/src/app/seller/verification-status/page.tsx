"use client";

import React from "react";
import { SellerLayout } from "@/components/seller/seller-layout";
import { VerificationStatus } from "@/components/seller/verification-status";

export default function VerificationStatusPage() {
  return (
    <SellerLayout activeSidebarItem="verification">
      <VerificationStatus trackingId="NCR-2024-0847" />
    </SellerLayout>
  );
}
