"use client";

import React from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import styles from "./RegistrationSubmitted.module.css";

export interface RegistrationSubmittedProps {
  trackingId?: string;
  statusText?: string;
  onTrackStatus?: () => void;
}

export const RegistrationSubmitted: React.FC<RegistrationSubmittedProps> = ({
  trackingId = "NCR-2026-0847",
  statusText = "Pending",
  onTrackStatus,
}) => {
  return (
    <div className={styles.container}>
      {/* Centered Content Block */}
      <div className={styles.contentBlock}>
        {/* Large Check Circle */}
        <div className={styles.checkCircle}>
          <Check className={styles.checkIcon} size={36} strokeWidth={3} />
        </div>

        {/* Main Heading */}
        <h1 className={styles.title}>Submitted!</h1>

        {/* Tracking ID */}
        <span className={styles.trackingLabel}>TRACKING ID</span>
        <div className={styles.trackingBadge}>{trackingId}</div>

        {/* Status Badge */}
        <div>
          <span className={styles.statusBadge}>{statusText}</span>
        </div>

        {/* Explanatory Message */}
        <p className={styles.helperText}>
          We&apos;ll review your application within 24–48 hours.
          <br />
          You&apos;ll receive a notification once approved.
        </p>
      </div>

      {/* Action Button: Desktop Inline / Mobile Fixed Bottom */}
      <div className={styles.actionWrapper}>
        <Link
          href="/seller/verification-status"
          className={styles.trackButton}
          onClick={onTrackStatus}
        >
          <span>Track verification</span>
        </Link>
      </div>
    </div>
  );
};

export default RegistrationSubmitted;
