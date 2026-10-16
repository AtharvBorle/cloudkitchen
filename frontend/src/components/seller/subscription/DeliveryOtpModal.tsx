"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Key,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Phone,
  User,
  Loader2,
  Utensils,
  ShieldAlert,
} from "lucide-react";
import { MealSlotDeliveryRecord } from "@/lib/meal-subscriptions";

interface DeliveryOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (otp: string, note?: string) => Promise<void>;
  delivery: MealSlotDeliveryRecord | null;
}

export default function DeliveryOtpModal({
  isOpen,
  onClose,
  onConfirm,
  delivery,
}: DeliveryOtpModalProps) {
  const [otp, setOtp] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setOtp("");
      setNote("");
      setErrorMessage(null);
      setSubmitting(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, delivery]);

  if (!isOpen || !delivery) return null;

  const customerName =
    delivery.subscription?.user?.name ||
    delivery.customerName ||
    "Subscriber";
  const customerPhone =
    delivery.subscription?.user?.phone ||
    delivery.subscription?.contactPhone ||
    delivery.customerPhone ||
    "";
  const deliveryAddress =
    delivery.subscription?.deliveryAddress ||
    delivery.deliveryAddress ||
    "Address on record";
  const isOverdue = Boolean(delivery.isOverdue);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otp.trim();
    if (!cleanOtp) {
      setErrorMessage("Please enter the 6-digit delivery OTP.");
      inputRef.current?.focus();
      return;
    }
    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      setErrorMessage("The delivery OTP must be exactly 6 numeric digits.");
      inputRef.current?.focus();
      return;
    }

    setErrorMessage(null);
    setSubmitting(true);
    try {
      await onConfirm(cleanOtp, note.trim() || undefined);
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err?.message ||
          "Invalid Delivery OTP. Please ask the customer to check the OTP shown in their app notification or subscription."
      );
      inputRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(val);
    if (errorMessage) setErrorMessage(null);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        fontFamily: "var(--font-poppins), 'Poppins', -apple-system, sans-serif",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          maxWidth: "500px",
          width: "100%",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
          border: "1px solid #E2E8F0",
          animation: "fadeIn 0.15s ease-out",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #F1F5F9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: isOverdue ? "#FFF1F2" : "#FFF7ED",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: isOverdue ? "#FFE4E6" : "#FFEDD5",
                color: isOverdue ? "#E11D48" : "#EA580C",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Key size={20} />
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "17px",
                  fontWeight: 800,
                  color: isOverdue ? "#9F1239" : "#9A3412",
                  letterSpacing: "-0.01em",
                }}
              >
                {isOverdue ? "Verify Late Delivery via OTP" : "Verify Customer Delivery OTP"}
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: "12px",
                  color: isOverdue ? "#BE123C" : "#C2410C",
                  fontWeight: 500,
                }}
              >
                OTP confirmation is required to mark delivery
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              background: "none",
              border: "none",
              color: "#94A3B8",
              cursor: submitting ? "not-allowed" : "pointer",
              padding: "6px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} style={{ padding: "24px" }}>
          {/* Overdue Banner if window passed */}
          {isOverdue && (
            <div
              style={{
                backgroundColor: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: "10px",
                padding: "12px 14px",
                marginBottom: "18px",
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
              }}
            >
              <ShieldAlert size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div style={{ fontSize: "12.5px", color: "#991B1B", lineHeight: 1.45 }}>
                <strong>Delivery Window Ended {delivery.slotEndTime ? `(${delivery.slotEndTime})` : ""}:</strong>{" "}
                This delivery is late. You can still deliver it now by collecting the customer's OTP upon arrival.
              </div>
            </div>
          )}

          {/* Delivery Recipient Info Box */}
          <div
            style={{
              backgroundColor: "#F8FAFC",
              borderRadius: "12px",
              padding: "14px 16px",
              marginBottom: "20px",
              border: "1px solid #E2E8F0",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              fontSize: "13px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, color: "#0F172A" }}>
                <User size={15} color="#EA580C" />
                <span>{customerName}</span>
              </div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: "6px",
                  backgroundColor: "#FFF7ED",
                  color: "#C2410C",
                  border: "1px solid #FED7AA",
                }}
              >
                {delivery.slotName}
              </span>
            </div>

            {customerPhone && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748B" }}>
                <Phone size={14} color="#94A3B8" />
                <span>{customerPhone}</span>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", color: "#64748B" }}>
              <MapPin size={14} color="#94A3B8" style={{ flexShrink: 0, marginTop: "3px" }} />
              <span style={{ lineHeight: 1.4 }}>{deliveryAddress}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748B" }}>
              <Clock size={14} color="#94A3B8" />
              <span>
                Scheduled Window: <strong>{delivery.scheduledTime || "Standard Window"}</strong>
              </span>
            </div>
          </div>

          {/* OTP Input Section */}
          <div style={{ marginBottom: "18px" }}>
            <label
              htmlFor="delivery-otp-input"
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 700,
                color: "#1E293B",
                marginBottom: "8px",
              }}
            >
              Enter Customer 6-Digit Delivery OTP:
            </label>

            <input
              ref={inputRef}
              id="delivery-otp-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otp}
              onChange={handleOtpChange}
              placeholder="• • • • • •"
              disabled={submitting}
              autoComplete="one-time-code"
              style={{
                width: "100%",
                padding: "14px 16px",
                fontSize: "24px",
                fontWeight: 800,
                letterSpacing: "0.45em",
                textAlign: "center",
                borderRadius: "10px",
                border: errorMessage ? "2px solid #EF4444" : "2px solid #CBD5E1",
                backgroundColor: "#F8FAFC",
                color: "#0F172A",
                outline: "none",
                fontFamily: "monospace",
                boxSizing: "border-box",
                transition: "all 0.15s ease",
              }}
            />

            <p style={{ margin: "6px 0 0 0", fontSize: "11.5px", color: "#64748B", textAlign: "center" }}>
              The customer can see this OTP on their in-app notifications or active subscription page.
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div
              style={{
                backgroundColor: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: "8px",
                padding: "10px 14px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#DC2626",
                fontSize: "12.5px",
                fontWeight: 600,
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Optional Delivery Note */}
          <div style={{ marginBottom: "22px" }}>
            <label
              htmlFor="delivery-note-input"
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "#64748B",
                marginBottom: "6px",
              }}
            >
              Delivery Note (Optional):
            </label>
            <input
              id="delivery-note-input"
              type="text"
              placeholder={isOverdue ? "e.g. Delivered late due to heavy rain" : "e.g. Left with security, handed to recipient"}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={submitting}
              style={{
                width: "100%",
                padding: "9px 12px",
                fontSize: "12.5px",
                borderRadius: "8px",
                border: "1px solid #CBD5E1",
                backgroundColor: "#F8FAFC",
                outline: "none",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: "10px 18px",
                borderRadius: "8px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #CBD5E1",
                color: "#475569",
                fontSize: "13px",
                fontWeight: 600,
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || otp.trim().length !== 6}
              style={{
                padding: "10px 22px",
                borderRadius: "8px",
                backgroundColor: isOverdue ? "#DC2626" : "#EA580C",
                border: "none",
                color: "#FFFFFF",
                fontSize: "13.5px",
                fontWeight: 700,
                cursor: submitting || otp.trim().length !== 6 ? "not-allowed" : "pointer",
                opacity: submitting || otp.trim().length !== 6 ? 0.6 : 1,
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 12px rgba(234, 88, 12, 0.25)",
                transition: "all 0.15s ease",
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Verifying OTP...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>{isOverdue ? "Verify & Deliver Late" : "Verify OTP & Deliver"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
