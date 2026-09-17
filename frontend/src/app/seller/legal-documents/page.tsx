"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  SellerLayout,
  LegalDocuments,
  LegalDocumentsData,
} from "@/components/seller";
import {
  getSellerRegistrationDraft,
  saveSellerRegistrationDraft,
} from "@/utils/sellerRegistrationDraft";

export default function LegalDocumentsPage() {
  const router = useRouter();
  const [legalData, setLegalData] = useState<LegalDocumentsData>(() => {
    return getSellerRegistrationDraft().documents;
  });

  useEffect(() => {
    setLegalData(getSellerRegistrationDraft().documents);
  }, []);

  const handleContinue = (data: LegalDocumentsData) => {
    setLegalData(data);
    saveSellerRegistrationDraft({ documents: data });
    router.push("/seller/media-gallery");
  };

  const handleBack = () => {
    router.push("/seller/business-information");
  };

  return (
    <SellerLayout
      currentStep={3}
      activeSidebarItem="registration"
      pageTitle="Neo Cloud Room Onboarding"
    >
      <LegalDocuments
        key={legalData.bankAccountNumber + legalData.ifscCode + (legalData.identityProofFile || "") + (legalData.fssaiLicenseFile || "") + (legalData.utilityBillFile || "")}
        initialData={legalData}
        onContinue={handleContinue}
        onBack={handleBack}
      />
    </SellerLayout>
  );
}
