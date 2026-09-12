"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  SellerLayout,
  ConfirmRegistration,
} from "@/components/seller";

export default function ConfirmRegistrationPage() {
  const router = useRouter();

  const handleSubmit = () => {
    router.push("/seller/registration-submitted");
  };

  const handleBack = () => {
    router.push("/seller/media-gallery");
  };

  return (
    <SellerLayout
      currentStep={5}
      activeSidebarItem="registration"
      pageTitle="Neo Cloud Room Onboarding"
    >
      {/* 5-Step Stepper Wizard (Step 5 Active, Steps 1, 2, 3, 4 Completed with Orange Tick) */}
      <ConfirmRegistration
        onSubmit={handleSubmit}
        onBack={handleBack}
      />
    </SellerLayout>
  );
}
