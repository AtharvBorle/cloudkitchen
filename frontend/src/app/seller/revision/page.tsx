"use client";

import React from "react";
import { SellerLayout } from "@/components/seller/seller-layout";
import { RevisionActionRequired } from "@/components/seller/revision-action-required";

export default function RevisionPage() {
  return (
    <SellerLayout
      activeSidebarItem="verification"
      pageTitle="Neo Cloud Room Onboarding"
      userName="John Doe"
      userRole="Owner Account"
      userInitials="JD"
    >
      <RevisionActionRequired trackingId="NCR-2024-0847" />
    </SellerLayout>
  );
}
