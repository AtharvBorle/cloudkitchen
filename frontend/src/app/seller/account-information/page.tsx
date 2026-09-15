"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  SellerLayout,
  AccountInformation,
  AccountInformationData,
} from "@/components/seller";

export default function AccountInformationPage() {
  const router = useRouter();
  const [accountData, setAccountData] = useState<AccountInformationData>({
    ownerName: "",
    email: "",
    phone: "",
    password: "",
    sellerRole: "",
  });

  const handleContinue = (data: AccountInformationData) => {
    setAccountData(data);
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
        initialData={accountData}
        onContinue={handleContinue}
      />
    </SellerLayout>
  );
}
