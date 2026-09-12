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
  const [searchQuery, setSearchQuery] = useState("");
  const [bookingList, setBookingList] = useState<BookingRecord[]>(initialBookings || []);
  const [loading, setLoading] = useState(false);

  const ownerName = initialOwnerName || seller.ownerName;
  const partnerRole = initialPartnerRole || seller.partnerRole;
  const avatarInitials = initialAvatarInitials || seller.avatarInitials;

  useEffect(() => {
    if (initialBookings && initialBookings.length > 0) {
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
              const checkInRaw = b.startDate || b.checkInDate || b.checkIn;
              const checkOutRaw = b.endDate || b.checkOutDate || b.checkOut;
              const checkInStr = checkInRaw
                ? new Date(checkInRaw).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                : "-";
              const checkOutStr = checkOutRaw
                ? new Date(checkOutRaw).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                : "-";

              let duration = "";
              if (checkInRaw && checkOutRaw) {
                const d1 = new Date(checkInRaw);
                const d2 = new Date(checkOutRaw);
                if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
                  const diffDays = Math.max(1, Math.round(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
                  duration = `${diffDays} ${diffDays === 1 ? "Night" : "Nights"}`;
                }
              }

              const name = b.user?.name || "Guest";
              return {
                id: b.id,
                guestName: name,
                guestInitials: computeInitials(name),
                guestPhone: b.user?.phone || "+91 98765 43210",
                room: b.room?.title || "Room",
                capacity: b.room?.capacity ? `Sleeps ${b.room.capacity} Guests` : "Sleeps 2 Guests",
                checkIn: checkInStr,
                checkOut: checkOutStr,
                duration: duration,
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

  const displayedBookings = React.useMemo(() => {
    if (!searchQuery.trim()) return bookingList;
    const q = searchQuery.toLowerCase().trim();
    return bookingList.filter(
      (b) =>
        b.guestName.toLowerCase().includes(q) ||
        b.room.toLowerCase().includes(q) ||
        b.status.toLowerCase().includes(q) ||
        b.amount.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q)
    );
  }, [bookingList, searchQuery]);

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
          onSearch={(q) => {
            setSearchQuery(q);
            if (onSearch) onSearch(q);
          }}
          onNotificationClick={onNotificationClick}
          onMenuToggle={() => setIsMobileOpen((prev) => !prev)}
        />

        {/* Booking Canvas Component (1200px Canvas containing Header, Filter Tabs & Ledger Table) */}
        <BookingCanvas
          title={title}
          subtitle={subtitle}
          bookings={displayedBookings}
          initialTab={initialTab}
          onViewDetails={onViewDetails}
          onTabChange={onTabChange}
        />
      </div>
    </div>
  );
}