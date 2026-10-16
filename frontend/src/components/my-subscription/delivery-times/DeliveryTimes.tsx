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
}

export interface DeliveryTimesProps {
  slots?: DeliverySlot[];
}

export const DeliveryTimes: React.FC<DeliveryTimesProps> = ({
  slots,
}) => {
  const displaySlots = Array.isArray(slots) ? slots : [];
  const [copiedSlotId, setCopiedSlotId] = useState<string | null>(null);

  const handleCopyOtp = (slotId: string, otpCode: string) => {
    if (!otpCode) return;
    navigator.clipboard?.writeText(otpCode);
    setCopiedSlotId(slotId);
    setTimeout(() => {
      setCopiedSlotId(null);
    }, 2500);
  };

  // Find any slots with an active OTP
  const activeOtpSlots = displaySlots.filter(
    (s) => s.deliveryOtp && !s.isDelivered
  );

  // Find any upcoming slots that will get OTP later today
  const upcomingOtpSlots = displaySlots.filter(
    (s) => !s.isDelivered && !s.deliveryOtp && (s.slotStartTime || s.otpAvailableAt)
  );

  return (
    <div className={styles.cardContainer}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 className={styles.cardHeading} style={{ margin: 0 }}>
          Daily Delivery Schedule & OTP
        </h3>
        {activeOtpSlots.length > 0 && (
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
        )}
      </div>

      {displaySlots.length === 0 ? (
        <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748B", lineHeight: "1.4" }}>
          Delivery timings will be provided as scheduled by your kitchen partner.
        </p>
      ) : (
        <div className={styles.slotsList}>
          {displaySlots.map((slot) => {
            const isDelivered = Boolean(slot.isDelivered);
            const isOverdue = Boolean(slot.isOverdue && !isDelivered);
            const isSkipped = slot.todayStatus === "SKIPPED_PAUSED";

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
                  <span className={styles.slotTime}>{slot.timeRange}</span>

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
