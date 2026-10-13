"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import styles from "./PauseSubscription.module.css";
import {
  PauseCircle,
  PlayCircle,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  X,
  History,
  ShieldCheck,
} from "lucide-react";

export interface PauseHistoryItem {
  id?: string;
  pausedAt?: string;
  pauseEndDate?: string;
  requestedDays?: number;
  actualDaysUsed?: number;
  resumedAt?: string | null;
  status?: string;
  newEndDate?: string;
}

export interface PauseSubscriptionProps {
  initialPaused?: boolean;
  isPaused?: boolean;
  disabled?: boolean;
  allowPause?: boolean;
  pausePolicyNote?: string;
  pauseBillingPeriod?: string;
  usedPauseDays?: number;
  pausedAt?: string | null;
  pauseEndDate?: string | null;
  pauseHistory?: PauseHistoryItem[];
  currentEndDate?: string | null;
  planName?: string;
  onTogglePause?: (paused: boolean, days?: number) => void;
}

const parseAllowedDays = (period?: string): number => {
  const p = (period || "").trim().toLowerCase();
  if (!p || p === "none" || p === "disabled" || p === "false") return 0;
  if (p.includes("30") || p.includes("month")) return 30;
  if (p.includes("14") || p.includes("2 week")) return 14;
  if (p.includes("7") || p.includes("1 week") || p.includes("week")) return 7;
  const match = p.match(/\d+/);
  if (match) return parseInt(match[0], 10);
  return 7;
};

const formatDate = (iso?: string | null): string => {
  if (!iso) return "N/A";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "N/A";
  }
};

export const PauseSubscription: React.FC<PauseSubscriptionProps> = ({
  initialPaused = false,
  isPaused: controlledPaused,
  disabled = false,
  allowPause = true,
  pausePolicyNote,
  pauseBillingPeriod = "7 Days",
  usedPauseDays = 0,
  pausedAt,
  pauseEndDate,
  pauseHistory = [],
  currentEndDate,
  planName = "Meal Plan",
  onTogglePause,
}) => {
  const router = useRouter();
  const { data: session } = useSession();

  const [internalPaused, setInternalPaused] = useState<boolean>(
    controlledPaused !== undefined ? controlledPaused : initialPaused
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number>(1);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (controlledPaused !== undefined) {
      setInternalPaused(controlledPaused);
    }
  }, [controlledPaused]);

  const activePaused = controlledPaused !== undefined ? controlledPaused : internalPaused;

  const totalAllowed = parseAllowedDays(pauseBillingPeriod);
  const remainingDays = Math.max(0, totalAllowed - (usedPauseDays || 0));
  const isPauseDisabledBySeller = allowPause === false || totalAllowed <= 0;
  const isQuotaExhausted = !activePaused && remainingDays <= 0;
  const isSwitchDisabled = disabled || isPauseDisabledBySeller || isQuotaExhausted;

  useEffect(() => {
    if (remainingDays > 0 && selectedDays > remainingDays) {
      setSelectedDays(remainingDays);
    } else if (remainingDays > 0 && selectedDays < 1) {
      setSelectedDays(1);
    }
  }, [remainingDays, selectedDays]);

  const handleToggleClick = () => {
    if (isSwitchDisabled) return;
    if (!session?.user) {
      router.push("/login?callbackUrl=/my-subscription");
      return;
    }

    if (activePaused) {
      // User is currently paused and wants to resume
      setIsResumeModalOpen(true);
    } else {
      // User wants to pause: open day selection modal
      setSelectedDays(1);
      setIsModalOpen(true);
    }
  };

  const handleConfirmPause = () => {
    setIsModalOpen(false);
    setInternalPaused(true);
    if (onTogglePause) {
      onTogglePause(true, selectedDays);
    }
  };

  const handleConfirmResume = () => {
    setIsResumeModalOpen(false);
    setInternalPaused(false);
    if (onTogglePause) {
      onTogglePause(false);
    }
  };

  if (isPauseDisabledBySeller) {
    return (
      <div className={`${styles.container} ${styles.disabledContainer}`}>
        <div className={styles.left}>
          <div className={styles.iconSquare} style={{ backgroundColor: "#F8FAFC" }}>
            <PauseCircle size={24} className={styles.icon} style={{ color: "#94A3B8" }} />
          </div>
          <div>
            <h3 className={styles.title} style={{ color: "#64748B" }}>Pause Subscription</h3>
            <p className={styles.subtitle} style={{ color: "#94A3B8" }}>
              {pausePolicyNote || "No pause available for this meal plan configured by the kitchen partner."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate prospective dates for modal preview
  const prospectiveResumeDate = new Date(Date.now() + selectedDays * 24 * 60 * 60 * 1000);
  const prospectiveExtendedEndDate = currentEndDate
    ? new Date(new Date(currentEndDate).getTime() + selectedDays * 24 * 60 * 60 * 1000)
    : prospectiveResumeDate;

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div className={`${styles.container} ${isSwitchDisabled ? styles.disabledContainer : ""}`}>
        <div className={styles.left}>
          <div className={styles.iconSquare} style={{ backgroundColor: activePaused ? "#FFF7ED" : "#FFFFFF" }}>
            <PauseCircle size={24} className={styles.icon} style={{ color: activePaused ? "#EA580C" : "#F97316" }} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <h3 className={styles.title}>Pause Meal Subscription</h3>
              <span
                style={{
                  fontSize: "0.74rem",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "999px",
                  backgroundColor: activePaused
                    ? "#FEF3C7"
                    : remainingDays > 0
                    ? "#F0FDF4"
                    : "#FEE2E2",
                  color: activePaused
                    ? "#B45309"
                    : remainingDays > 0
                    ? "#15803D"
                    : "#B91C1C",
                  border: `1px solid ${
                    activePaused ? "#FDE68A" : remainingDays > 0 ? "#BBF7D0" : "#FECACA"
                  }`,
                }}
              >
                {activePaused
                  ? "⏸️ Paused"
                  : remainingDays > 0
                  ? `✨ ${remainingDays} of ${totalAllowed} days quota left`
                  : "Quota exhausted (0 days left)"}
              </span>
            </div>

            <p className={styles.subtitle}>
              {activePaused
                ? "Your subscription is currently paused. Deliveries are stopped."
                : isQuotaExhausted
                ? `You have used all ${totalAllowed} pause days allowed for this plan.`
                : `Pause up to ${remainingDays} days. Paused days extend your active plan duration automatically.`}
            </p>
          </div>
        </div>

        {/* Interactive Toggle Switch */}
        <button
          type="button"
          role="switch"
          aria-checked={activePaused}
          disabled={isSwitchDisabled}
          className={`${styles.toggleSwitch} ${activePaused ? styles.toggleActive : ""} ${
            isSwitchDisabled ? styles.toggleDisabled : ""
          }`}
          onClick={handleToggleClick}
          aria-label="Pause Subscription Switch"
          title={
            isQuotaExhausted
              ? "All pause days used for this meal subscription"
              : activePaused
              ? "Click to resume your subscription"
              : `Click to pause subscription (up to ${remainingDays} days available)`
          }
        >
          <div className={styles.toggleThumb} />
        </button>
      </div>

      {/* Active Pause Info Banner */}
      {activePaused && (
        <div className={styles.activeBanner}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700 }}>
            <Clock size={16} color="#B45309" />
            <span>Currently Paused — Meal Preparation & Delivery Frozen</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "2px" }}>
            {pausedAt && (
              <div>
                <strong>Paused On:</strong> {formatDate(pausedAt)}
              </div>
            )}
            {pauseEndDate && (
              <div>
                <strong>Scheduled Resume:</strong> {formatDate(pauseEndDate)}
              </div>
            )}
            {currentEndDate && (
              <div>
                <strong>Plan Extended Expiry:</strong> {formatDate(currentEndDate)}
              </div>
            )}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#B45309", marginTop: "4px" }}>
            💡 You can resume anytime! Early resumption saves your remaining pause quota.
          </div>
        </div>
      )}

      {/* Pause History Collapsible Section */}
      {pauseHistory && pauseHistory.length > 0 && (
        <div className={styles.historySection}>
          <button
            type="button"
            className={styles.historyToggle}
            onClick={() => setShowHistory(!showHistory)}
          >
            <History size={14} />
            <span>View Pause History ({pauseHistory.length})</span>
            {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showHistory && (
            <div className={styles.historyList}>
              {pauseHistory.map((item, index) => (
                <div key={item.id || index} className={styles.historyItem}>
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      {formatDate(item.pausedAt)} — {item.resumedAt ? formatDate(item.resumedAt) : formatDate(item.pauseEndDate)}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                      Requested: {item.requestedDays || 1} day{(item.requestedDays || 1) > 1 ? "s" : ""}
                      {item.actualDaysUsed !== undefined && item.actualDaysUsed !== item.requestedDays && (
                        <span> • Consumed: {item.actualDaysUsed} days</span>
                      )}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "6px",
                      backgroundColor:
                        item.status === "PAUSED"
                          ? "#FEF3C7"
                          : item.status === "RESUMED_EARLY"
                          ? "#EFF6FF"
                          : "#F1F5F9",
                      color:
                        item.status === "PAUSED"
                          ? "#B45309"
                          : item.status === "RESUMED_EARLY"
                          ? "#1D4ED8"
                          : "#475569",
                    }}
                  >
                    {item.status === "PAUSED"
                      ? "Active"
                      : item.status === "RESUMED_EARLY"
                      ? "Resumed Early"
                      : "Completed"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Pause Duration Selection */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <PauseCircle size={20} color="#FF6B00" />
                <span>Pause Meal Subscription</span>
              </h3>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.86rem",
                    fontWeight: 700,
                    color: "#334155",
                    marginBottom: "6px",
                  }}
                >
                  Select Pause Duration (Days)
                </label>
                <select
                  className={styles.selectDropdown}
                  value={selectedDays}
                  onChange={(e) => setSelectedDays(Number(e.target.value))}
                >
                  {Array.from({ length: remainingDays }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day}>
                      {day} Day{day > 1 ? "s" : ""}{day === remainingDays ? " (Max Available Quota)" : ""}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: "0.76rem", color: "#64748B", marginTop: "4px", display: "block" }}>
                  Kitchen Partner Policy: Maximum {totalAllowed} days allowed per subscription cycle.
                </span>
              </div>

              {/* Live Preview Box */}
              <div className={styles.previewBox}>
                <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#C2410C", marginBottom: "4px" }}>
                  📋 Pause Summary & Validity Extension
                </div>
                <div className={styles.previewRow}>
                  <span>Pause Duration:</span>
                  <strong>{selectedDays} Day{selectedDays > 1 ? "s" : ""}</strong>
                </div>
                <div className={styles.previewRow}>
                  <span>Meals Resume On:</span>
                  <strong>{formatDate(prospectiveResumeDate.toISOString())}</strong>
                </div>
                <div className={styles.previewRow}>
                  <span>Plan Validity Added:</span>
                  <span style={{ color: "#16A34A", fontWeight: 800 }}>+{selectedDays} Days Added</span>
                </div>
                <div className={styles.previewRow}>
                  <span>New Subscription End Date:</span>
                  <strong>{formatDate(prospectiveExtendedEndDate.toISOString())}</strong>
                </div>
                <div className={styles.previewRow}>
                  <span>Remaining Quota After:</span>
                  <strong>{remainingDays - selectedDays} of {totalAllowed} Days</strong>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.confirmBtn}
                onClick={handleConfirmPause}
              >
                <PauseCircle size={16} />
                <span>Confirm Pause ({selectedDays} Day{selectedDays > 1 ? "s" : ""})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Resume Subscription Confirmation */}
      {isResumeModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsResumeModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <PlayCircle size={20} color="#16A34A" />
                <span>Resume Meal Subscription</span>
              </h3>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setIsResumeModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <p style={{ margin: 0, fontSize: "0.92rem", color: "#334155", lineHeight: 1.5 }}>
                Are you ready to resume your daily meals for <strong>{planName}</strong>?
              </p>

              <div className={styles.previewBox} style={{ background: "#F0FDF4", borderColor: "#DCFCE7", color: "#166534" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 800 }}>
                  <ShieldCheck size={18} color="#16A34A" />
                  <span>Fair Quota Accounting</span>
                </div>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.84rem" }}>
                  Your daily meals will restart immediately on the kitchen roster. Any unused pause days from this period are automatically refunded back to your pause quota!
                </p>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setIsResumeModalOpen(false)}
              >
                Keep Paused
              </button>
              <button
                type="button"
                className={styles.confirmBtn}
                style={{ background: "linear-gradient(135deg, #16A34A 0%, #15803D 100%)", boxShadow: "0 4px 12px rgba(22, 163, 74, 0.25)" }}
                onClick={handleConfirmResume}
              >
                <PlayCircle size={16} />
                <span>Resume Subscription</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
