"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  SellerLayout,
  LegalDocuments,
} from "@/components/seller";

export default function LegalDocumentsPage() {
  const router = useRouter();

  const handleContinue = () => {
    router.push("/seller/media-information");
  };

  const handleBack = () => {
    router.push("/seller/business-information");
  };

  return (
    <SellerLayout
      currentStep={3}
      activeSidebarItem="registration"
      pageTitle="Neo Cloud Room Onboarding"
      userName="John Doe"
      userRole="Owner Account"
      userInitials="JD"
    >
      <LegalDocuments
        onContinue={handleContinue}
        onBack={handleBack}
      />
    </SellerLayout>
  );
}
