"use client";

import React, { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import SellerSidebar from "../sidebar/Sidebar";
import Topbar from "../nav/Topbar";
import MainCanvas, { SellerProfileData } from "./MainCanvas";
import { fetchApi } from "@/lib/fetch-api";

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
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [profileData, setProfileData] = useState<SellerProfileData>({
    ownerName: initialData?.ownerName || "John Doe",
    mobileNumber: initialData?.mobileNumber || "+91 99887 76655",
    email: initialData?.email || "john.doe@neocloudroom.com",
    outletName: initialData?.outletName || "Neo Cloud Room - Bangalore Central Hub",
    registeredAddress:
      initialData?.registeredAddress ||
      "45, 1st Main Rd, Koramangala 4th Block, Bangalore, Karnataka 560034",
    partnerRole: initialData?.partnerRole || "Neo Cloud Partner",
    avatarInitials: initialData?.avatarInitials || "JD",
  });

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
            const initials = name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2) || "SP";

            setProfileData((prev) => ({
              ...prev,
              ownerName: name,
              email: user.email || prev.email,
              mobileNumber: user.phone || prev.mobileNumber,
              outletName: profile?.businessName || prev.outletName,
              registeredAddress:
                profile?.addressLocality ||
                `${profile?.addressFlat ? profile.addressFlat + ", " : ""}${profile?.addressLocality || ""}` ||
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
    signOut({ callbackUrl: "/seller/login" });
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
