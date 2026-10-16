"use client";

import React, { useState } from "react";
import {
  Clock,
  Key,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { extractTimeRangeString, getSlotDeliveryTime } from "@/lib/meal-slots";
import styles from "./DeliveryTimes.module.css";

export interface DeliverySlot {
  id: string;
  name: string;
  timeRange: string;
  icon?: string;
  todayStatus?: string;
  isDelivered?: boolean;
  deliveredAt?: string | null;
  isOverdue?: boolean;
  isOtpActive?: boolean;
  timingStatus?: string;
  slotStartTime?: string;
  slotEndTime?: string;
  deliveryOtp?: string | null;
  otpAvailableAt?: string;
  isStarted?: boolean;
  startDateStr?: string;
}

export interface DeliveryTimesProps {
  slots?: DeliverySlot[];
  isStarted?: boolean;
  startDate?: string | null;
}

export const DeliveryTimes: React.FC<DeliveryTimesProps> = ({
  slots,
  isStarted: isStartedProp,
  startDate,
}) => {
  const displaySlots = Array.isArray(slots) ? slots : [];
  const [copiedSlotId, setCopiedSlotId] = useState<string | null>(null);

  // Check if subscription has started:
  // If isStartedProp is explicitly passed, use it. Otherwise, if any slot has isStarted === false, or if startDate is in future
  const isStarted = (() => {
    if (typeof isStartedProp === "boolean") return isStartedProp;
    if (displaySlots.some((s) => s.isStarted === false)) return false;
    if (startDate) {
      const start = new Date(startDate);
      if (!isNaN(start.getTime())) {
        const now = new Date();
        const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
        const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        return startDay <= todayDay;
      }
    }
    return true;
  })();

  const formattedStartDate = (() => {
    if (!startDate) return "";
    try {
      const d = new Date(startDate);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "";
    }
  })();

  const handleCopyOtp = (slotId: string, otpCode: string) => {
    if (!otpCode) return;
    navigator.clipboard?.writeText(otpCode);
    setCopiedSlotId(slotId);
    setTimeout(() => {
      setCopiedSlotId(null);
    }, 2500);
  };

  // Find any slots with an active OTP (only for started subscriptions)
  const activeOtpSlots = isStarted
    ? displaySlots.filter((s) => s.deliveryOtp && !s.isDelivered && s.isStarted !== false)
    : [];

  // Find any upcoming slots that will get OTP later today
  const upcomingOtpSlots = isStarted
    ? displaySlots.filter(
        (s) => !s.isDelivered && !s.deliveryOtp && (s.slotStartTime || s.otpAvailableAt)
      )
    : [];

  return (
    <div className={styles.cardContainer}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
        <h3 className={styles.cardHeading} style={{ margin: 0 }}>
          Daily Delivery Schedule & OTP
        </h3>
        {activeOtpSlots.length > 0 ? (
          <span
            style={{
              fontSize: "11px",
              fontWeight: 800,
              backgroundColor: "#DCFCE7",
              color: "#15803D",
              padding: "3px 8px",
              borderRadius: "6px",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Key size={12} />
            OTP Active
          </span>
        ) : !isStarted && formattedStartDate ? (
          <span
            style={{
              fontSize: "11px",
              fontWeight: 800,
              backgroundColor: "#EFF6FF",
              color: "#1D4ED8",
              padding: "3px 8px",
              borderRadius: "6px",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            Starts {formattedStartDate}
          </span>
        ) : null}
      </div>

      {!isStarted && formattedStartDate && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "#F0F9FF",
            border: "1px solid #BAE6FD",
            borderRadius: "10px",
            padding: "10px 14px",
            marginBottom: "14px",
            fontSize: "12.5px",
            color: "#0369A1",
            lineHeight: 1.4,
          }}
        >
          <Sparkles size={16} color="#0284C7" style={{ flexShrink: 0 }} />
          <span>
            This meal subscription starts on <strong>{formattedStartDate}</strong>. Delivery verification OTPs will be generated here during each scheduled meal window once deliveries begin.
          </span>
        </div>
      )}

      {displaySlots.length === 0 ? (
        <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748B", lineHeight: "1.4" }}>
          Delivery timings will be provided as scheduled by your kitchen partner.
        </p>
      ) : (
        <div className={styles.slotsList}>
          {displaySlots.map((slot) => {
            const isDelivered = Boolean(slot.isDelivered && isStarted);
            const isOverdue = Boolean(slot.isOverdue && !isDelivered && isStarted);
            const isSkipped = Boolean(slot.todayStatus === "SKIPPED_PAUSED" && isStarted);

            return (
              <div key={slot.id} className={styles.slotRow}>
                <div className={styles.slotNameCol}>
                  <Clock
                    size={16}
                    color={isOverdue ? "#DC2626" : isDelivered ? "#16A34A" : "#FF5500"}
                    style={{ flexShrink: 0 }}
                  />
                  <span className={styles.slotName}>{slot.name}</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {(() => {
                    const displayTime =
                      extractTimeRangeString(slot.timeRange) ||
                      (slot.slotStartTime && slot.slotEndTime ? `${slot.slotStartTime} - ${slot.slotEndTime}` : "") ||
                      getSlotDeliveryTime(slot.id);
                    return <span className={styles.slotTime}>{displayTime}</span>;
                  })()}

                  {isDelivered ? (
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        backgroundColor: "#DCFCE7",
                        color: "#15803D",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <CheckCircle2 size={12} />
                      Delivered
                    </span>
                  ) : isOverdue ? (
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        backgroundColor: "#FEF2F2",
                        color: "#DC2626",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <AlertCircle size={12} />
                      Delayed
                    </span>
                  ) : isSkipped ? (
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        backgroundColor: "#F1F5F9",
                        color: "#64748B",
                        padding: "3px 8px",
                        borderRadius: "6px",
                      }}
                    >
                      Paused
                    </span>
                  ) : !isStarted ? (
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        backgroundColor: "#EFF6FF",
                        color: "#2563EB",
                        padding: "3px 8px",
                        borderRadius: "6px",
                      }}
                    >
                      Scheduled
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Prominent Active Delivery OTP Section */}
      {activeOtpSlots.length > 0 && (
        <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {activeOtpSlots.map((slot) => {
            const isCopied = copiedSlotId === slot.id;
            const isOverdue = Boolean(slot.isOverdue);

            return (
              <div
                key={`otp-${slot.id}`}
                style={{
                  backgroundColor: isOverdue ? "#FFF1F2" : "#F0FDF4",
                  border: isOverdue ? "1.5px solid #FECDD3" : "1.5px solid #BBF7D0",
                  borderRadius: "14px",
                  padding: "16px 18px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        backgroundColor: isOverdue ? "#FFE4E6" : "#DCFCE7",
                        color: isOverdue ? "#E11D48" : "#16A34A",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Key size={16} />
                    </div>
                    <div>
                      <span style={{ fontSize: "13px", fontWeight: 800, color: isOverdue ? "#9F1239" : "#14532D" }}>
                        {slot.name} Verification OTP
                      </span>
                      <div style={{ fontSize: "11.5px", color: isOverdue ? "#BE123C" : "#166534" }}>
                        {isOverdue
                          ? `Delivery window passed (${slot.slotEndTime || ""}). Share upon arrival.`
                          : `Delivery window started (${slot.timeRange})`}
                      </div>
                    </div>
                  </div>

                  {isOverdue && (
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 800,
                        backgroundColor: "#FEE2E2",
                        color: "#DC2626",
                        padding: "3px 8px",
                        borderRadius: "6px",
                      }}
                    >
                      ⚠️ Delayed Delivery
                    </span>
                  )}
                </div>

                {/* 6-Digit OTP Code & Copy Button */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: "12px",
                    backgroundColor: "#FFFFFF",
                    padding: "10px 16px",
                    borderRadius: "10px",
                    border: isOverdue ? "1px solid #FECACA" : "1px solid #DCFCE7",
                  }}
                >
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: 900,
                      letterSpacing: "0.45em",
                      fontFamily: "monospace",
                      color: "#0F172A",
                    }}
                  >
                    {slot.deliveryOtp}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyOtp(slot.id, slot.deliveryOtp || "")}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "7px 14px",
                      borderRadius: "8px",
                      backgroundColor: isCopied ? "#DCFCE7" : "#0F172A",
                      color: isCopied ? "#15803D" : "#FFFFFF",
                      border: "none",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {isCopied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{isCopied ? "Copied" : "Copy OTP"}</span>
                  </button>
                </div>

                <p
                  style={{
                    margin: "8px 0 0 0",
                    fontSize: "11.5px",
                    color: isOverdue ? "#9F1239" : "#15803D",
                    lineHeight: 1.4,
                  }}
                >
                  🛡️ Provide this 6-digit OTP to the delivery executive when your meal arrives. They cannot complete delivery without this code.
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Upcoming OTP Notification helper */}
      {activeOtpSlots.length === 0 && upcomingOtpSlots.length > 0 && (
        <div
          style={{
            marginTop: "16px",
            backgroundColor: "#F8FAFC",
            border: "1px dashed #CBD5E1",
            borderRadius: "10px",
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "12px",
            color: "#64748B",
            lineHeight: 1.4,
          }}
        >
          <Key size={16} color="#94A3B8" style={{ flexShrink: 0 }} />
          <span>
            Today&apos;s meal delivery OTP will automatically unlock when each scheduled delivery window begins (e.g. at{" "}
            <strong>{upcomingOtpSlots[0]?.slotStartTime || "delivery start time"}</strong>).
          </span>
        </div>
      )}
    </div>
  );
};
