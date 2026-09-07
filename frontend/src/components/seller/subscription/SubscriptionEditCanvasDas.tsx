"use client";

import React, { useState } from "react";
import SellerSidebar from "../sidebar/Sidebar";
import Topbar from "../nav/Topbar";
import SubscriptionEditCanvas, {
  SubscriptionEditCanvasProps,
  SubscriptionPlanData,
} from "./SubscriptionEditCanvas";

export interface SubscriptionEditCanvasDasProps extends SubscriptionEditCanvasProps {
  topbarTitle?: string;
  searchPlaceholder?: string;
  ownerName?: string;
  partnerRole?: string;
  avatarInitials?: string;
  activeSidebarId?: string;
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
}

export default function SubscriptionEditCanvasDas({
  topbarTitle = "Owner Operations Console",
  searchPlaceholder = "Search order, room, dish...",
  ownerName = "John Doe",
  partnerRole = "Neo Cloud Partner",
  avatarInitials = "JD",
  activeSidebarId = "subscription",
  onSearch,
  onNotificationClick,
  ...canvasProps
}: SubscriptionEditCanvasDasProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        backgroundColor: "#F7F8FB",
        fontFamily: "var(--font-poppins), 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
      className="subscription-edit-canvas-das-layout"
    >
      {/* 1. Left Sidebar Component */}
      <SellerSidebar
        activeItemId={activeSidebarId}
        isMobileOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
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
        className="subscription-edit-canvas-main-wrapper"
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

        {/* SubscriptionEditCanvas Main Body */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <SubscriptionEditCanvas {...canvasProps} />
        </div>
      </div>
    </div>
  );
}
