"use client";

import React, { useState } from "react";
import SellerSidebar from "../../sidebar/Sidebar";
import Topbar from "../../nav/Topbar";
import RiderCanvas, {
  RiderCanvasProps,
  RiderSummaryMetric,
  RiderWalletRecord,
} from "./RiderCanvas";

export interface RiderCanvasDasProps {
  topbarTitle?: string;
  searchPlaceholder?: string;
  ownerName?: string;
  partnerRole?: string;
  avatarInitials?: string;
  activeSidebarId?: string;
  metrics?: RiderSummaryMetric[];
  riders?: RiderWalletRecord[];
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
  onViewWallet?: (rider: RiderWalletRecord) => void;
}

export default function RiderCanvasDas({
  topbarTitle = "Owner Operations Console",
  searchPlaceholder = "Search order, room, booking...",
  ownerName = "John Doe",
  partnerRole = "Neo Cloud Partner",
  avatarInitials = "JD",
  activeSidebarId = "delivery",
  metrics,
  riders,
  onSearch,
  onNotificationClick,
  onViewWallet,
}: RiderCanvasDasProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        backgroundColor: "#F7F8FB",
        fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
      }}
      className="rider-canvas-das-layout"
    >
      {/* 1. Left Sidebar Component (Width: 240px, Active Item: Delivery) */}
      <SellerSidebar
        activeItemId={activeSidebarId}
        isMobileOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
      />

      {/* 2. Right Main Area (Width: 1200px / Flex 1) */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          backgroundColor: "#F7F8FB",
        }}
        className="rider-main-wrapper"
      >
        {/* Topbar Component (Height: 64px) */}
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

        {/* Rider Canvas Component (1200px Canvas containing Header, Metrics & Table) */}
        <RiderCanvas
          metrics={metrics}
          riders={riders}
          onViewWallet={onViewWallet}
        />
      </div>
    </div>
  );
}
