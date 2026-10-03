"use client";

import React, { useState } from "react";
import { X, AlertTriangle, ShieldCheck, Loader2 } from "lucide-react";
import styles from "./CancelOrderModal.module.css";

export interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  sellerName?: string;
  totalAmount?: number | string;
  onConfirmCancel: (reason: string, customComment?: string) => Promise<boolean | void>;
}

const CANCELLATION_REASONS = [
  "Placed order by mistake / selected wrong items",
  "Estimated delivery time is too long / unexpected delay",
  "Need to change delivery address or phone number",
  "Forgot to apply promo code / change payment method",
  "Other reason",
];

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  isOpen,
  onClose,
  orderId,
  sellerName,
  totalAmount,
  onConfirmCancel,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>(CANCELLATION_REASONS[0]);
  const [customComment, setCustomComment] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const result = await onConfirmCancel(selectedReason, customComment.trim());
      if (result !== false) {
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to cancel order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formattedOrderId = (orderId || "").replace(/^NCB-|^NCR-/, "").slice(0, 8).toUpperCase();

  return (
    <div className={styles.overlay} onClick={loading ? undefined : onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.iconWrapper}>
              <AlertTriangle size={22} strokeWidth={2.4} />
            </div>
            <div className={styles.titleGroup}>
              <h2 className={styles.modalTitle}>Cancel Order</h2>
              <p className={styles.orderMeta}>
                Order #{formattedOrderId}
                {sellerName ? ` • ${sellerName}` : ""}
                {totalAmount !== undefined && totalAmount !== null ? ` • ₹${totalAmount}` : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {errorMessage && (
            <div className={styles.errorBanner}>
              {errorMessage}
            </div>
          )}

          <div>
            <h3 className={styles.sectionLabel}>Select Reason for Cancellation</h3>
            <div className={styles.reasonsList}>
              {CANCELLATION_REASONS.map((reason) => {
                const isSelected = selectedReason === reason;
                return (
                  <div
                    key={reason}
                    className={`${styles.reasonCard} ${isSelected ? styles.reasonCardActive : ""}`}
                    onClick={() => setSelectedReason(reason)}
                  >
                    <div className={styles.reasonLeft}>
                      <div className={styles.radioCircle}>
                        {isSelected && <div className={styles.radioInner} />}
                      </div>
                      <span className={styles.reasonText}>{reason}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Reason / Feedback Input (Max 50 characters) */}
          <div className={styles.customReasonBox}>
            <label className={styles.sectionLabel} htmlFor="custom-cancel-reason">
              Additional Details (Optional)
            </label>
            <div className={styles.textareaWrapper}>
              <textarea
                id="custom-cancel-reason"
                className={styles.customTextarea}
                placeholder="Tell us why you want to cancel (up to 50 chars)..."
                maxLength={50}
                value={customComment}
                onChange={(e) => setCustomComment(e.target.value)}
                disabled={loading}
              />
              <div className={styles.charCount}>
                {customComment.length} / 50 characters
              </div>
            </div>
          </div>

          {/* Instant Refund Reassurance Note */}
          <div className={styles.refundNote}>
            <ShieldCheck size={18} className={styles.refundIcon} />
            <p className={styles.refundText}>
              {Number(totalAmount) === 0 ? (
                <>
                  <strong>100% Discount Applied:</strong> Since ₹0 was paid for this order, it will be cancelled immediately with ₹0 refundable amount.
                </>
              ) : (
                <>
                  <strong>100% Refund Guarantee:</strong> Since the restaurant has not started preparing your meal yet, your order will be cancelled instantly and any online payment will be refunded to your original source.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Actions Footer */}
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.keepOrderBtn}
            onClick={onClose}
            disabled={loading}
          >
            Keep My Order
          </button>
          <button
            type="button"
            className={styles.cancelConfirmBtn}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                <span>Cancelling Order...</span>
              </>
            ) : (
              <>
                <X size={16} strokeWidth={2.4} />
                <span>Cancel Order</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelOrderModal;
