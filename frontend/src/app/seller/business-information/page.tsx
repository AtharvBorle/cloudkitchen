"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  SellerLayout,
  BusinessInformation,
  BusinessInformationData,
} from "@/components/seller";
import { getSellerDraft, saveSellerDraft } from "@/lib/seller-registration-store";

function BusinessInfoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFromReview = searchParams?.get("from") === "review";

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
      categories:
        draft.categories && draft.categories.length > 0
          ? draft.categories
          : ["North Indian", "Biryani"],
      foodType: draft.foodType || "BOTH",
      address: draft.address || "",
      city: draft.city || "Pune",
      pincode: draft.pincode || "411038",
      locationCoordinates: draft.locationCoordinates || { lat: 18.5204, lng: 73.8567 },
      isLocationPinned: draft.isLocationPinned ?? true,
    });
  }, []);

  const handleContinue = (data: BusinessInformationData) => {
    saveSellerDraft({
      businessName: data.businessName,
      sellerType: data.sellerType as any,
      categories: data.categories,
      foodType: data.foodType as any,
      address: data.address,
      city: data.city,
      pincode: data.pincode,
      locationCoordinates: data.locationCoordinates,
      isLocationPinned: data.isLocationPinned,
    });
    if (isFromReview) {
      router.push("/seller/confirm-registration");
    } else {
      router.push("/seller/legal-documents");
    }
  };

  const handleBack = () => {
    if (isFromReview) {
      router.push("/seller/confirm-registration");
    } else {
      router.push("/seller/account-information");
    }
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

export default function BusinessInformationPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>}>
      <BusinessInfoContent />
    </Suspense>
  );
}
