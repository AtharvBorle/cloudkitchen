"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  SellerLayout,
  BusinessInformation,
  BusinessInformationData,
} from "@/components/seller";

export default function BusinessInformationPage() {
  const router = useRouter();
  const [businessData, setBusinessData] = useState<BusinessInformationData>({
    businessName: "Neo Kitchens",
    sellerType: "FOOD",
    categories: ["North Indian", "Biryani"],
    foodType: "BOTH",
    address: "12, 1st Floor, Cloud Hub, HSR Layout, Sector 6, Bangalore - 560102",
  });

  const handleContinue = (data: BusinessInformationData) => {
    setBusinessData(data);
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
      userName="John Doe"
      userRole="Owner Account"
      userInitials="JD"
    >
      <BusinessInformation
        initialData={businessData}
        onContinue={handleContinue}
        onBack={handleBack}
      />
    </SellerLayout>
  );
}
