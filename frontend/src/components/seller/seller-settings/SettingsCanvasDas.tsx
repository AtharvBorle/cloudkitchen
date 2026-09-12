"use client";

import React, { useState } from "react";
import SellerSidebar from "../sidebar/Sidebar";
import Topbar from "../nav/Topbar";
import SettingsCanvas, { SettingsCanvasProps, SettingsFormData } from "./SettingsCanvas";
import { useSellerProfile } from "@/hooks/useSellerProfile";

export interface SettingsCanvasDasProps {
  topbarTitle?: string;
  searchPlaceholder?: string;
  ownerName?: string;
  partnerRole?: string;
  avatarInitials?: string;
  activeSidebarId?: string;
  initialData?: Partial<SettingsFormData>;
  onSave?: (data: SettingsFormData) => void;
  onCancel?: () => void;
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
}

export default function SettingsCanvasDas({
  topbarTitle = "Owner Operations Console",
  searchPlaceholder = "Search order, room, dish...",
  ownerName: initialOwnerName,
  partnerRole: initialPartnerRole,
  avatarInitials: initialAvatarInitials,
  activeSidebarId = "settings",
  initialData,
  onSave,
  onCancel,
  onSearch,
  onNotificationClick,
}: SettingsCanvasDasProps) {
  const seller = useSellerProfile();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const ownerName = initialOwnerName || seller.ownerName;
  const partnerRole = initialPartnerRole || seller.partnerRole;
  const avatarInitials = initialAvatarInitials || seller.avatarInitials;

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
      className="settings-canvas-das-layout"
    >
      {/* 1. Left Side Menu Component */}
      <SellerSidebar
        activeItemId={activeSidebarId}
        isMobileOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        ownerName={ownerName}
        partnerRole={partnerRole}
        avatarInitials={avatarInitials}
      />

      {/* 2. Main Area (Topbar + Settings Canvas) */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          backgroundColor: "#F7F8FB",
        }}
        className="settings-main-wrapper"
      >
        {/* Topbar Component */}
        <Topbar
          title={topbarTitle}
          searchPlaceholder={searchPlaceholder}
          ownerName={ownerName}
          partnerRole={partnerRole}
          avatarInitials={avatarInitials}
          onSearch={onSearch}
          onNotificationClick={onNotificationClick}
          onMenuToggle={() => setIsMobileOpen((prev) => !prev)}
        />

        {/* Settings Canvas */}
        <main
          style={{
            flex: 1,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            boxSizing: "border-box",
            backgroundColor: "#F7F8FB",
          }}
          className="settings-canvas-container"
        >
          <React.Suspense fallback={<div style={{ padding: "32px", color: "#64748B" }}>Loading settings...</div>}>
            <SettingsCanvas
              initialData={initialData}
              onSave={onSave}
              onCancel={onCancel}
            />
          </React.Suspense>
        </main>
      </div>
    </div>
  );
}
