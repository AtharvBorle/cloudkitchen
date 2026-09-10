"use client";

import React, { useState } from "react";
import SellerSidebar from "../../sidebar/Sidebar";
import Topbar from "../../nav/Topbar";
import AgentCanvas, { AgentCanvasProps, AgentFormData } from "./AgentCanvas";

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
  ownerName = "John Doe",
  partnerRole = "Neo Cloud Partner",
  avatarInitials = "JD",
  activeSidebarId = "delivery",
  initialData,
  onClose,
  onCancel,
  onSubmitSuccess,
  onSearch,
  onNotificationClick,
}: AgentCanvasDasProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        alignItems: "flex-start",
        backgroundColor: "#CBD5E1",
        fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
      }}
      className="agent-canvas-das-layout"
    >
      {/* 1. Left Sidebar Navigation */}
      <SellerSidebar
        activeItemId={activeSidebarId}
        isMobileOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
      />

      {/* 2. Main Area (Topbar + Grey Canvas Backdrop) */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          backgroundColor: "#CBD5E1",
        }}
        className="agent-main-wrapper"
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

        {/* Backdrop Canvas Centering the Add Agent Modal Card */}
        <main
          style={{
            flex: 1,
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 20px",
            backgroundColor: "#B0B9C6",
            backgroundImage: "radial-gradient(#B8C2CF 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            boxSizing: "border-box",
            minHeight: "calc(100vh - 64px)",
          }}
          className="agent-canvas-backdrop"
        >
          <AgentCanvas
            onClose={onClose}
            onCancel={onCancel}
            onSubmitSuccess={onSubmitSuccess}
            initialData={initialData}
          />
        </main>
      </div>

      <style jsx>{`
        @media (max-width: 600px) {
          .agent-canvas-backdrop {
            padding: 20px 12px !important;
          }
        }
      `}</style>
    </div>
  );
}
