"use client";

import React, { Suspense, useState, useEffect } from "react";
import ResSellerProfile from "@/components/seller/seller-profile/responsive/ResSellerProfile";
import { fetchApi } from "@/lib/fetch-api";

function ProfileContent() {
  const [profileData, setProfileData] = useState<any | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const res = await fetchApi("/api/seller/profile");
        if (res.ok) {
          const data = await res.json();
          const d = data.data || data;
          if (isMounted) setProfileData(d);
        }
      } catch (err) {
        console.error("Failed to load seller profile:", err);
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveProfile = async (formDataPayload: any) => {
    try {
      const formData = new FormData();
      if (formDataPayload.ownerName) formData.append("name", formDataPayload.ownerName);
      if (formDataPayload.mobileNumber) formData.append("phone", formDataPayload.mobileNumber);
      if (formDataPayload.outletName) formData.append("businessName", formDataPayload.outletName);
      if (formDataPayload.registeredAddress) formData.append("infoAddress", formDataPayload.registeredAddress);

      await fetchApi("/api/seller/profile", {
        method: "PATCH",
        body: formData,
      });
    } catch (err) {
      console.error("Failed to save profile:", err);
    }
  };

  const user = profileData?.user;
  const prof = profileData?.profile;

  return (
    <ResSellerProfile
      initialOwnerName={user?.name || "John Doe"}
      initialMobileNumber={user?.phone || "+91 98887 76655"}
      initialPrimaryEmail={user?.email || "john.doe@neocloudroom.com"}
      initialOutletName={prof?.businessName || "Neo Cloud Room - Bangalore Central Hub"}
      initialRegisteredAddress={`${prof?.addressFlat || ""} ${prof?.addressLocality || ""} ${user?.city || ""}`.trim() || "45, 1st Main Rd, Koramangala 4th Block, Bangalore, Karnataka 560034"}
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

