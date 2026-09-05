"use client";

import React from "react";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import styles from "./RegistrationSubmitted.module.css";

export interface RegistrationSubmittedProps {
  trackingId?: string;
  statusText?: string;
  onTrackStatus?: () => void;
}

export const RegistrationSubmitted: React.FC<RegistrationSubmittedProps> = ({
  trackingId = "NCR-2024-0847",
  statusText = "PENDING",
  onTrackStatus,
}) => {
  return (
    <div
      className={styles.cardContainer}
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 16,
        border: "1px solid #f1f5f9",
        boxShadow: "0 4px 25px -2px rgba(0, 0, 0, 0.04)",
        padding: "40px 48px 36px 48px",
        width: "100%",
        maxWidth: 700,
        margin: "0 auto 48px auto",
        boxSizing: "border-box",
        textAlign: "center",
      }}
    >
      {/* 1. Top Icon Circle */}
      <div className={styles.iconCircle}>
        <Check className={styles.checkIcon} />
      </div>

      {/* 2. Main Heading & Subtitle */}
      <h2 className={styles.title}>Registration Submitted!</h2>
      <p className={styles.subtitle}>
        Thank you for onboarding. Your application is now in queue and our
        verification team is reviewing your documents.
      </p>

      {/* 3. Tracking ID & Status Box */}
      <div className={styles.infoBox}>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Tracking ID</span>
          <span className={styles.trackingBadge}>{trackingId}</span>
        </div>
        <div className={styles.infoRowDivider} />
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Current Status</span>
          <span className={styles.statusBadge}>{statusText}</span>
        </div>
      </div>

      {/* 4. Evaluation Timeline Note */}
      <p className={styles.evaluationNote}>
        The evaluation process generally takes <strong>24 to 48 hours.</strong> We
        will send you an email confirmation as soon as your status updates.
      </p>

      {/* 5. Track Verification Status Button */}
      <Link
        href="/seller/verification"
        className={styles.trackButton}
        onClick={onTrackStatus}
      >
        <span>Track Verification Status</span>
        <ArrowRight className={styles.btnArrow} />
      </Link>
    </div>
  );
};

export default RegistrationSubmitted;
