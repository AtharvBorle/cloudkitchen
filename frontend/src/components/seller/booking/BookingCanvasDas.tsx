"use client";

import React, { useState } from "react";
import SellerSidebar from "../sidebar/Sidebar";
import Topbar from "../nav/Topbar";
import BookingCanvas, {
  BookingCanvasProps,
  BookingRecord,
  BookingFilterTab,
} from "./BookingCanvas";

export interface BookingCanvasDasProps {
  topbarTitle?: string;
  searchPlaceholder?: string;
  ownerName?: string;
  partnerRole?: string;
  avatarInitials?: string;
  activeSidebarId?: string;
  title?: string;
  subtitle?: string;
  bookings?: BookingRecord[];
  initialTab?: BookingFilterTab;
  onViewDetails?: (booking: BookingRecord) => void;
  onTabChange?: (tab: BookingFilterTab) => void;
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
}

export default function BookingCanvasDas({
  topbarTitle = "Owner Operations Console",
  searchPlaceholder = "Search order, room, booking...",
  ownerName = "John Doe",
  partnerRole = "Neo Cloud Partner",
  avatarInitials = "JD",
  activeSidebarId = "bookings",
  title,
  subtitle,
  bookings,
  initialTab,
  onViewDetails,
  onTabChange,
  onSearch,
  onNotificationClick,
}: BookingCanvasDasProps) {
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
      className="booking-canvas-das-layout"
    >
      {/* 1. Left Sidebar Component (Width: 240px, Active Item: Bookings) */}
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
        className="booking-canvas-main-wrapper"
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

        {/* Booking Canvas Component (1200px Canvas containing Header, Filter Tabs & Ledger Table) */}
        <BookingCanvas
          title={title}
          subtitle={subtitle}
          bookings={bookings}
          initialTab={initialTab}
          onViewDetails={onViewDetails}
          onTabChange={onTabChange}
        />
      </div>
    </div>
  );
}