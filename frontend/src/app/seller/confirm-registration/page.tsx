"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  SellerLayout,
  ConfirmRegistration,
  ConfirmRegistrationData,
} from "@/components/seller";
import { getSellerRegistrationDraft } from "@/utils/sellerRegistrationDraft";

export default function ConfirmRegistrationPage() {
  const router = useRouter();
  const [confirmData, setConfirmData] = useState<ConfirmRegistrationData>(() => {
    const draft = getSellerRegistrationDraft();
    return {
      account: {
        ownerName: draft.account.ownerName,
        email: draft.account.email,
        phone: draft.account.phone ? `+91 ${draft.account.phone}` : "",
        sellerRole: draft.account.sellerRole,
      },
      business: {
        name: draft.business.businessName,
        type: draft.business.sellerType,
        cuisines: draft.business.categories.join(", "),
        address: draft.business.address,
      },
      documents: {
        identityProof: draft.documents.identityProofFile || "Identity Proof (Aadhaar/PAN)",
        fssaiLicense: draft.documents.fssaiLicenseFile || "FSSAI License",
        electricityBill: draft.documents.utilityBillFile || "Electricity Bill",
        bankAccountNumber: draft.documents.bankAccountNumber,
        ifscCode: draft.documents.ifscCode,
      },
      media: {
        photosCount: draft.media.photosCount,
        previewThumbnails: draft.media.previewThumbnails,
      },
    };
  });

  useEffect(() => {
    const draft = getSellerRegistrationDraft();
    setConfirmData({
      account: {
        ownerName: draft.account.ownerName,
        email: draft.account.email,
        phone: draft.account.phone ? `+91 ${draft.account.phone}` : "",
        sellerRole: draft.account.sellerRole,
      },
      business: {
        name: draft.business.businessName,
        type: draft.business.sellerType,
        cuisines: draft.business.categories.join(", "),
        address: draft.business.address,
      },
      documents: {
        identityProof: draft.documents.identityProofFile || "Identity Proof (Aadhaar/PAN)",
        fssaiLicense: draft.documents.fssaiLicenseFile || "FSSAI License",
        electricityBill: draft.documents.utilityBillFile || "Electricity Bill",
        bankAccountNumber: draft.documents.bankAccountNumber,
        ifscCode: draft.documents.ifscCode,
      },
      media: {
        photosCount: draft.media.photosCount,
        previewThumbnails: draft.media.previewThumbnails,
      },
    });
  }, []);

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
      <ConfirmRegistration
        data={confirmData}
        onSubmit={handleSubmit}
        onBack={handleBack}
      />
    </SellerLayout>
  );
}
