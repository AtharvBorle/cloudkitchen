"use client";

import React from "react";
import { Check } from "lucide-react";
import styles from "./VerificationStatus.module.css";

export interface TimelineStep {
  id: string;
  title: string;
  subtitle: string;
  status: "completed" | "in_progress" | "upcoming";
}

export interface VerificationStatusProps {
  trackingId?: string;
  statusBadgeText?: string;
  noticeText?: string;
  steps?: TimelineStep[];
}

const DEFAULT_STEPS: TimelineStep[] = [
  {
    id: "submitted",
    title: "Application submitted",
    subtitle: "Completed",
    status: "completed",
  },
  {
    id: "review",
    title: "Under review",
    subtitle: "In progress",
    status: "in_progress",
  },
  {
    id: "complete",
    title: "Verification complete",
    subtitle: "Upcoming",
    status: "upcoming",
  },
  {
    id: "activated",
    title: "Account activated",
    subtitle: "Upcoming",
    status: "upcoming",
  },
];

export const VerificationStatus: React.FC<VerificationStatusProps> = ({
  trackingId = "NCR-2026-0847",
  statusBadgeText = "Pending",
  noticeText = "Your application is being reviewed. We'll notify you within 24–48 hours.",
  steps = DEFAULT_STEPS,
}) => {
  return (
    <div className={styles.container}>
      {/* Card 1: Tracking ID & Status */}
      <div className={styles.trackingCard}>
        <div className={styles.trackingLeft}>
          <span className={styles.trackingLabel}>Tracking ID</span>
          <h2 className={styles.trackingValue}>{trackingId}</h2>
        </div>
        <div className={styles.statusBadge}>{statusBadgeText}</div>
      </div>

      {/* Card 2: Status Timeline */}
      <div className={styles.timelineCard}>
        <h3 className={styles.timelineHeading}>Status Timeline</h3>

        <div className={styles.timelineList}>
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1;
            const isCompleted = step.status === "completed";
            const isInProgress = step.status === "in_progress";
            const isUpcoming = step.status === "upcoming";

            return (
              <div key={step.id} className={styles.timelineItem}>
                <div className={styles.nodeColumn}>
                  {/* Node Circle */}
                  {isCompleted && (
                    <div className={`${styles.nodeCircle} ${styles.nodeCompleted}`}>
                      <Check size={14} strokeWidth={3} className={styles.checkIcon} />
                    </div>
                  )}
                  {isInProgress && (
                    <div className={`${styles.nodeCircle} ${styles.nodeInProgress}`}>
                      <div className={styles.nodeDotInProgress} />
                    </div>
                  )}
                  {isUpcoming && (
                    <div className={`${styles.nodeCircle} ${styles.nodeUpcoming}`}>
                      <div className={styles.nodeDotUpcoming} />
                    </div>
                  )}

                  {/* Connecting Line (if not last) */}
                  {!isLast && (
                    <div
                      className={`${styles.connectingLine} ${
                        isCompleted ? styles.lineCompleted : styles.linePending
                      }`}
                    />
                  )}
                </div>

                {/* Step Text Content */}
                <div className={styles.itemContent}>
                  <h4
                    className={`${styles.itemTitle} ${
                      isUpcoming ? styles.itemTitleUpcoming : styles.itemTitleActive
                    }`}
                  >
                    {step.title}
                  </h4>
                  <p
                    className={`${styles.itemSubtitle} ${
                      isUpcoming ? styles.itemSubtitleUpcoming : styles.itemSubtitleActive
                    }`}
                  >
                    {step.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Card 3: Helper Notice Card */}
      {noticeText && (
        <div className={styles.noticeCard}>
          <p className={styles.noticeText}>{noticeText}</p>
        </div>
      )}
    </div>
  );
};

export default VerificationStatus;

