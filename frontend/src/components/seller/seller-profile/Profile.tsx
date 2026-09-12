"use client";

import React, { useState, useEffect } from "react";
import { performLogout } from "@/lib/logout";
import SellerSidebar from "../sidebar/Sidebar";
import Topbar from "../nav/Topbar";
import MainCanvas, { SellerProfileData } from "./MainCanvas";
import { fetchApi } from "@/lib/fetch-api";
import { useSellerProfile, computeInitials } from "@/hooks/useSellerProfile";

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
  const [profileData, setProfileData] = useState<SellerProfileData>(() => ({
    ownerName: initialData?.ownerName || seller.ownerName,
    mobileNumber: initialData?.mobileNumber || seller.phone || "",
    email: initialData?.email || seller.email || "",
    outletName: initialData?.outletName || seller.businessName,
    registeredAddress: initialData?.registeredAddress || seller.address || "",
    partnerRole: initialData?.partnerRole || seller.partnerRole,
    avatarInitials: initialData?.avatarInitials || seller.avatarInitials,
  }));

  useEffect(() => {
    if (seller.ownerName) {
      setProfileData((prev) => {
        if (prev.ownerName && prev.ownerName !== "John Doe" && prev.ownerName !== "Kitchen Owner") return prev;
        return {
          ...prev,
          ownerName: seller.ownerName,
          email: seller.email || prev.email,
          mobileNumber: seller.phone || prev.mobileNumber,
          outletName: seller.businessName || prev.outletName,
          registeredAddress: seller.address || prev.registeredAddress,
          avatarInitials: seller.avatarInitials,
        };
      });
    }
  }, [seller.ownerName, seller.email, seller.phone, seller.businessName, seller.address, seller.avatarInitials]);

  useEffect(() => {
    async function loadSellerProfile() {
      try {
        const res = await fetchApi("/api/seller/profile");
        if (res.ok) {
          const data = await res.json();
          const user = data.data?.user || data.user;
          const profile = data.data?.profile || data.profile;
          if (user) {
            const name = user.name || "Seller Partner";
            const initials = computeInitials(name);

            setProfileData((prev) => ({
              ...prev,
              ownerName: name,
              email: user.email || prev.email,
              mobileNumber: user.phone || prev.mobileNumber,
              outletName: profile?.businessName || prev.outletName,
              registeredAddress:
                profile?.addressLocality ||
                `${profile?.addressFlat ? profile.addressFlat + ", " : ""}${profile?.addressLocality || ""}` ||
                user?.city ||
                prev.registeredAddress,
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
    if (customOnSave) {
      customOnSave(data);
      return;
    }
    try {
      await fetchApi("/api/seller/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerName: data.ownerName,
          mobileNumber: data.mobileNumber,
          outletName: data.outletName,
          registeredAddress: data.registeredAddress,
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
          ownerName={profileData.ownerName}
          partnerRole={profileData.partnerRole}
          avatarInitials={profileData.avatarInitials}
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
