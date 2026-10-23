"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SellerLayout } from "@/components/seller/seller-layout";
import { VerificationStatus } from "@/components/seller/verification-status";

function TrackApplicationContent() {
  const searchParams = useSearchParams();
  const trackingId = searchParams?.get("trackingId") || undefined;
  return <VerificationStatus trackingId={trackingId} />;
}

export default function TrackApplicationPage() {
  return (
    <SellerLayout
      activeSidebarItem="verification"
      pageTitle="Verification Status"
      mobileTitle="Verification"
      backHref="/seller/registration-submitted"
    >
      <Suspense fallback={<div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>}>
        <TrackApplicationContent />
      </Suspense>
    </SellerLayout>
  );
}
