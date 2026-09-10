"use client";

import React, { useState } from "react";
import SellerSidebar from "../sidebar/Sidebar";
import Topbar from "../nav/Topbar";
import SettingsCanvas, { SettingsCanvasProps, SettingsFormData } from "./SettingsCanvas";

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
  ownerName = "John Doe",
  partnerRole = "Neo Cloud Partner",
  avatarInitials = "JD",
  activeSidebarId = "settings",
  initialData,
  onSave,
  onCancel,
  onSearch,
  onNotificationClick,
}: SettingsCanvasDasProps) {
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
      className="settings-canvas-das-layout"
    >
      {/* 1. Left Side Menu Component */}
      <SellerSidebar
        activeItemId={activeSidebarId}
        isMobileOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
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
          <SettingsCanvas
            initialData={initialData}
            onSave={onSave}
            onCancel={onCancel}
          />
        </main>
      </div>
    </div>
  );
}
