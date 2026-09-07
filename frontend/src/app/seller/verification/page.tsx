"use client";

import React from "react";
import { SellerLayout } from "@/components/seller/seller-layout";
import { VerificationStatus } from "@/components/seller/verification-status";

export default function VerificationPage() {
  return (
    <SellerLayout
      activeSidebarItem="verification"
      pageTitle="Verification"
      mobileTitle="Verification"
      backHref="/seller/registration-submitted"
    >
      <VerificationStatus trackingId="NCR-2026-0847" />
    </SellerLayout>
  );
}
