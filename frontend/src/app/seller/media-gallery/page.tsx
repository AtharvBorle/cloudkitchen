"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  SellerLayout,
  MediaGallery,
} from "@/components/seller";

export default function MediaGalleryPage() {
  const router = useRouter();

  const handleContinue = () => {
    router.push("/seller/confirm-registration");
  };

  const handleBack = () => {
    router.push("/seller/legal-documents");
  };

  return (
    <SellerLayout
      currentStep={4}
      activeSidebarItem="registration"
      pageTitle="Neo Cloud Room Onboarding"
      userName="John Doe"
      userRole="Owner Account"
      userInitials="JD"
    >
      {/* 5-Step Stepper Wizard (Step 4 Active, Steps 1, 2, 3 Completed with Orange Tick) */}
      <MediaGallery
        onContinue={handleContinue}
        onBack={handleBack}
      />
    </SellerLayout>
  );
}
