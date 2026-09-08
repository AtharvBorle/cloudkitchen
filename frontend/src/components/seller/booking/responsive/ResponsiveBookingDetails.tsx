"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Phone, Bed, Calendar } from "lucide-react";
import styles from "./ResponsiveBookingDetails.module.css";

export type BookingProgressStep =
  | "Requested"
  | "Confirmed"
  | "Paid"
  | "Completed";

export interface ResponsiveBookingDetailsProps {
  bookingId?: string;
  guestName?: string;
  guestInitials?: string;
  guestPhone?: string;
  roomName?: string;
  roomCapacity?: string;
  dateRange?: string;
  stayDuration?: string;
  ratePerNight?: string;
  nightsCount?: number;
  roomChargeTotal?: string;
  serviceFee?: string;
  totalAmount?: string;
  initialStatus?: BookingProgressStep;
  onBack?: () => void;
  onConfirm?: () => void;
  onDecline?: () => void;
  onCallGuest?: () => void;
}

const PROGRESS_STEPS: BookingProgressStep[] = [
  "Requested",
  "Confirmed",
  "Paid",
  "Completed",
];

export const ResponsiveBookingDetails: React.FC<
  ResponsiveBookingDetailsProps
> = ({
  bookingId = "B-2047",
  guestName = "Aarav Mehta",
  guestInitials = "AM",
  guestPhone = "+91 98765 43210",
  roomName = "Deluxe Suite",
  roomCapacity = "Sleeps 4 Guests",
  dateRange = "Aug 28 – Sep 1",
  stayDuration = "4 Nights Stay",
  ratePerNight = "\u20B92,500",
  nightsCount = 4,
  roomChargeTotal = "\u20B910,000",
  serviceFee = "\u20B9500",
  totalAmount = "\u20B910,500",
  initialStatus = "Requested",
  onBack,
  onConfirm,
  onDecline,
  onCallGuest,
}) => {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] =
    useState<BookingProgressStep>(initialStatus);
  const [isDeclined, setIsDeclined] = useState(false);

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      router.push("/seller/res/booking");
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      setCurrentStatus("Confirmed");
    }
  };

  const handleDecline = () => {
    if (onDecline) {
      onDecline();
    } else {
      setIsDeclined(true);
    }
  };

  const activeIndex = PROGRESS_STEPS.indexOf(currentStatus);

  return (
    <div className={styles.screenWrapper}>
      {/* 390px Mobile View Container */}
      <div className={styles.mobileContainer}>
        {/* Top Header */}
        <header className={styles.topBar}>
          <button
            type="button"
            className={styles.backButton}
            onClick={handleBackClick}
            aria-label="Back to Bookings"
            title="Back"
          >
            <ChevronLeft size={24} />
          </button>

          <h1 className={styles.headerTitle}>Booking #{bookingId}</h1>

          <div className={styles.headerPlaceholder} />
        </header>

        {/* Scrollable Content Area */}
        <main className={styles.contentArea}>
          {/* 1. Guest Information Card */}
          <section className={`${styles.card} ${styles.guestCard}`}>
            <div className={styles.guestLeft}>
              <div className={styles.avatarCircle}>{guestInitials}</div>
              <div className={styles.guestInfo}>
                <h2 className={styles.guestName}>{guestName}</h2>
                <p className={styles.guestPhone}>{guestPhone}</p>
              </div>
            </div>

            <a
              href={`tel:${guestPhone}`}
              className={styles.callButton}
              onClick={(e) => {
                if (onCallGuest) {
                  e.preventDefault();
                  onCallGuest();
                }
              }}
              aria-label={`Call ${guestName}`}
              title="Call Guest"
            >
              <Phone size={18} />
            </a>
          </section>

          {/* 2. Room Information Card */}
          <section className={`${styles.card} ${styles.infoCard}`}>
            <div className={styles.iconBadge}>
              <Bed size={22} />
            </div>
            <div className={styles.infoDetails}>
              <h3 className={styles.infoTitle}>{roomName}</h3>
              <p className={styles.infoSubtitle}>{roomCapacity}</p>
            </div>
          </section>

          {/* 3. Date & Duration Card */}
          <section className={`${styles.card} ${styles.infoCard}`}>
            <div className={styles.iconBadge}>
              <Calendar size={22} />
            </div>
            <div className={styles.infoDetails}>
              <h3 className={styles.infoTitle}>{dateRange}</h3>
              <p className={styles.infoSubtitle}>{stayDuration}</p>
            </div>
          </section>

          {/* 4. Payment Summary Card */}
          <section className={`${styles.card} ${styles.paymentCard}`}>
            <span className={styles.sectionLabel}>PAYMENT SUMMARY</span>

            <div className={styles.paymentRow}>
              <span>
                {ratePerNight} × {nightsCount} nights
              </span>
              <span className={styles.paymentVal}>{roomChargeTotal}</span>
            </div>

            <div className={styles.paymentRow}>
              <span>Service Fee</span>
              <span className={styles.paymentVal}>{serviceFee}</span>
            </div>

            <div className={styles.divider} />

            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Total Amount</span>
              <span className={styles.totalAmount}>{totalAmount}</span>
            </div>
          </section>

          {/* 5. Booking Progress Timeline */}
          <section className={`${styles.card} ${styles.progressCard}`}>
            <span className={styles.sectionLabel}>BOOKING PROGRESS</span>

            <div className={styles.timelineList}>
              {PROGRESS_STEPS.map((step, idx) => {
                const isActive = idx <= activeIndex && !isDeclined;
                const isCurrent = idx === activeIndex && !isDeclined;
                const isLast = idx === PROGRESS_STEPS.length - 1;

                return (
                  <div key={step} className={styles.timelineStep}>
                    <div className={styles.indicatorWrapper}>
                      <div
                        className={
                          isActive ? styles.dotActive : styles.dotInactive
                        }
                      />
                      {!isLast && <div className={styles.connectingLine} />}
                    </div>
                    <p
                      className={
                        isCurrent
                          ? styles.stepTitleActive
                          : styles.stepTitleInactive
                      }
                    >
                      {step}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        </main>

        {/* Bottom Actions */}
        <footer className={styles.bottomActions}>
          {!isDeclined ? (
            <>
              <button
                type="button"
                className={styles.confirmBtn}
                onClick={handleConfirm}
              >
                {currentStatus === "Requested"
                  ? "Confirm Booking"
                  : currentStatus === "Confirmed"
                  ? "Mark as Paid"
                  : currentStatus === "Paid"
                  ? "Mark Completed"
                  : "Booking Completed"}
              </button>

              {currentStatus === "Requested" && (
                <button
                  type="button"
                  className={styles.declineBtn}
                  onClick={handleDecline}
                >
                  Decline
                </button>
              )}
            </>
          ) : (
            <div
              style={{
                textAlign: "center",
                color: "#EF4444",
                fontWeight: 700,
                padding: "12px",
              }}
            >
              Booking Declined
            </div>
          )}
        </footer>
      </div>
    </div>
  );
};

export default ResponsiveBookingDetails;

