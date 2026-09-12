"use client";

import React, { useState } from "react";
import SellerSidebar from "../sidebar/Sidebar";
import Topbar from "../nav/Topbar";
import RoomConfigCanvas, {
  RoomConfigCanvasProps,
  RoomConfigData,
} from "./RoomConfigCanvas";

import { useSellerProfile } from "@/hooks/useSellerProfile";

export interface RoomConfigCanvasDasProps extends RoomConfigCanvasProps {
  topbarTitle?: string;
  searchPlaceholder?: string;
  ownerName?: string;
  partnerRole?: string;
  avatarInitials?: string;
  activeSidebarId?: string;
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
}

export default function RoomConfigCanvasDas({
  topbarTitle = "Owner Operations Console",
  searchPlaceholder = "Search order, room, booking...",
  ownerName,
  partnerRole,
  avatarInitials,
  activeSidebarId = "rooms",
  onSearch,
  onNotificationClick,
  ...canvasProps
}: RoomConfigCanvasDasProps) {
  const seller = useSellerProfile();
  const effectiveOwnerName = ownerName && ownerName !== "John Doe" ? ownerName : seller.ownerName;
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
        fontFamily:
          "var(--font-poppins), 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
      className="room-config-canvas-das-layout"
    >
      {/* 1. Left Sidebar Component */}
      <SellerSidebar
        activeItemId={activeSidebarId}
        isMobileOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        ownerName={ownerName}
        partnerRole={partnerRole}
        avatarInitials={avatarInitials}
      />

      {/* 2. Right Main Area */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          backgroundColor: "#F7F8FB",
        }}
        className="room-config-canvas-main-wrapper"
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

        {/* RoomConfigCanvas Main Body */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <React.Suspense fallback={<div style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>Loading Room Configurator...</div>}>
            <RoomConfigCanvas {...canvasProps} />
          </React.Suspense>
        </div>
      </div>
    </div>
  );
}
