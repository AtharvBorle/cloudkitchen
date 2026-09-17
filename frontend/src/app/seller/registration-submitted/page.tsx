"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  SellerLayout,
  RegistrationSubmitted,
} from "@/components/seller";

function SubmittedContent() {
  const searchParams = useSearchParams();
  const trackingId = searchParams?.get("trackingId") || undefined;

  return <RegistrationSubmitted trackingId={trackingId} />;
}

export default function RegistrationSubmittedPage() {
  return (
    <SellerLayout
      activeSidebarItem="registration"
      pageTitle="Neo Cloud Room Onboarding"
      hideMobileHeader={true}
    >
      <Suspense fallback={<div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>}>
        <SubmittedContent />
      </Suspense>
    </SellerLayout>
  );
}
