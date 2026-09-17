"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  SellerLayout,
  BusinessInformation,
  BusinessInformationData,
} from "@/components/seller";
import {
  getSellerRegistrationDraft,
  saveSellerRegistrationDraft,
} from "@/utils/sellerRegistrationDraft";

export default function BusinessInformationPage() {
  const router = useRouter();
  const [businessData, setBusinessData] = useState<BusinessInformationData>(() => {
    return getSellerRegistrationDraft().business;
  });

  useEffect(() => {
    setBusinessData(getSellerRegistrationDraft().business);
  }, []);

  const handleContinue = (data: BusinessInformationData) => {
    setBusinessData(data);
    saveSellerRegistrationDraft({ business: data });
    router.push("/seller/legal-documents");
  };

  const handleBack = () => {
    router.push("/seller/account-information");
  };

  return (
    <SellerLayout
      currentStep={2}
      activeSidebarItem="registration"
      pageTitle="Neo Cloud Room Onboarding"
    >
      <BusinessInformation
        key={businessData.businessName + businessData.sellerType + businessData.categories.join(",")}
        initialData={businessData}
        onContinue={handleContinue}
        onBack={handleBack}
      />
    </SellerLayout>
  );
}
