"use client";

import React from "react";
import { SellerLayout } from "@/components/seller/seller-layout";
import { RevisionActionRequired } from "@/components/seller/revision-action-required";

export default function RevisionPage() {
  return (
    <SellerLayout
      activeSidebarItem="verification"
      pageTitle="Neo Cloud Room Onboarding"
      mobileTitle="Correct & resubmit"
      backHref="/seller/verification-status"
      userName="John Doe"
      userRole="Owner Account"
      userInitials="JD"
    >
      <RevisionActionRequired trackingId="NCR-2026-0847" />
    </SellerLayout>
  );
}
