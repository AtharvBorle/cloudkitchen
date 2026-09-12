"use client";

import React, { useState, useMemo } from "react";
import { ArrowRight, X, Phone, Calendar, Bed, CheckCircle2, AlertCircle } from "lucide-react";

export interface BookingRecord {
  id: string;
  guestName: string;
  guestInitials?: string;
  room: string;
  checkIn: string;
  checkOut: string;
  amount: string;
  status: "Confirmed" | "Paid" | "Requested" | "Cancelled" | string;
}

export type BookingFilterTab =
  | "All"
  | "Requested"
  | "Confirmed"
  | "Paid"
  | "Cancelled";

export interface BookingCanvasProps {
  title?: string;
  subtitle?: string;
  bookings?: BookingRecord[];
  initialTab?: BookingFilterTab;
  onViewDetails?: (booking: BookingRecord) => void;
  onTabChange?: (tab: BookingFilterTab) => void;
}

const DEFAULT_BOOKINGS: BookingRecord[] = [
  {
    id: "b1",
    guestName: "Aditya Sharma",
    guestInitials: "AS",
    room: "Suite 101",
    checkIn: "24 Oct 2026",
    checkOut: "26 Oct 2026",
    amount: "₹5,600",
    status: "Confirmed",
  },
  {
    id: "b2",
    guestName: "Sneha Patel",
    guestInitials: "SP",
    room: "Room 102",
    checkIn: "25 Oct 2026",
    checkOut: "28 Oct 2026",
    amount: "₹7,200",
    status: "Paid",
  },
  {
    id: "b3",
    guestName: "Rohit Verma",
    guestInitials: "RV",
    room: "Room 201",
    checkIn: "26 Oct 2026",
    checkOut: "27 Oct 2026",
    amount: "₹3,500",
    status: "Requested",
  },
  {
    id: "b4",
    guestName: "Priya Nair",
    guestInitials: "PN",
    room: "Suite 401",
    checkIn: "28 Oct 2026",
    checkOut: "31 Oct 2026",
    amount: "₹15,600",
    status: "Paid",
  },
  {
    id: "b5",
    guestName: "Amit Malhotra",
    guestInitials: "AM",
    room: "Room 202",
    checkIn: "30 Oct 2026",
    checkOut: "01 Nov 2026",
    amount: "₹3,600",
    status: "Cancelled",
  },
  {
    id: "b6",
    guestName: "Vikram Seth",
    guestInitials: "VS",
    room: "Suite 301",
    checkIn: "02 Nov 2026",
    checkOut: "05 Nov 2026",
    amount: "₹12,600",
    status: "Confirmed",
  },
  // Additional records to fulfill total counts: All 24, Requested 3, Confirmed 8, Paid 11, Cancelled 2
  {
    id: "b7",
    guestName: "Karan Johar",
    guestInitials: "KJ",
    room: "Suite 102",
    checkIn: "05 Nov 2026",
    checkOut: "08 Nov 2026",
    amount: "₹8,400",
    status: "Requested",
  },
  {
    id: "b8",
    guestName: "Meera Sen",
    guestInitials: "MS",
    room: "Room 305",
    checkIn: "07 Nov 2026",
    checkOut: "09 Nov 2026",
    amount: "₹4,200",
    status: "Requested",
  },
  {
    id: "b9",
    guestName: "Rajesh Khanna",
    guestInitials: "RK",
    room: "Suite 201",
    checkIn: "10 Nov 2026",
    checkOut: "12 Nov 2026",
    amount: "₹9,800",
    status: "Confirmed",
  },
  {
    id: "b10",
    guestName: "Deepika Padukone",
    guestInitials: "DP",
    room: "Suite 402",
    checkIn: "12 Nov 2026",
    checkOut: "15 Nov 2026",
    amount: "₹18,000",
    status: "Confirmed",
  },
  {
    id: "b11",
    guestName: "Ranveer Singh",
    guestInitials: "RS",
    room: "Suite 403",
    checkIn: "12 Nov 2026",
    checkOut: "15 Nov 2026",
    amount: "₹18,000",
    status: "Confirmed",
  },
  {
    id: "b12",
    guestName: "Ananya Panday",
    guestInitials: "AP",
    room: "Room 104",
    checkIn: "14 Nov 2026",
    checkOut: "16 Nov 2026",
    amount: "₹5,200",
    status: "Confirmed",
  },
  {
    id: "b13",
    guestName: "Sidharth Malhotra",
    guestInitials: "SM",
    room: "Suite 204",
    checkIn: "15 Nov 2026",
    checkOut: "18 Nov 2026",
    amount: "₹11,500",
    status: "Confirmed",
  },
  {
    id: "b14",
    guestName: "Kiara Advani",
    guestInitials: "KA",
    room: "Suite 205",
    checkIn: "15 Nov 2026",
    checkOut: "18 Nov 2026",
    amount: "₹11,500",
    status: "Confirmed",
  },
  {
    id: "b15",
    guestName: "Varun Dhawan",
    guestInitials: "VD",
    room: "Room 302",
    checkIn: "18 Nov 2026",
    checkOut: "20 Nov 2026",
    amount: "₹6,800",
    status: "Paid",
  },
  {
    id: "b16",
    guestName: "Alia Bhatt",
    guestInitials: "AB",
    room: "Suite 501",
    checkIn: "20 Nov 2026",
    checkOut: "24 Nov 2026",
    amount: "₹24,000",
    status: "Paid",
  },
  {
    id: "b17",
    guestName: "Ranbir Kapoor",
    guestInitials: "RK",
    room: "Suite 502",
    checkIn: "20 Nov 2026",
    checkOut: "24 Nov 2026",
    amount: "₹24,000",
    status: "Paid",
  },
  {
    id: "b18",
    guestName: "Katrina Kaif",
    guestInitials: "KK",
    room: "Suite 304",
    checkIn: "22 Nov 2026",
    checkOut: "25 Nov 2026",
    amount: "₹14,200",
    status: "Paid",
  },
  {
    id: "b19",
    guestName: "Vicky Kaushal",
    guestInitials: "VK",
    room: "Room 106",
    checkIn: "23 Nov 2026",
    checkOut: "25 Nov 2026",
    amount: "₹5,400",
    status: "Paid",
  },
  {
    id: "b20",
    guestName: "Shahid Kapoor",
    guestInitials: "SK",
    room: "Suite 206",
    checkIn: "25 Nov 2026",
    checkOut: "27 Nov 2026",
    amount: "₹9,600",
    status: "Paid",
  },
  {
    id: "b21",
    guestName: "Mira Rajput",
    guestInitials: "MR",
    room: "Room 208",
    checkIn: "25 Nov 2026",
    checkOut: "27 Nov 2026",
    amount: "₹4,800",
    status: "Paid",
  },
  {
    id: "b22",
    guestName: "Kartik Aaryan",
    guestInitials: "KA",
    room: "Room 108",
    checkIn: "27 Nov 2026",
    checkOut: "29 Nov 2026",
    amount: "₹6,200",
    status: "Paid",
  },
  {
    id: "b23",
    guestName: "Kriti Sanon",
    guestInitials: "KS",
    room: "Suite 108",
    checkIn: "28 Nov 2026",
    checkOut: "30 Nov 2026",
    amount: "₹8,900",
    status: "Paid",
  },
  {
    id: "b24",
    guestName: "Ayushmann Khurrana",
    guestInitials: "AK",
    room: "Room 309",
    checkIn: "29 Nov 2026",
    checkOut: "30 Nov 2026",
    amount: "₹3,200",
    status: "Cancelled",
  },
];

const EMPTY_BOOKINGS: BookingRecord[] = [];

export default function BookingCanvas({
  title = "Room Bookings",
  subtitle = "Manage room reservations, confirm bookings, and assign rooms to customers.",
  bookings = EMPTY_BOOKINGS,
  initialTab = "All",
  onViewDetails,
  onTabChange,
}: BookingCanvasProps) {
  const [activeTab, setActiveTab] = useState<BookingFilterTab>(initialTab);
  const [bookingList, setBookingList] = useState<BookingRecord[]>(bookings);
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (bookings && bookings !== EMPTY_BOOKINGS) {
      setBookingList(bookings);
    }
  }, [bookings]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Filter tab counts
  const tabCounts = useMemo(() => {
    const all = bookingList.length;
    const requested = bookingList.filter(
      (b) => b.status.toLowerCase() === "requested"
    ).length;
    const confirmed = bookingList.filter(
      (b) => b.status.toLowerCase() === "confirmed"
    ).length;
    const paid = bookingList.filter(
      (b) => b.status.toLowerCase() === "paid"
    ).length;
    const cancelled = bookingList.filter(
      (b) => b.status.toLowerCase() === "cancelled"
    ).length;

    return { all, requested, confirmed, paid, cancelled };
  }, [bookingList]);

  const tabs: { id: BookingFilterTab; label: string; count: number }[] = [
    { id: "All", label: "All Bookings", count: tabCounts.all },
    { id: "Requested", label: "Requested", count: tabCounts.requested },
    { id: "Confirmed", label: "Confirmed", count: tabCounts.confirmed },
    { id: "Paid", label: "Paid", count: tabCounts.paid },
    { id: "Cancelled", label: "Cancelled", count: tabCounts.cancelled },
  ];

  const handleTabClick = (tabId: BookingFilterTab) => {
    setActiveTab(tabId);
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  const handleDetailsClick = (booking: BookingRecord) => {
    if (onViewDetails) {
      onViewDetails(booking);
    } else {
      setSelectedBooking(booking);
    }
  };

  const handleUpdateBookingStatus = (bookingId: string, nextStatus: string) => {
    setBookingList((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: nextStatus } : b))
    );
    if (selectedBooking && selectedBooking.id === bookingId) {
      setSelectedBooking((prev) => (prev ? { ...prev, status: nextStatus } : null));
    }
    showToast(`Booking #${bookingId.toUpperCase()} updated to ${nextStatus}!`);
  };

  // Filtered Bookings based on active tab
  const filteredBookings = useMemo(() => {
    if (activeTab === "All") return bookingList;
    return bookingList.filter(
      (b) => b.status.toLowerCase() === activeTab.toLowerCase()
    );
  }, [bookingList, activeTab]);

  // Helper for Initials
  const getInitials = (name: string, fallback?: string): string => {
    if (fallback) return fallback;
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Status Badge Component
  const renderStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#FFF1E8",
              color: "#FF5500",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 700,
              padding: "4px 10px",
              lineHeight: 1.2,
              whiteSpace: "nowrap",
            }}
          >
            Confirmed
          </span>
        );
      case "paid":
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#EFF6FF",
              color: "#2563EB",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 700,
              padding: "4px 10px",
              lineHeight: 1.2,
              whiteSpace: "nowrap",
            }}
          >
            Paid
          </span>
        );
      case "requested":
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#FEF3C7",
              color: "#D97706",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 700,
              padding: "4px 10px",
              lineHeight: 1.2,
              whiteSpace: "nowrap",
            }}
          >
            Requested
          </span>
        );
      case "cancelled":
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#FEE2E2",
              color: "#EF4444",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 700,
              padding: "4px 10px",
              lineHeight: 1.2,
              whiteSpace: "nowrap",
            }}
          >
            Cancelled
          </span>
        );
      default:
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#F1F5F9",
              color: "#64748B",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 700,
              padding: "4px 10px",
              lineHeight: 1.2,
              whiteSpace: "nowrap",
            }}
          >
            {status}
          </span>
        );
    }
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "1200px",
        minHeight: "960px",
        height: "100%",
        backgroundColor: "#F7F8FB",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        padding: "32px",
        boxSizing: "border-box",
        fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
      }}
      className="booking-canvas-container"
    >
      {/* Constrained Content (Width: 1120px, Min-Height: 570px, Gap: 24px) */}
      <div
        style={{
          width: "100%",
          maxWidth: "1120px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          boxSizing: "border-box",
        }}
        className="constrained-content"
      >
        {/* Frame 1: Section Header (Width: 1120px, Height: 50px, Justify: space-between) */}
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxSizing: "border-box",
            flexWrap: "wrap",
            gap: "12px",
          }}
          className="frame-1-header"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: 800,
                color: "#0F172A",
                margin: 0,
                letterSpacing: "-0.4px",
                lineHeight: 1.25,
              }}
            >
              {title}
            </h1>
            <p
              style={{
                fontSize: "13.5px",
                color: "#64748B",
                margin: 0,
                fontWeight: 400,
              }}
            >
              {subtitle}
            </p>
          </div>
        </div>

        {/* Frame 2: Filter Tabs Row (Width: 1120px, Height: 37px, Gap: 8px) */}
        <div
          style={{
            width: "100%",
            minHeight: "37px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxSizing: "border-box",
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
          className="frame-2-tabs"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 14px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: "transparent",
                  color: isActive ? "#FF5500" : "#475569",
                  fontSize: "13px",
                  fontWeight: isActive ? 700 : 500,
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                  fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                  whiteSpace: "nowrap",
                  position: "relative",
                  borderBottom: isActive
                    ? "2px solid #FF5500"
                    : "2px solid transparent",
                }}
                className={`booking-tab-btn ${isActive ? "active-tab" : ""}`}
              >
                <span>{tab.label}</span>
                {/* Count Badge */}
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "1px 6px",
                    borderRadius: "10px",
                    backgroundColor: isActive ? "#FFF1E8" : "#F1F5F9",
                    color: isActive ? "#FF5500" : "#64748B",
                    minWidth: "18px",
                    height: "18px",
                    boxSizing: "border-box",
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Frame 3: Reservations Ledger Table Card (Width: 1120px, Min-Height: 435px, Padding: 24px, Radius: 12px, Background: #FFFFFF, Border: 1px solid #E2E8F0) */}
        <div
          style={{
            width: "100%",
            minHeight: "435px",
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            border: "1px solid #E2E8F0",
            padding: "24px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
          }}
          className="frame-3-table-card"
        >
          <div
            style={{
              width: "100%",
              overflowX: "auto",
              boxSizing: "border-box",
            }}
            className="table-scroll-container"
          >
            <table
              style={{
                width: "100%",
                minWidth: "860px",
                borderCollapse: "collapse",
                textAlign: "left",
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
              }}
            >
              {/* Table Header */}
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid #F1F5F9",
                  }}
                >
                  <th
                    style={{
                      padding: "10px 12px 10px 0",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#64748B",
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                      width: "22%",
                    }}
                  >
                    GUEST
                  </th>
                  <th
                    style={{
                      padding: "10px 12px",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#64748B",
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                      width: "13%",
                    }}
                  >
                    ROOM
                  </th>
                  <th
                    style={{
                      padding: "10px 12px",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#64748B",
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                      width: "15%",
                    }}
                  >
                    CHECK-IN
                  </th>
                  <th
                    style={{
                      padding: "10px 12px",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#64748B",
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                      width: "15%",
                    }}
                  >
                    CHECK-OUT
                  </th>
                  <th
                    style={{
                      padding: "10px 12px",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#64748B",
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                      width: "13%",
                    }}
                  >
                    AMOUNT
                  </th>
                  <th
                    style={{
                      padding: "10px 12px",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#64748B",
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                      width: "11%",
                    }}
                  >
                    STATUS
                  </th>
                  <th
                    style={{
                      padding: "10px 0 10px 12px",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#64748B",
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                      textAlign: "right",
                      width: "11%",
                    }}
                  >
                    ACTIONS
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>
                {filteredBookings.length > 0 ? (
                  filteredBookings.map((booking, index) => {
                    const initials = getInitials(
                      booking.guestName,
                      booking.guestInitials
                    );

                    return (
                      <tr
                        key={booking.id || index}
                        style={{
                          borderBottom:
                            index !== filteredBookings.length - 1
                              ? "1px solid #F8FAFC"
                              : "none",
                          transition: "background-color 0.15s ease",
                        }}
                        className="booking-table-row"
                      >
                        {/* Guest: Avatar Initials + Name */}
                        <td
                          style={{
                            padding: "14px 12px 14px 0",
                            verticalAlign: "middle",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                            }}
                          >
                            {/* Avatar Initials Circle */}
                            <div
                              style={{
                                width: "32px",
                                height: "32px",
                                minWidth: "32px",
                                minHeight: "32px",
                                borderRadius: "50%",
                                backgroundColor: "#FFF1E8",
                                color: "#FF5500",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "12px",
                                fontWeight: 700,
                                flexShrink: 0,
                              }}
                            >
                              {initials}
                            </div>
                            {/* Guest Name */}
                            <span
                              style={{
                                fontSize: "13.5px",
                                fontWeight: 700,
                                color: "#0F172A",
                              }}
                            >
                              {booking.guestName}
                            </span>
                          </div>
                        </td>

                        {/* Room */}
                        <td
                          style={{
                            padding: "14px 12px",
                            verticalAlign: "middle",
                            fontSize: "13px",
                            fontWeight: 400,
                            color: "#475569",
                          }}
                        >
                          {booking.room}
                        </td>

                        {/* Check-In */}
                        <td
                          style={{
                            padding: "14px 12px",
                            verticalAlign: "middle",
                            fontSize: "13px",
                            fontWeight: 500,
                            color: "#0F172A",
                          }}
                        >
                          {booking.checkIn}
                        </td>

                        {/* Check-Out */}
                        <td
                          style={{
                            padding: "14px 12px",
                            verticalAlign: "middle",
                            fontSize: "13px",
                            fontWeight: 500,
                            color: "#0F172A",
                          }}
                        >
                          {booking.checkOut}
                        </td>

                        {/* Amount */}
                        <td
                          style={{
                            padding: "14px 12px",
                            verticalAlign: "middle",
                            fontSize: "13.5px",
                            fontWeight: 700,
                            color: "#0F172A",
                          }}
                        >
                          {booking.amount}
                        </td>

                        {/* Status Badge */}
                        <td
                          style={{
                            padding: "14px 12px",
                            verticalAlign: "middle",
                          }}
                        >
                          {renderStatusBadge(booking.status)}
                        </td>

                        {/* Actions (Details ->) */}
                        <td
                          style={{
                            padding: "14px 0 14px 12px",
                            verticalAlign: "middle",
                            textAlign: "right",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => handleDetailsClick(booking)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#FF5500",
                              fontSize: "13px",
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "4px 0",
                              transition: "all 0.15s ease",
                              fontFamily:
                                "var(--font-poppins), 'Poppins', sans-serif",
                            }}
                            className="booking-details-btn"
                          >
                            <span>Details</span>
                            <ArrowRight size={14} strokeWidth={2.5} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        padding: "48px 0",
                        textAlign: "center",
                        color: "#94A3B8",
                        fontSize: "13.5px",
                      }}
                    >
                      No reservations found for "{activeTab}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            boxSizing: "border-box",
          }}
          onClick={() => setSelectedBooking(null)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "540px",
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              border: "1px solid #E2E8F0",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxSizing: "border-box",
              fontFamily: "inherit",
              animation: "fadeIn 0.2s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px",
                borderBottom: "1px solid #F1F5F9",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h3
                  style={{
                    fontSize: "17px",
                    fontWeight: 700,
                    color: "#0F172A",
                    margin: 0,
                  }}
                >
                  Reservation Details
                </h3>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#64748B",
                    backgroundColor: "#F1F5F9",
                    padding: "3px 8px",
                    borderRadius: "6px",
                  }}
                >
                  #{selectedBooking.id.toUpperCase()}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748B",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "6px",
                }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div
              style={{
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "18px",
              }}
            >
              {/* Guest Profile Card */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "#F8FAFC",
                  borderRadius: "12px",
                  padding: "16px",
                  border: "1px solid #E2E8F0",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      backgroundColor: "#FFF1E8",
                      color: "#FF5500",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                      fontWeight: 700,
                    }}
                  >
                    {getInitials(selectedBooking.guestName, selectedBooking.guestInitials)}
                  </div>
                  <div>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: "15px",
                        fontWeight: 700,
                        color: "#0F172A",
                      }}
                    >
                      {selectedBooking.guestName}
                    </h4>
                    <span
                      style={{
                        fontSize: "12.5px",
                        color: "#64748B",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        marginTop: "2px",
                      }}
                    >
                      <Phone size={13} />
                      +91 98765 43210
                    </span>
                  </div>
                </div>

                <div>{renderStatusBadge(selectedBooking.status)}</div>
              </div>

              {/* Reservation Info Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: "10px",
                    padding: "12px 14px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#64748B",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Bed size={14} color="#FF5500" />
                    Room Assigned
                  </span>
                  <p
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#0F172A",
                      margin: "6px 0 0 0",
                    }}
                  >
                    {selectedBooking.room}
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: "10px",
                    padding: "12px 14px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#64748B",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Calendar size={14} color="#3B82F6" />
                    Stay Duration
                  </span>
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#0F172A",
                      margin: "6px 0 0 0",
                    }}
                  >
                    {selectedBooking.checkIn} → {selectedBooking.checkOut}
                  </p>
                </div>
              </div>

              {/* Total Billing Banner */}
              <div
                style={{
                  backgroundColor: "#FFF8F4",
                  border: "1px solid #FFEDD5",
                  borderRadius: "12px",
                  padding: "14px 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#C2410C" }}>
                    Total Tariff
                  </span>
                  <div style={{ fontSize: "11px", color: "#9A3412" }}>
                    Inclusive of taxes & services
                  </div>
                </div>
                <span
                  style={{
                    fontSize: "20px",
                    fontWeight: 800,
                    color: "#C2410C",
                  }}
                >
                  {selectedBooking.amount}
                </span>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px solid #F1F5F9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                backgroundColor: "#F8FAFC",
              }}
            >
              {selectedBooking.status.toLowerCase() !== "cancelled" ? (
                <button
                  type="button"
                  onClick={() =>
                    handleUpdateBookingStatus(selectedBooking.id, "Cancelled")
                  }
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "1px solid #FECACA",
                    backgroundColor: "#FFFFFF",
                    color: "#EF4444",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel Booking
                </button>
              ) : (
                <div />
              )}

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {selectedBooking.status.toLowerCase() === "requested" && (
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateBookingStatus(selectedBooking.id, "Confirmed")
                    }
                    style={{
                      padding: "8px 18px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: "#FF5500",
                      color: "#FFFFFF",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Confirm Booking
                  </button>
                )}

                {selectedBooking.status.toLowerCase() === "confirmed" && (
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateBookingStatus(selectedBooking.id, "Paid")
                    }
                    style={{
                      padding: "8px 18px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: "#2563EB",
                      color: "#FFFFFF",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Mark as Paid
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    color: "#334155",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            backgroundColor: "#0F172A",
            color: "#FFFFFF",
            padding: "12px 20px",
            borderRadius: "10px",
            fontSize: "13.5px",
            fontWeight: 600,
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            zIndex: 10000,
          }}
        >
          <CheckCircle2 size={18} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}

      <style jsx>{`
        .booking-tab-btn:hover:not(.active-tab) {
          color: #0F172A !important;
        }
        .booking-details-btn:hover {
          color: #E64D00 !important;
          transform: translateX(2px);
        }
        .booking-table-row:hover {
          background-color: #FAFAFA !important;
        }
        @media (max-width: 1024px) {
          .booking-canvas-container {
            padding: 24px 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
