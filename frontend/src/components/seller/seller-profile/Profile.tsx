"use client";

import React, { useState, useEffect } from "react";
import { performLogout } from "@/lib/logout";
import SellerSidebar from "../sidebar/Sidebar";
import Topbar from "../nav/Topbar";
import MainCanvas, { SellerProfileData } from "./MainCanvas";
import { fetchApi } from "@/lib/fetch-api";
import { useSellerProfile, computeInitials, isGenericFallbackName, updateCachedProfile } from "@/hooks/useSellerProfile";

export interface SellerProfileProps {
  topbarTitle?: string;
  headerTitle?: string;
  headerDescription?: string;
  initialData?: Partial<SellerProfileData>;
  onSave?: (data: SellerProfileData) => void;
  onLogout?: () => void;
  onSearch?: (query: string) => void;
}

export default function Profile({
  topbarTitle = "Owner Operations Console",
  headerTitle = "Partner Profile Settings",
  headerDescription = "Manage operational credentials, personal contacts, and business workspace parameters.",
  initialData,
  onSave: customOnSave,
  onLogout: customOnLogout,
  onSearch,
}: SellerProfileProps) {
  const seller = useSellerProfile();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [profileData, setProfileData] = useState<SellerProfileData>(() => {
    const owner = initialData?.ownerName || (!isGenericFallbackName(seller.userFullName) ? seller.userFullName : "") || seller.ownerName;
    const outlet = initialData?.outletName || seller.businessName || seller.ownerName;
    return {
      ownerName: owner,
      mobileNumber: initialData?.mobileNumber || seller.phone || "",
      email: initialData?.email || seller.email || "",
      outletName: outlet,
      registeredAddress: initialData?.registeredAddress || seller.address || "",
      latitude: initialData?.latitude !== undefined ? initialData.latitude : (seller.latitude ?? null),
      longitude: initialData?.longitude !== undefined ? initialData.longitude : (seller.longitude ?? null),
      isLocationPinned: initialData?.isLocationPinned !== undefined ? initialData.isLocationPinned : (seller.isLocationPinned ?? false),
      upiId: initialData?.upiId || seller.upiId || (seller.profile as any)?.upiId || "",
      trackingId: initialData?.trackingId || seller.trackingId || (seller.profile as any)?.trackingId || "",
      partnerRole: initialData?.partnerRole || seller.partnerRole,
      avatarInitials: initialData?.avatarInitials || computeInitials(outlet || owner),
    };
  });

  useEffect(() => {
    if (seller.ownerName || seller.businessName) {
      setProfileData((prev) => {
        const outlet = prev.outletName && !isGenericFallbackName(prev.outletName)
          ? prev.outletName
          : (seller.businessName || seller.ownerName);
        const owner = prev.ownerName && !isGenericFallbackName(prev.ownerName)
          ? prev.ownerName
          : (seller.userFullName || seller.ownerName);
        return {
          ...prev,
          ownerName: owner,
          email: seller.email || prev.email,
          mobileNumber: seller.phone || prev.mobileNumber,
          outletName: outlet,
          registeredAddress: seller.address || prev.registeredAddress,
          latitude: seller.latitude !== undefined && seller.latitude !== null ? seller.latitude : prev.latitude,
          longitude: seller.longitude !== undefined && seller.longitude !== null ? seller.longitude : prev.longitude,
          isLocationPinned: seller.isLocationPinned ?? prev.isLocationPinned,
          upiId: seller.upiId || (seller.profile as any)?.upiId || prev.upiId || "",
          trackingId: seller.trackingId || (seller.profile as any)?.trackingId || prev.trackingId || "",
          avatarInitials: computeInitials(outlet || owner),
        };
      });
    }
  }, [seller.ownerName, seller.userFullName, seller.email, seller.phone, seller.businessName, seller.address, seller.latitude, seller.longitude, seller.isLocationPinned, seller.upiId, seller.trackingId]);

  useEffect(() => {
    async function loadSellerProfile() {
      try {
        const res = await fetchApi("/api/seller/profile");
        if (res.ok) {
          const data = await res.json();
          const user = data.data?.user || data.user;
          const profile = data.data?.profile || data.profile;
          if (user) {
            const rawUserName = user.name && !isGenericFallbackName(user.name) ? user.name : "";
            const outlet = profile?.businessName || rawUserName || user?.name || "Kitchen Owner";
            const owner = rawUserName || user.name || outlet;
            const initials = computeInitials(outlet);
            const lat = profile?.latitude !== undefined && profile?.latitude !== null ? Number(profile.latitude) : null;
            const lng = profile?.longitude !== undefined && profile?.longitude !== null ? Number(profile.longitude) : null;

            setProfileData((prev) => ({
              ...prev,
              ownerName: owner,
              email: user.email || prev.email,
              mobileNumber: user.phone || prev.mobileNumber,
              outletName: outlet,
              registeredAddress:
                profile?.addressLocality ||
                `${profile?.addressFlat ? profile.addressFlat + ", " : ""}${profile?.addressLocality || ""}` ||
                user?.city ||
                prev.registeredAddress,
              latitude: lat !== null ? lat : prev.latitude,
              longitude: lng !== null ? lng : prev.longitude,
              isLocationPinned: profile?.isLocationPinned ?? Boolean(lat && lng),
              upiId: profile?.upiId || prev.upiId || "",
              trackingId: profile?.trackingId || prev.trackingId || "",
              avatarInitials: initials,
            }));
          }
        }
      } catch (err) {
        console.error("Failed to load seller profile:", err);
      }
    }
    loadSellerProfile();
  }, []);

  const handleDataChange = (data: SellerProfileData) => {
    setProfileData(data);
  };

  const handleSave = async (data: SellerProfileData) => {
    const addr = data.registeredAddress || "";
    const cleanPin = data.pincode || addr.match(/\b\d{6}\b/)?.[0] || "";
    const cleanCity = data.city || "Pune";

    updateCachedProfile({
      ownerName: data.outletName || data.ownerName,
      businessName: data.outletName,
      userFullName: data.ownerName,
      email: data.email,
      phone: data.mobileNumber,
      address: data.registeredAddress,
      pincode: cleanPin,
      city: cleanCity,
      latitude: data.latitude,
      longitude: data.longitude,
      isLocationPinned: Boolean(data.latitude && data.longitude),
      upiId: data.upiId,
      trackingId: data.trackingId,
      avatarInitials: computeInitials(data.outletName || data.ownerName),
    });

    if (customOnSave) {
      customOnSave({ ...data, pincode: cleanPin, city: cleanCity });
      return;
    }
    try {
      await fetchApi("/api/seller/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerName: data.ownerName,
          mobileNumber: data.mobileNumber,
          email: data.email,
          outletName: data.outletName,
          registeredAddress: data.registeredAddress,
          pincode: cleanPin,
          city: cleanCity,
          latitude: data.latitude,
          longitude: data.longitude,
          isLocationPinned: Boolean(data.latitude && data.longitude),
          upiId: data.upiId,
        }),
      });
    } catch (err) {
      console.error("Failed to save seller profile:", err);
    }
  };

  const handleLogout = () => {
    if (customOnLogout) {
      customOnLogout();
      return;
    }
    performLogout({ role: "SELLER" });
  };

  const currentDisplayOutlet = profileData.outletName || seller.businessName || seller.ownerName;

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        maxHeight: "100vh",
        width: "100%",
        overflow: "hidden",
        backgroundColor: "#F7F8FB",
        fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
      }}
      className="seller-profile-container"
    >
      {/* 1. Left Sidebar Component */}
      <SellerSidebar
        activeItemId="profile"
        isMobileOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        ownerName={currentDisplayOutlet}
        partnerRole={profileData.partnerRole}
        avatarInitials={computeInitials(currentDisplayOutlet)}
      />

      {/* 2. Right Canvas Area calling Topbar and MainCanvas */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          maxHeight: "100vh",
          overflow: "hidden",
          backgroundColor: "#F7F8FB",
        }}
        className="seller-right-section"
      >
        {/* Standalone Topbar Component */}
        <Topbar
          title={topbarTitle}
          ownerName={currentDisplayOutlet}
          partnerRole={profileData.partnerRole}
          avatarInitials={computeInitials(currentDisplayOutlet)}
          onSearch={onSearch}
          onMenuToggle={() => setIsMobileOpen((prev) => !prev)}
        />

        {/* Main Canvas Component Scroll Area */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          <MainCanvas
            formData={profileData}
            headerTitle={headerTitle}
            headerDescription={headerDescription}
            onSave={handleSave}
            onLogout={handleLogout}
            onDataChange={handleDataChange}
          />
        </div>
      </div>
    </div>
  );
}
