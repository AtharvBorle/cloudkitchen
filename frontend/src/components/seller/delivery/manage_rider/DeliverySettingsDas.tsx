"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import SellerSidebar from "../../sidebar/Sidebar";
import Topbar from "../../nav/Topbar";
import ResponsiveDeliverySettings from "../responsive/ResponsiveDeliverySettings";
import { useSellerProfile, isGenericFallbackName } from "@/hooks/useSellerProfile";

export interface DeliverySettingsDasProps {
  topbarTitle?: string;
  searchPlaceholder?: string;
  ownerName?: string;
  partnerRole?: string;
  avatarInitials?: string;
  activeSidebarId?: string;
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
}

export default function DeliverySettingsDas({
  topbarTitle = "Delivery & Rates Configuration",
  searchPlaceholder = "Search delivery settings, fees, radius...",
  ownerName,
  partnerRole,
  avatarInitials,
  activeSidebarId = "delivery",
  onSearch,
  onNotificationClick,
}: DeliverySettingsDasProps) {
  const router = useRouter();
  const seller = useSellerProfile();
  const effectiveOwnerName = ownerName && !isGenericFallbackName(ownerName) ? ownerName : (!isGenericFallbackName(seller.ownerName) ? seller.ownerName : "");
  const effectivePartnerRole = partnerRole || seller.partnerRole;
  const effectiveAvatarInitials = avatarInitials && avatarInitials !== "JD" ? avatarInitials : seller.avatarInitials;

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        alignItems: "flex-start",
        backgroundColor: "#F7F8FB",
        fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
      }}
      className="delivery-settings-das-layout"
    >
      {/* 1. Left Sidebar Navigation */}
      <SellerSidebar
        activeItemId={activeSidebarId}
        isMobileOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        ownerName={ownerName}
        partnerRole={partnerRole}
        avatarInitials={avatarInitials}
      />

      {/* 2. Main Area (Topbar + Settings Content) */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          backgroundColor: "#F7F8FB",
        }}
        className="delivery-settings-main-wrapper"
      >
        {/* Topbar Component */}
        <Topbar
          title={topbarTitle}
          searchPlaceholder={searchPlaceholder}
          ownerName={effectiveOwnerName}
          partnerRole={effectivePartnerRole}
          avatarInitials={effectiveAvatarInitials}
          onSearch={onSearch}
          onNotificationClick={onNotificationClick}
          onMenuToggle={() => setIsMobileOpen((prev) => !prev)}
        />

        {/* Content Area */}
        <main
          style={{
            flex: 1,
            width: "100%",
            backgroundColor: "#F7F8FB",
            boxSizing: "border-box",
            display: "flex",
            justifyContent: "center",
            padding: "24px 16px",
          }}
        >
          <div style={{ width: "100%", maxWidth: "600px" }}>
            <ResponsiveDeliverySettings onBack={() => router.push("/seller/delivery")} />
          </div>
        </main>
      </div>
    </div>
  );
}
