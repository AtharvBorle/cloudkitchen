"use client";

import React, { useState } from "react";
import SellerSidebar from "../../sidebar/Sidebar";
import Topbar from "../../nav/Topbar";
import AgentCanvas, { AgentCanvasProps, AgentFormData } from "./AgentCanvas";
import { useSellerProfile } from "@/hooks/useSellerProfile";

export interface AgentCanvasDasProps {
  topbarTitle?: string;
  searchPlaceholder?: string;
  ownerName?: string;
  partnerRole?: string;
  avatarInitials?: string;
  activeSidebarId?: string;
  initialData?: Partial<AgentFormData>;
  onClose?: () => void;
  onCancel?: () => void;
  onSubmitSuccess?: (agentData: any) => void;
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
}

export default function AgentCanvasDas({
  topbarTitle = "Owner Operations Console",
  searchPlaceholder = "Search order, room, dish...",
  ownerName,
  partnerRole,
  avatarInitials,
  activeSidebarId = "delivery",
  initialData,
  onClose,
  onCancel,
  onSubmitSuccess,
  onSearch,
  onNotificationClick,
}: AgentCanvasDasProps) {
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
        fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
      }}
      className="agent-canvas-das-layout"
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

      {/* 2. Main Area (Topbar + Full-Width Page View) */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          backgroundColor: "#F7F8FB",
        }}
        className="agent-main-wrapper"
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

        {/* Full-Width Page Content */}
        <main
          style={{
            flex: 1,
            width: "100%",
            backgroundColor: "#F7F8FB",
            boxSizing: "border-box",
            minHeight: "calc(100vh - 64px)",
          }}
        >
          <AgentCanvas
            onClose={onClose}
            onCancel={onCancel}
            onSubmitSuccess={onSubmitSuccess}
            initialData={initialData}
          />
        </main>
      </div>
    </div>
  );
}
