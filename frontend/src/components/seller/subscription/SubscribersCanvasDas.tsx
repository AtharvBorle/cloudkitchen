"use client";

import React, { useState } from "react";
import SellerSidebar from "../sidebar/Sidebar";
import Topbar from "../nav/Topbar";
import SubscribersCanvas from "./SubscribersCanvas";
import { useSellerProfile } from "@/hooks/useSellerProfile";

export interface SubscribersCanvasDasProps {
  topbarTitle?: string;
  searchPlaceholder?: string;
  searchQuery?: string;
  ownerName?: string;
  partnerRole?: string;
  avatarInitials?: string;
  activeSidebarId?: string;
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
}

export default function SubscribersCanvasDas({
  topbarTitle = "Owner Operations Console",
  searchPlaceholder = "Search subscribers by name, mobile, address, plan, date, amount, or status...",
  searchQuery: externalSearchQuery,
  ownerName: initialOwnerName,
  partnerRole: initialPartnerRole,
  avatarInitials: initialAvatarInitials,
  activeSidebarId = "subscription",
  onSearch: externalOnSearch,
  onNotificationClick,
}: SubscribersCanvasDasProps) {
  const seller = useSellerProfile();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery || "");

  React.useEffect(() => {
    if (externalSearchQuery !== undefined) {
      setSearchQuery(externalSearchQuery);
    }
  }, [externalSearchQuery]);

  const ownerName = initialOwnerName || seller.ownerName;
  const partnerRole = initialPartnerRole || seller.partnerRole;
  const avatarInitials = initialAvatarInitials || seller.avatarInitials;

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (externalOnSearch) externalOnSearch(query);
  };

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
      className="subscribers-canvas-das-layout"
    >
      {/* 1. Left Sidebar Component with active Subscription tab */}
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
        className="subscribers-canvas-main-wrapper"
      >
        {/* Topbar Component */}
        <Topbar
          title={topbarTitle}
          searchPlaceholder={searchPlaceholder}
          searchQuery={searchQuery}
          ownerName={ownerName}
          partnerRole={partnerRole}
          avatarInitials={avatarInitials}
          onSearch={handleSearch}
          onNotificationClick={onNotificationClick}
          onMenuToggle={() => setIsMobileOpen((prev) => !prev)}
        />

        {/* SubscribersCanvas Main Body */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <SubscribersCanvas searchQuery={searchQuery} onSearchChange={handleSearch} />
        </div>
      </div>
    </div>
  );
}
