"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Phone, Bed, Calendar, CheckCircle2, XCircle, Bell, User } from "lucide-react";
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
  bookingId = "",
  guestName = "",
  guestInitials = "",
  guestPhone = "",
  roomName = "",
  roomCapacity = "",
  dateRange = "",
  stayDuration = "",
  ratePerNight = "",
  nightsCount = 0,
  roomChargeTotal = "",
  serviceFee = "",
  totalAmount = "",
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/seller/booking");
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      if (currentStatus === "Requested") {
        setCurrentStatus("Confirmed");
        showToast(`Booking #${bookingId} Confirmed successfully!`);
      } else if (currentStatus === "Confirmed") {
        setCurrentStatus("Paid");
        showToast(`Booking #${bookingId} marked as Paid!`);
      } else if (currentStatus === "Paid") {
        setCurrentStatus("Completed");
        showToast(`Booking #${bookingId} marked as Completed!`);
      }
    }
  };

  const handleDecline = () => {
    if (onDecline) {
      onDecline();
    } else {
      setIsDeclined(true);
      showToast(`Booking #${bookingId} Declined.`);
    }
  };

  const activeIndex = PROGRESS_STEPS.indexOf(currentStatus);

  return (
    <div className={styles.screenWrapper}>
      {/* 420px Mobile View Container */}
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
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>

          <h1 className={styles.headerTitle}>Booking #{bookingId}</h1>

          <button
            type="button"
            className={styles.iconButton}
            onClick={() => router.push("/seller/notifications")}
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={22} />
          </button>
        </header>

        {/* Scrollable Content Area */}
        <main className={styles.contentArea}>
          {/* 1. Guest Information Card */}
          <section className={`${styles.card} ${styles.guestCard}`}>
            <div className={styles.guestLeft}>
              <div className={styles.avatarCircle}>{guestInitials || <User size={18} />}</div>
              <div className={styles.guestInfo}>
                <h2 className={styles.guestName}>{guestName || "Guest"}</h2>
                {guestPhone ? <p className={styles.guestPhone}>{guestPhone}</p> : null}
              </div>
            </div>

            {guestPhone && (
              <a
                href={`tel:${guestPhone}`}
                className={styles.callButton}
                onClick={(e) => {
                  if (onCallGuest) {
                    e.preventDefault();
                    onCallGuest();
                  }
                }}
                aria-label={`Call ${guestName || "Guest"}`}
                title="Call Guest"
              >
                <Phone size={18} />
              </a>
            )}
          </section>

          {/* 2. Room Information Card */}
          <section className={`${styles.card} ${styles.infoCard}`}>
            <div className={styles.iconBadge}>
              <Bed size={20} />
            </div>
            <div className={styles.infoDetails}>
              <h3 className={styles.infoTitle}>{roomName}</h3>
              <p className={styles.infoSubtitle}>{roomCapacity}</p>
            </div>
          </section>

          {/* 3. Date & Duration Card */}
          <section className={`${styles.card} ${styles.infoCard}`}>
            <div className={styles.iconBadge}>
              <Calendar size={20} />
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

          {/* 5. Booking Progress Timeline Card */}
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

          {/* 6. Bottom Action Buttons */}
          <div className={styles.bottomActions}>
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
                    : "Booking Completed ✓"}
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
              <div className={styles.declinedNotice}>
                <XCircle size={18} color="#EF4444" />
                <span>Booking Declined</span>
              </div>
            )}
          </div>
        </main>

        {/* Toast Notification */}
        {toastMessage && (
          <div className={styles.toastNotification}>
            <CheckCircle2 size={18} color="#10B981" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponsiveBookingDetails;
