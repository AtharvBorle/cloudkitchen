"use client";

import React, { useState } from "react";
import SellerSidebar from "./Sidebar";
import Topbar from "./Topbar";
import MainCanvas, { SellerProfileData } from "./MainCanvas";

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
  onSave,
  onLogout,
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

  const handleDataChange = (data: SellerProfileData) => {
    setProfileData(data);
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
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
          minHeight: "100vh",
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

        {/* Main Canvas Component */}
        <MainCanvas
          formData={profileData}
          headerTitle={headerTitle}
          headerDescription={headerDescription}
          onSave={onSave}
          onLogout={onLogout}
          onDataChange={handleDataChange}
        />
      </div>
    </div>
  );
}
