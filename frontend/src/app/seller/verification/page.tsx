"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SellerLayout } from "@/components/seller/seller-layout";
import { VerificationStatus } from "@/components/seller/verification-status";

function VerificationContent() {
  const searchParams = useSearchParams();
  const trackingId = searchParams?.get("trackingId") || undefined;
  return <VerificationStatus trackingId={trackingId} />;
}

export default function VerificationPage() {
  return (
    <SellerLayout
      activeSidebarItem="verification"
      pageTitle="Verification"
      mobileTitle="Verification"
      backHref="/seller/registration-submitted"
    >
      <Suspense fallback={<div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>}>
        <VerificationContent />
      </Suspense>
    </SellerLayout>
  );
}
