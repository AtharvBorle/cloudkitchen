"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Menu as MenuIcon, Calendar } from "lucide-react";
import ResponsiveNavMenu from "../../nav/ResponsiveNavMenu";
import styles from "./ResponsiveBooking.module.css";

export type BookingStatusTab = "Requested" | "Confirmed" | "Paid";

export interface ResponsiveBookingItem {
  id: string;
  guestName: string;
  roomName: string;
  dateRange: string;
  amount: string;
  status: "Requested" | "Confirmed" | "Paid" | "Declined";
}

export interface ResponsiveBookingProps {
  ownerName?: string;
  bookings?: ResponsiveBookingItem[];
  initialTab?: BookingStatusTab;
  onConfirm?: (bookingId: string) => void;
  onDecline?: (bookingId: string) => void;
  onViewDetails?: (booking: ResponsiveBookingItem) => void;
  onSyncDevices?: () => void;
}

const DEFAULT_BOOKINGS: ResponsiveBookingItem[] = [
  {
    id: "B-2047",
    guestName: "Aarav Mehta",
    roomName: "Deluxe Suite",
    dateRange: "Aug 28 - Sep 1",
    amount: "₹10,500",
    status: "Requested",
  },
  {
    id: "B-2048",
    guestName: "Sneha Reddy",
    roomName: "Superior Room",
    dateRange: "Sep 03 - Sep 05",
    amount: "₹9,200",
    status: "Requested",
  },
  {
    id: "B-2049",
    guestName: "Dev Bajwa",
    roomName: "Executive Suite",
    dateRange: "Sep 12 - Sep 15",
    amount: "₹24,000",
    status: "Requested",
  },
  {
    id: "B-2050",
    guestName: "Vikram Malhotra",
    roomName: "Presidential Suite",
    dateRange: "Sep 18 - Sep 22",
    amount: "₹35,000",
    status: "Confirmed",
  },
  {
    id: "B-2051",
    guestName: "Ananya Deshmukh",
    roomName: "Deluxe Suite",
    dateRange: "Sep 25 - Sep 28",
    amount: "₹16,500",
    status: "Confirmed",
  },
  {
    id: "B-2052",
    guestName: "Kabir Singhania",
    roomName: "Ocean View Studio",
    dateRange: "Oct 01 - Oct 04",
    amount: "₹21,000",
    status: "Paid",
  },
];

const TABS: BookingStatusTab[] = ["Requested", "Confirmed", "Paid"];

export const ResponsiveBooking: React.FC<ResponsiveBookingProps> = ({
  ownerName = "Rahul Sharma",
  bookings = DEFAULT_BOOKINGS,
  initialTab = "Requested",
  onConfirm,
  onDecline,
  onViewDetails,
  onSyncDevices,
}) => {
  const router = useRouter();
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<BookingStatusTab>(initialTab);
  const [bookingList, setBookingList] = useState<ResponsiveBookingItem[]>(bookings);

  const handleViewDetails = (booking: ResponsiveBookingItem) => {
    if (onViewDetails) {
      onViewDetails(booking);
    } else {
      router.push(`/seller/res/booking/details?bookingId=${encodeURIComponent(booking.id)}`);
    }
  };

  const handleConfirmAction = (bookingId: string) => {
    if (onConfirm) {
      onConfirm(bookingId);
    }
    setBookingList((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: "Confirmed" } : b))
    );
  };

  const handleDeclineAction = (bookingId: string) => {
    if (onDecline) {
      onDecline(bookingId);
    }
    setBookingList((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: "Declined" } : b))
    );
  };

  const filteredBookings = bookingList.filter((booking) => {
    if (selectedTab === "Requested") {
      return booking.status === "Requested";
    }
    if (selectedTab === "Confirmed") {
      return booking.status === "Confirmed";
    }
    if (selectedTab === "Paid") {
      return booking.status === "Paid";
    }
    return true;
  });

  const getStatusBadgeClass = (status: ResponsiveBookingItem["status"]) => {
    switch (status) {
      case "Requested":
        return styles.statusRequested;
      case "Confirmed":
        return styles.statusConfirmed;
      case "Paid":
        return styles.statusPaid;
      case "Declined":
        return styles.statusDeclined;
      default:
        return styles.statusRequested;
    }
  };

  return (
    <div className={styles.screenWrapper}>
      {/* Drawer Navigation Menu */}
      <ResponsiveNavMenu
        isOpen={isNavMenuOpen}
        onClose={() => setIsNavMenuOpen(false)}
        activeItemId="bookings"
        ownerName={ownerName}
        onSyncDevices={onSyncDevices}
      />

      {/* 390px Mobile View Container */}
      <div className={styles.mobileContainer}>
        {/* Top Header Bar with Hamburger Icon & Logo */}
        <header className={styles.topBar}>
          <div className={styles.headerLeftGroup}>
            <button
              type="button"
              className={styles.iconButton}
              onClick={(e) => {
                e.stopPropagation();
                setIsNavMenuOpen(true);
              }}
              aria-label="Open Navigation Menu"
              title="Menu"
            >
              <MenuIcon size={24} />
            </button>
            <Link href="/seller/res/dashboard" className={styles.headerLogoLink} title="Neo Cloud Bites">
              <div className={styles.headerLogoWrapper}>
                <Image
                  src="/images/logo-nav.png"
                  alt="Neo Cloud Bites"
                  width={30}
                  height={30}
                  className={styles.headerLogoImg}
                  priority
                />
              </div>
            </Link>
          </div>

          <h1 className={styles.pageTitle}>Bookings</h1>

          <div className={styles.headerPlaceholder} />
        </header>

        {/* Filter Pills / Tabs */}
        <div
          className={styles.filterTabsSection}
          role="tablist"
          aria-label="Booking Status Tabs"
        >
          {TABS.map((tab) => {
            const isActive = selectedTab === tab;
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`${styles.tabPill} ${
                  isActive ? styles.tabPillActive : ""
                }`}
                onClick={() => setSelectedTab(tab)}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <main className={styles.contentArea}>
          {filteredBookings.length > 0 ? (
            filteredBookings.map((booking) => (
              <article key={booking.id} className={styles.bookingCard}>
                {/* Top: Guest Info & Status Badge */}
                <div className={styles.cardHeader}>
                  <div className={styles.guestInfo}>
                    <h2 className={styles.guestName}>{booking.guestName}</h2>
                    <p className={styles.roomName}>{booking.roomName}</p>
                  </div>
                  <span
                    className={`${styles.statusBadge} ${getStatusBadgeClass(
                      booking.status
                    )}`}
                  >
                    {booking.status}
                  </span>
                </div>

                {/* Middle: Date Range & Amount Strip */}
                <div className={styles.datesAmountContainer}>
                  <div className={styles.datesLeft}>
                    <Calendar size={17} />
                    <span className={styles.dateRangeText}>{booking.dateRange}</span>
                  </div>
                  <span className={styles.amountText}>{booking.amount}</span>
                </div>

                {/* Bottom: Action Buttons */}
                {booking.status === "Requested" ? (
                  <div className={styles.actionsRow}>
                    <button
                      type="button"
                      className={styles.declineButton}
                      onClick={() => handleDeclineAction(booking.id)}
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      className={styles.confirmButton}
                      onClick={() => handleConfirmAction(booking.id)}
                    >
                      Confirm
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={styles.secondaryActionBtn}
                    onClick={() => handleViewDetails(booking)}
                  >
                    {booking.status === "Confirmed"
                      ? "Manage Booking"
                      : "View Receipt"}
                  </button>
                )}
              </article>
            ))
          ) : (
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>
                No {selectedTab.toLowerCase()} bookings found.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ResponsiveBooking;

