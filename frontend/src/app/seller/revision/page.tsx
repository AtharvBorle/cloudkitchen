"use client";

import React from "react";
import { SellerLayout } from "@/components/seller/seller-layout";
import { RevisionActionRequired } from "@/components/seller/revision-action-required";

export default function RevisionPage() {
  return (
    <SellerLayout
      activeSidebarItem="verification"
      pageTitle="Document Revision"
      mobileTitle="Correct & resubmit"
      backHref="/seller/verification-status"
    >
      <RevisionActionRequired />
    </SellerLayout>
  );
}
