"use client";

import React, { Suspense, useState, useEffect } from "react";
import ResSellerProfile from "@/components/seller/seller-profile/responsive/ResSellerProfile";
import { fetchApi } from "@/lib/fetch-api";

import { useSellerProfile } from "@/hooks/useSellerProfile";

function ProfileContent() {
  const seller = useSellerProfile();

  const handleSaveProfile = async (formDataPayload: any) => {
    try {
      const formData = new FormData();
      if (formDataPayload.ownerName) formData.append("name", formDataPayload.ownerName);
      if (formDataPayload.mobileNumber) formData.append("phone", formDataPayload.mobileNumber);
      if (formDataPayload.primaryEmail || formDataPayload.email) formData.append("email", formDataPayload.primaryEmail || formDataPayload.email);
      if (formDataPayload.outletName) formData.append("businessName", formDataPayload.outletName);
      if (formDataPayload.registeredAddress) formData.append("infoAddress", formDataPayload.registeredAddress);
      if (formDataPayload.upiId !== undefined) formData.append("upiId", formDataPayload.upiId);

      await fetchApi("/api/seller/profile", {
        method: "PATCH",
        body: formData,
      });
    } catch (err) {
      console.error("Failed to save profile:", err);
    }
  };

  return (
    <ResSellerProfile
      initialOwnerName={seller.ownerName}
      initialMobileNumber={seller.phone}
      initialPrimaryEmail={seller.email}
      initialOutletName={seller.businessName}
      initialRegisteredAddress={seller.address}
      initialUpiId={seller.upiId || (seller.profile as any)?.upiId || ""}
      initialTrackingId={seller.trackingId || (seller.profile as any)?.trackingId || ""}
      onSaveProfile={handleSaveProfile}
    />
  );
}

export default function ResponsiveSellerProfilePage() {
  return (
    <Suspense fallback={<div>Loading profile...</div>}>
      <ProfileContent />
    </Suspense>
  );
}

