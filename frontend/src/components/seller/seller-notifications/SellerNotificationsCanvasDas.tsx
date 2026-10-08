"use client";

import React, { useState } from "react";
import SellerSidebar from "../sidebar/Sidebar";
import Topbar from "../nav/Topbar";
import SellerNotificationsCanvas, {
  SellerNotificationsCanvasProps,
} from "./SellerNotificationsCanvas";
import { SellerNotificationItem } from "./notificationData";
import { useSellerProfile } from "@/hooks/useSellerProfile";

export interface SellerNotificationsCanvasDasProps {
  topbarTitle?: string;
  searchPlaceholder?: string;
  searchQuery?: string;
  ownerName?: string;
  partnerRole?: string;
  avatarInitials?: string;
  activeSidebarId?: string;
  initialNotifications?: SellerNotificationItem[];
  onSearch?: (query: string) => void;
  onNotificationAction?: (notification: SellerNotificationItem) => void;
}

export default function SellerNotificationsCanvasDas({
  topbarTitle = "Owner Operations Console",
  searchPlaceholder = "Search notifications, orders, alerts...",
  searchQuery: searchQueryProp,
  ownerName: initialOwnerName,
  partnerRole: initialPartnerRole,
  avatarInitials: initialAvatarInitials,
  activeSidebarId = "notifications",
  initialNotifications,
  onSearch,
  onNotificationAction,
}: SellerNotificationsCanvasDasProps) {
  const seller = useSellerProfile();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchQueryProp || "");

  React.useEffect(() => {
    if (searchQueryProp !== undefined) {
      setSearchQuery(searchQueryProp);
    }
  }, [searchQueryProp]);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (onSearch) onSearch(q);
  };

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
      className="notifications-canvas-das-layout"
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

      {/* 2. Main Area (Topbar + Notifications Canvas) */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          backgroundColor: "#F7F8FB",
        }}
        className="notifications-main-wrapper"
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
          onMenuToggle={() => setIsMobileOpen((prev) => !prev)}
        />

        {/* Notifications Canvas */}
        <main
          style={{
            flex: 1,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            boxSizing: "border-box",
            backgroundColor: "#F7F8FB",
          }}
          className="notifications-canvas-container"
        >
          <SellerNotificationsCanvas
            initialNotifications={initialNotifications}
            searchQuery={searchQuery}
            onSearchChange={handleSearch}
            onNotificationAction={onNotificationAction}
          />
        </main>
      </div>
    </div>
  );
}
