"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  SellerLayout,
  LegalDocuments,
  LegalDocumentsData,
} from "@/components/seller";
import { getSellerDraft, saveSellerDraft } from "@/lib/seller-registration-store";

function LegalDocumentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFromReview = searchParams?.get("from") === "review";

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
    if (isFromReview) {
      router.push("/seller/confirm-registration");
    } else {
      router.push("/seller/media-gallery");
    }
  };

  const handleBack = () => {
    if (isFromReview) {
      router.push("/seller/confirm-registration");
    } else {
      router.push("/seller/business-information");
    }
  };

  return (
    <SellerLayout
      currentStep={3}
      activeSidebarItem="registration"
      pageTitle="Neo Cloud Room Onboarding"
    >
      <LegalDocuments
        key={initialDocs.bankAccountNumber + (initialDocs.ifscCode || "") + (initialDocs.identityProofFile || "") || "docs-init"}
        initialData={initialDocs}
        onContinue={handleContinue}
        onBack={handleBack}
      />
    </SellerLayout>
  );
}

export default function LegalDocumentsPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>}>
      <LegalDocumentsContent />
    </Suspense>
  );
}
