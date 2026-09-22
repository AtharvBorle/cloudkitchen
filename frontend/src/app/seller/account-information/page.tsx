"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  SellerLayout,
  AccountInformation,
  AccountInformationData,
} from "@/components/seller";
import { getSellerDraft, saveSellerDraft } from "@/lib/seller-registration-store";

function AccountInfoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFromReview = searchParams?.get("from") === "review";

  const [accountData, setAccountData] = useState<AccountInformationData>({
    ownerName: "",
    email: "",
    phone: "",
    password: "",
    sellerRole: "Owner",
  });

  useEffect(() => {
    const draft = getSellerDraft();
    setAccountData({
      ownerName: draft.ownerName || "",
      email: draft.email || "",
      phone: draft.phone || "",
      password: draft.password || "",
      sellerRole: draft.sellerRole || "Owner",
    });
  }, []);

  const handleContinue = (data: AccountInformationData) => {
    saveSellerDraft(data);
    if (isFromReview) {
      router.push("/seller/confirm-registration");
    } else {
      router.push("/seller/business-information");
    }
  };

  return (
    <SellerLayout
      currentStep={1}
      activeSidebarItem="registration"
      pageTitle="Neo Cloud Room Onboarding"
      userName={accountData.ownerName || undefined}
      userRole="Owner Account"
    >
      <AccountInformation
        key={accountData.email || "account-init"}
        initialData={accountData}
        onContinue={handleContinue}
      />
    </SellerLayout>
  );
}

export default function AccountInformationPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>}>
      <AccountInfoContent />
    </Suspense>
  );
}
