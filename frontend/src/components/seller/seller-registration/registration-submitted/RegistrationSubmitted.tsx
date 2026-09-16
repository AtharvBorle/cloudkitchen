"use client";

import React from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { useSellerProfile } from "@/hooks/useSellerProfile";
import styles from "./RegistrationSubmitted.module.css";

export interface RegistrationSubmittedProps {
  trackingId?: string;
  statusText?: string;
  onTrackStatus?: () => void;
}

export const RegistrationSubmitted: React.FC<RegistrationSubmittedProps> = ({
  trackingId: propTrackingId,
  statusText = "Pending",
  onTrackStatus,
}) => {
  const seller = useSellerProfile();
  const trackingId = propTrackingId || seller.profile?.trackingId || "";

  const verificationUrl = trackingId
    ? `/seller/verification-status?trackingId=${encodeURIComponent(trackingId)}`
    : "/seller/verification-status";

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
        {trackingId ? (
          <>
            <span className={styles.trackingLabel}>TRACKING ID</span>
            <div className={styles.trackingBadge}>{trackingId}</div>
          </>
        ) : (
          <div style={{ margin: "8px 0 16px" }}>
            <span className={styles.trackingLabel}>Application Received</span>
          </div>
        )}

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
          href={verificationUrl}
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
