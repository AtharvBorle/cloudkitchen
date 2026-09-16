"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  SellerLayout,
  AccountInformation,
  AccountInformationData,
} from "@/components/seller";
import { getSellerDraft, saveSellerDraft } from "@/lib/seller-registration-store";

export default function AccountInformationPage() {
  const router = useRouter();
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
    router.push("/seller/business-information");
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
