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
import { Lock, ArrowRight } from "lucide-react";
import Link from "next/link";

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

  const [statusChecked, setStatusChecked] = useState(false);
  const [isPropertyActive, setIsPropertyActive] = useState<boolean | null>(null);
  const [propertyVerification, setPropertyVerification] = useState<string>("NONE");

  useEffect(() => {
    async function checkCategoryAccess() {
      try {
        const res = await fetchApi("/api/seller/dashboard/status");
        if (res.ok) {
          const data = await res.json();
          const status = data.data || data;
          const active = Boolean(status.isPropertyActive);
          const verif = status.sellerProfile?.propertyVerificationStatus || "NONE";
          setIsPropertyActive(active);
          setPropertyVerification(verif);
          setStatusChecked(true);

          if (!active) {
            window.dispatchEvent(
              new CustomEvent(verif === "APPROVED" ? "open-subscription-modal" : "open-category-upgrade", {
                detail: { category: "PROPERTY" },
              })
            );
          }
        } else {
          setStatusChecked(true);
        }
      } catch (e) {
        setStatusChecked(true);
      }
    }
    checkCategoryAccess();
  }, []);

  useEffect(() => {
    if (isPropertyActive === false) return; // Do not load bookings if property category is not active

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
  }, [initialBookings, isPropertyActive]);

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
        ownerName={ownerName}
        partnerRole={partnerRole}
        avatarInitials={avatarInitials}
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

        {/* Booking Canvas Component or Locked Upgrade View */}
        {statusChecked && isPropertyActive === false ? (
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              border: "1px solid #FED7AA",
              padding: "48px 24px",
              textAlign: "center",
              maxWidth: "600px",
              margin: "40px auto",
              boxShadow: "0 10px 25px rgba(249, 115, 22, 0.08)",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                backgroundColor: "#FFF1E8",
                color: "#F97316",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <Lock size={28} />
            </div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0F172A", marginBottom: "8px" }}>
              Room Bookings Ledger Locked
            </h2>
            <p style={{ color: "#64748B", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "24px" }}>
              {propertyVerification === "APPROVED"
                ? "Your property verification is approved! Please subscribe to the Rooms & Stay category plan to view guest bookings, check-in schedules, and room payments."
                : "Your seller account is currently configured for Food Services only. To list rooms and receive hotel bookings, please apply for the Property category upgrade."}
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              {propertyVerification === "APPROVED" ? (
                <Link
                  href="/seller/payment?category=PROPERTY"
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "#F97316",
                    color: "#FFFFFF",
                    borderRadius: "10px",
                    fontWeight: 700,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span>Subscribe to Rooms Plan</span>
                  <ArrowRight size={16} />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent("open-category-upgrade", { detail: { category: "PROPERTY" } })
                    );
                  }}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "#F97316",
                    color: "#FFFFFF",
                    borderRadius: "10px",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    fontFamily: "inherit",
                  }}
                >
                  <span>Apply for Category Upgrade</span>
                  <ArrowRight size={16} />
                </button>
              )}
              <Link
                href="/seller/dashboard"
                style={{
                  padding: "12px 20px",
                  backgroundColor: "#F1F5F9",
                  color: "#475569",
                  borderRadius: "10px",
                  fontWeight: 600,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <BookingCanvas
            title={title}
            subtitle={subtitle}
            bookings={displayedBookings}
            initialTab={initialTab}
            onViewDetails={onViewDetails}
            onTabChange={onTabChange}
          />
        )}
      </div>
    </div>
  );
}