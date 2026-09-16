"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  SellerLayout,
  LegalDocuments,
  LegalDocumentsData,
} from "@/components/seller";
import { getSellerDraft, saveSellerDraft } from "@/lib/seller-registration-store";

export default function LegalDocumentsPage() {
  const router = useRouter();
  const [initialDocs, setInitialDocs] = useState<Partial<LegalDocumentsData>>({
    identityProofFile: "",
    identityProofDataUrl: "",
    fssaiLicenseFile: "",
    fssaiLicenseDataUrl: "",
    utilityBillFile: "",
    utilityBillDataUrl: "",
    bankAccountNumber: "",
    ifscCode: "",
  });

  useEffect(() => {
    const draft = getSellerDraft();
    setInitialDocs({
      identityProofFile: draft.identityProofFileName || "",
      identityProofDataUrl: draft.identityProofDataUrl || "",
      fssaiLicenseFile: draft.fssaiLicenseFileName || "",
      fssaiLicenseDataUrl: draft.fssaiLicenseDataUrl || "",
      utilityBillFile: draft.utilityBillFileName || "",
      utilityBillDataUrl: draft.utilityBillDataUrl || "",
      bankAccountNumber: draft.bankAccountNumber || "",
      ifscCode: draft.ifscCode || "",
    });
  }, []);

  const handleContinue = (data: LegalDocumentsData) => {
    saveSellerDraft({
      identityProofFileName: data.identityProofFile,
      identityProofDataUrl: data.identityProofDataUrl,
      fssaiLicenseFileName: data.fssaiLicenseFile,
      fssaiLicenseDataUrl: data.fssaiLicenseDataUrl,
      utilityBillFileName: data.utilityBillFile,
      utilityBillDataUrl: data.utilityBillDataUrl,
      bankAccountNumber: data.bankAccountNumber,
      ifscCode: data.ifscCode,
    });
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
        key={initialDocs.bankAccountNumber || "docs-init"}
        initialData={initialDocs}
        onContinue={handleContinue}
        onBack={handleBack}
      />
    </SellerLayout>
  );
}
