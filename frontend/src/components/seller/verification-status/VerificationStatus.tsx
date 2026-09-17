"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ArrowRight, CheckCircle2, ShieldAlert, FileQuestion, Lock, Loader2 } from "lucide-react";
import { useSellerProfile, updateCachedProfile } from "@/hooks/useSellerProfile";
import { fetchApi } from "@/lib/fetch-api";
import { performLogout } from "@/lib/logout";
import styles from "./VerificationStatus.module.css";

export interface TimelineStep {
  id: string;
  title: string;
  subtitle: string;
  status: "completed" | "in_progress" | "upcoming";
}

export interface VerificationStatusProps {
  trackingId?: string;
  status?: "PENDING" | "REVISION" | "APPROVED" | "REJECTED" | string;
  verificationNote?: string | null;
  statusBadgeText?: string;
  noticeText?: string;
  steps?: TimelineStep[];
}

export const VerificationStatus: React.FC<VerificationStatusProps> = ({
  trackingId: propTrackingId,
  status: propStatus,
  verificationNote: propNote,
  statusBadgeText: propBadgeText,
  noticeText: propNoticeText,
  steps: propSteps,
}) => {
  const router = useRouter();
  const seller = useSellerProfile();
  const [effectiveTrackingId, setEffectiveTrackingId] = useState(propTrackingId || "");
  const [currentStatus, setCurrentStatus] = useState<string>(propStatus || "PENDING");
  const [currentNote, setCurrentNote] = useState<string | null>(propNote || null);

  useEffect(() => {
    if (propTrackingId) {
      setEffectiveTrackingId(propTrackingId);
    } else if (seller.profile?.trackingId) {
      setEffectiveTrackingId(seller.profile.trackingId);
    } else if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const urlTracking = urlParams.get("trackingId");
      if (urlTracking) setEffectiveTrackingId(urlTracking);
    }

    if (propStatus) {
      setCurrentStatus(propStatus);
    } else if (seller.profile?.verificationStatus) {
      setCurrentStatus(seller.profile.verificationStatus);
    }

    if (propNote !== undefined) {
      setCurrentNote(propNote);
    } else if (seller.profile?.verificationNote !== undefined) {
      setCurrentNote(seller.profile.verificationNote);
    }
  }, [seller.profile, propTrackingId, propStatus, propNote]);

  // Fallback direct load if user is authenticated and profile state is still pending
  useEffect(() => {
    let isMounted = true;
    async function loadDirect() {
      if (seller.authStatus === "authenticated") {
        try {
          const res = await fetchApi("/api/seller/profile");
          if (res.ok) {
            const data = await res.json();
            const prof = data.data?.profile || data.profile;
            const usr = data.data?.user || data.user;
            if (prof && isMounted) {
              if (prof.trackingId && !propTrackingId) setEffectiveTrackingId(prof.trackingId);
              if (prof.verificationStatus && !propStatus) setCurrentStatus(prof.verificationStatus);
              if (prof.verificationNote !== undefined && propNote === undefined) setCurrentNote(prof.verificationNote);
              updateCachedProfile({
                user: usr,
                profile: prof,
                isOnline: prof.isOnline ?? true,
              });
            }
          }
        } catch {}
      }
    }
    loadDirect();
    return () => { isMounted = false; };
  }, [seller.authStatus, propTrackingId, propStatus, propNote]);

  const isApproved = currentStatus === "APPROVED";
  const isRevision = currentStatus === "REVISION";
  const isRejected = currentStatus === "REJECTED";

  // Auto redirect approved sellers to seller operations dashboard
  useEffect(() => {
    if (isApproved && seller.authStatus === "authenticated") {
      const timer = setTimeout(() => {
        router.replace("/seller/dashboard");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isApproved, seller.authStatus, router]);

  // Loading State
  if (seller.authStatus === "loading" || (seller.isLoading && !propTrackingId)) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <Loader2 className="animate-spin" size={32} color="#ea580c" />
          <p className={styles.loadingText}>Loading verification status...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated State
  if (seller.authStatus === "unauthenticated" && !propTrackingId) {
    return (
      <div className={styles.container}>
        <div className={styles.authRequiredCard}>
          <div className={styles.authIconCircle}>
            <Lock size={30} />
          </div>
          <h2 className={styles.authTitle}>Login Required</h2>
          <p className={styles.authSubtitle}>
            Please log in to your partner account to view your application and verification status.
          </p>
          <Link href="/seller/login?callbackUrl=/seller/verification-status" className={styles.loginBtn}>
            <span>Log In to Partner Console</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  // Check if an application was actually submitted
  const hasApplication = Boolean(
    effectiveTrackingId ||
    (seller.profile?.trackingId) ||
    (seller.profile?.verificationStatus && seller.profile.verificationStatus !== "NONE")
  );

  // No Application Found State
  if (!hasApplication) {
    return (
      <div className={styles.container}>
        <div className={styles.noAppCard}>
          <div className={styles.noAppIconCircle}>
            <FileQuestion size={32} />
          </div>
          <h2 className={styles.noAppTitle}>No Application Submitted</h2>
          <p className={styles.noAppSubtitle}>
            You haven&apos;t submitted a partner registration application yet. Please complete the registration steps to onboard your kitchen or property.
          </p>
          <Link href="/seller/registration" className={styles.startRegBtn}>
            <span>Start Registration</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  // Dedicated Approved State (while redirecting or direct viewing)
  if (isApproved) {
    return (
      <div className={styles.container}>
        <div className={styles.trackingCard}>
          <div className={styles.trackingLeft}>
            <span className={styles.trackingLabel}>Tracking ID</span>
            <h2 className={styles.trackingValue}>
              {effectiveTrackingId || "Approved"}
            </h2>
          </div>
          <div className={`${styles.statusBadge} ${styles.statusBadgeApproved}`}>Approved</div>
        </div>

        <div className={styles.approvedBanner}>
          <div className={styles.revisionHeader}>
            <CheckCircle2 size={26} color="#16a34a" />
            <h3 className={styles.approvedTitle}>Account Verified & Approved!</h3>
          </div>
          <p className={styles.approvedText}>
            Your kitchen registration has been approved. Redirecting you to your seller operations dashboard...
          </p>
          <Link href="/seller/dashboard" className={styles.approvedActionBtn}>
            <span>Open Seller Dashboard</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  // Dedicated Rejected State (no normal 4-step timeline, blocks dashboard)
  if (isRejected) {
    return (
      <div className={styles.container}>
        <div className={styles.trackingCard}>
          <div className={styles.trackingLeft}>
            <span className={styles.trackingLabel}>Tracking ID</span>
            <h2 className={styles.trackingValue}>
              {effectiveTrackingId || "Application"}
            </h2>
          </div>
          <div className={`${styles.statusBadge} ${styles.statusBadgeRejected}`}>Rejected</div>
        </div>

        <div className={styles.rejectedCard}>
          <div className={styles.rejectedIconCircle}>
            <ShieldAlert size={36} color="#dc2626" />
          </div>
          <h2 className={styles.rejectedTitle}>Application Declined</h2>
          <p className={styles.rejectedSubtitle}>
            We appreciate your interest in partner onboarding. Unfortunately, your registration could not be approved at this time.
          </p>
          {currentNote && (
            <div className={styles.rejectionNoteBox}>
              <strong>Reason from Review Team:</strong>
              <p>{currentNote}</p>
            </div>
          )}
          <div className={styles.rejectedActions}>
            <Link href="/seller/registration" className={styles.reapplyBtn}>
              <span>Reapply with New Information</span>
              <ArrowRight size={15} style={{ marginLeft: "6px" }} />
            </Link>
            <Link href="/seller/support" className={styles.contactSupportBtn}>
              Contact Support
            </Link>
            <button
              type="button"
              onClick={() => performLogout({ role: "SELLER" })}
              className={styles.signOutBtn}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Standard Pending / Revision Step Timeline
  const resolvedSteps: TimelineStep[] = propSteps || [
    {
      id: "submitted",
      title: "Application submitted",
      subtitle: "Completed",
      status: "completed",
    },
    {
      id: "review",
      title: isRevision ? "Revision requested" : "Under review",
      subtitle: isRevision ? "Action needed" : "In progress",
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

  const resolvedBadgeText =
    propBadgeText || (isRevision ? "Action Required" : "Under Review");

  const resolvedBadgeClass = isRevision
    ? styles.statusBadgeRevision
    : styles.statusBadgePending;

  const resolvedNoticeText =
    propNoticeText ||
    (isRevision
      ? "The admin team has requested modifications to your application. Please correct the flagged documents."
      : "Your application is being reviewed. We'll notify you within 24–48 hours.");

  return (
    <div className={styles.container}>
      {/* Card 1: Tracking ID & Status */}
      <div className={styles.trackingCard}>
        <div className={styles.trackingLeft}>
          <span className={styles.trackingLabel}>Tracking ID</span>
          <h2 className={styles.trackingValue}>
            {effectiveTrackingId || (seller.isLoading ? "Loading..." : "Pending Verification")}
          </h2>
        </div>
        <div className={`${styles.statusBadge} ${resolvedBadgeClass}`}>{resolvedBadgeText}</div>
      </div>

      {/* Revision Banner if status is REVISION */}
      {isRevision && (
        <div className={styles.revisionBanner}>
          <div className={styles.revisionHeader}>
            <div className={styles.revisionIconCircle}>!</div>
            <h3 className={styles.revisionTitle}>Action Required on Your Application</h3>
          </div>
          <div className={styles.revisionNoteBox}>
            {currentNote || "Please re-upload the requested documents to continue your onboarding."}
          </div>
          <Link href="/seller/revision" className={styles.revisionActionBtn}>
            <span>Correct & Resubmit Documents</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* Card 2: Status Timeline */}
      <div className={styles.timelineCard}>
        <h3 className={styles.timelineHeading}>Status Timeline</h3>

        <div className={styles.timelineList}>
          {resolvedSteps.map((step, index) => {
            const isLast = index === resolvedSteps.length - 1;
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
      {resolvedNoticeText && (
        <div className={styles.noticeCard}>
          <p className={styles.noticeText}>{resolvedNoticeText}</p>
        </div>
      )}
    </div>
  );
};

export default VerificationStatus;

