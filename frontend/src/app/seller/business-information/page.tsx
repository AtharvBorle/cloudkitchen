"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  SellerLayout,
  BusinessInformation,
  BusinessInformationData,
} from "@/components/seller";
import { getSellerDraft, saveSellerDraft } from "@/lib/seller-registration-store";

export default function BusinessInformationPage() {
  const router = useRouter();
  const [businessData, setBusinessData] = useState<BusinessInformationData>({
    businessName: "",
    sellerType: "FOOD",
    categories: ["North Indian", "Biryani"],
    foodType: "BOTH",
    address: "",
    locationCoordinates: { lat: 18.5204, lng: 73.8567 },
    isLocationPinned: false,
  });

  useEffect(() => {
    const draft = getSellerDraft();
    setBusinessData({
      businessName: draft.businessName || "",
      sellerType: draft.sellerType || "FOOD",
      categories: draft.categories && draft.categories.length > 0 ? draft.categories : ["North Indian", "Biryani"],
      foodType: draft.foodType || "BOTH",
      address: draft.address || "",
      locationCoordinates: draft.locationCoordinates || { lat: 18.5204, lng: 73.8567 },
      isLocationPinned: draft.isLocationPinned ?? false,
    });
  }, []);

  const handleContinue = (data: BusinessInformationData) => {
    saveSellerDraft({
      businessName: data.businessName,
      sellerType: data.sellerType as any,
      categories: data.categories,
      foodType: data.foodType as any,
      address: data.address,
      locationCoordinates: data.locationCoordinates,
      isLocationPinned: data.isLocationPinned,
    });
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
        key={businessData.businessName || "business-init"}
        initialData={businessData}
        onContinue={handleContinue}
        onBack={handleBack}
      />
    </SellerLayout>
  );
}
