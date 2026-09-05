"use client";

import React from "react";
import { Check, Info } from "lucide-react";
import styles from "./VerificationStatus.module.css";

export interface VerificationStatusProps {
  trackingId?: string;
  statusBadgeText?: string;
  noticeTitle?: string;
  noticeDescription?: string;
}

export const VerificationStatus: React.FC<VerificationStatusProps> = ({
  trackingId = "NCR-2024-0847",
  statusBadgeText = "PENDING REVIEW",
  noticeTitle = "Administrator Reviewing Documents",
  noticeDescription = "An auditor is currently cross-referencing your FSSAI certificate and tax documents with NY state registrar vaults.",
}) => {
  return (
    <div className={styles.container}>
      {/* Box 1: Verification Tracking Header Card */}
      <div className={styles.headerCard}>
        <div className={styles.headerLeft}>
          <h2 className={styles.headerTitle}>Verification Tracking</h2>
          <p className={styles.trackingIdText}>ID: {trackingId}</p>
        </div>
        <div className={styles.pendingBadge}>{statusBadgeText}</div>
      </div>

      {/* Box 2: Blue Notice Alert Card */}
      <div className={styles.noticeCard}>
        <div className={styles.noticeIconCircle}>
          <Info size={18} strokeWidth={2.5} />
        </div>
        <div className={styles.noticeContent}>
          <h3 className={styles.noticeTitle}>{noticeTitle}</h3>
          <p className={styles.noticeText}>{noticeDescription}</p>
        </div>
      </div>

      {/* Box 3: Application History Timeline Card */}
      <div className={styles.historyCard}>
        <h3 className={styles.historyTitle}>Application History</h3>

        <div className={styles.timelineList}>
          {/* Step 1: Completed */}
          <div className={styles.timelineItem}>
            <div className={styles.nodeColumn}>
              <div className={`${styles.nodeCircle} ${styles.nodeCompleted}`}>
                <Check size={14} strokeWidth={3} />
              </div>
              <div className={`${styles.connectingLine} ${styles.lineCompleted}`} />
            </div>
            <div className={styles.itemContent}>
              <h4 className={`${styles.itemHeading} ${styles.itemHeadingCompleted}`}>
                Onboarding Form Submitted
              </h4>
              <p className={`${styles.itemSubtitle} ${styles.itemSubtitleRegular}`}>
                August 14, 2024 - 10:14 AM
              </p>
            </div>
          </div>

          {/* Step 2: Under Administrative Review (Active / Amber) */}
          <div className={styles.timelineItem}>
            <div className={styles.nodeColumn}>
              <div className={`${styles.nodeCircle} ${styles.nodeActive}`}>
                <div className={styles.nodeActiveDot} />
              </div>
              <div className={`${styles.connectingLine} ${styles.linePending}`} />
            </div>
            <div className={styles.itemContent}>
              <h4 className={`${styles.itemHeading} ${styles.itemHeadingActive}`}>
                Under Administrative Review
              </h4>
              <p className={`${styles.itemSubtitle} ${styles.itemSubtitleRegular}`}>
                Your file was successfully assigned to auditor ID #4928.
              </p>
            </div>
          </div>

          {/* Step 3: Final Validation Decision (Upcoming / Muted) */}
          <div className={styles.timelineItem}>
            <div className={styles.nodeColumn}>
              <div className={`${styles.nodeCircle} ${styles.nodeUpcoming}`}>
                3
              </div>
            </div>
            <div className={styles.itemContent}>
              <h4 className={`${styles.itemHeading} ${styles.itemHeadingUpcoming}`}>
                Final Validation Decision
              </h4>
              <p className={`${styles.itemSubtitle} ${styles.itemSubtitleMuted}`}>
                Pending review outcome. You will be notified via email.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationStatus;
