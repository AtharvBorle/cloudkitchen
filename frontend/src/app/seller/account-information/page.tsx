"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  SellerLayout,
  AccountInformation,
  AccountInformationData,
} from "@/components/seller";
import {
  getSellerRegistrationDraft,
  saveSellerRegistrationDraft,
} from "@/utils/sellerRegistrationDraft";

export default function AccountInformationPage() {
  const router = useRouter();
  const [accountData, setAccountData] = useState<AccountInformationData>(() => {
    return getSellerRegistrationDraft().account;
  });

  useEffect(() => {
    setAccountData(getSellerRegistrationDraft().account);
  }, []);

  const handleContinue = (data: AccountInformationData) => {
    setAccountData(data);
    saveSellerRegistrationDraft({ account: data });
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
        key={accountData.ownerName + accountData.email + accountData.phone}
        initialData={accountData}
        onContinue={handleContinue}
      />
    </SellerLayout>
  );
}
