"use client";

import React, { useState, useEffect } from "react";
import SellerSidebar from "../sidebar/Sidebar";
import Topbar from "../nav/Topbar";
import BookingCanvas, {
  BookingCanvasProps,
  BookingRecord,
  BookingFilterTab,
} from "./BookingCanvas";
import { fetchApi } from "@/lib/fetch-api";
import { useSellerProfile, computeInitials } from "@/hooks/useSellerProfile";

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
  ownerName: initialOwnerName,
  partnerRole: initialPartnerRole,
  avatarInitials: initialAvatarInitials,
  activeSidebarId = "bookings",
  title,
  subtitle,
  bookings: initialBookings,
  initialTab,
  onViewDetails,
  onTabChange,
  onSearch,
  onNotificationClick,
}: BookingCanvasDasProps) {
  const seller = useSellerProfile();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [bookingList, setBookingList] = useState<BookingRecord[]>(initialBookings || []);
  const [loading, setLoading] = useState(false);

  const ownerName = initialOwnerName || seller.ownerName;
  const partnerRole = initialPartnerRole || seller.partnerRole;
  const avatarInitials = initialAvatarInitials || seller.avatarInitials;

  useEffect(() => {
    if (initialBookings) {
      setBookingList(initialBookings);
      return;
    }
    async function loadBookings() {
      try {
        setLoading(true);
        const res = await fetchApi("/api/seller/rooms");
        if (res.ok) {
          const data = await res.json();
          const list = data.data?.bookings || data.bookings || [];
          if (Array.isArray(list)) {
            const mapped: BookingRecord[] = list.map((b: any) => {
              const checkInStr = b.checkInDate
                ? new Date(b.checkInDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                : "-";
              const checkOutStr = b.checkOutDate
                ? new Date(b.checkOutDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                : "-";
              const name = b.user?.name || "Guest";
              return {
                id: b.id,
                guestName: name,
                guestInitials: computeInitials(name),
                room: b.room?.title || "Room",
                checkIn: checkInStr,
                checkOut: checkOutStr,
                amount: `₹${b.totalAmount || 0}`,
                status: b.status === "CONFIRMED" ? "Confirmed" : b.status === "PAID" ? "Paid" : b.status === "CANCELLED" ? "Cancelled" : "Requested",
              };
            });
            setBookingList(mapped);
          }
        }
      } catch (err) {
        console.error("Failed to load seller bookings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBookings();
  }, [initialBookings]);

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
          bookings={bookingList}
          initialTab={initialTab}
          onViewDetails={onViewDetails}
          onTabChange={onTabChange}
        />
      </div>
    </div>
  );
}