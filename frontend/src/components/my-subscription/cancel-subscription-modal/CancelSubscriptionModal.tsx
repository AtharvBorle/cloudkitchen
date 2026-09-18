"use client";

import React, { useState } from "react";
import { AlertTriangle, X, Loader2, ShieldCheck } from "lucide-react";
import styles from "./CancelSubscriptionModal.module.css";
import { cancelUserSubscription } from "@/lib/meal-subscriptions";

export interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionId: string;
  planName?: string;
  sellerName?: string;
  onCancelled: () => void;
}

export const CancelSubscriptionModal: React.FC<CancelSubscriptionModalProps> = ({
  isOpen,
  onClose,
  subscriptionId,
  planName = "Meal Plan",
  sellerName = "Kitchen Partner",
  onCancelled,
}) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reason, setReason] = useState<string>("");

  if (!isOpen) return null;

  const handleConfirmCancel = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await cancelUserSubscription(subscriptionId, reason);
      onCancelled();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to cancel subscription. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.warningIconCircle}>
            <AlertTriangle size={24} className={styles.warningIcon} />
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.modalContent}>
          <h2 className={styles.title}>Cancel Meal Subscription?</h2>
          <p className={styles.description}>
            Are you sure you want to cancel your <strong>{planName}</strong> subscription with{" "}
            <strong>{sellerName}</strong>?
          </p>

          <div className={styles.infoBox}>
            <ShieldCheck size={18} className={styles.infoIcon} />
            <p>
              Instead of cancelling, you can pause your subscription anytime with zero penalty, or switch to a lighter meal tier.
            </p>
          </div>

          {errorMsg && <div className={styles.errorAlert}>{errorMsg}</div>}

          <div className={styles.reasonField}>
            <label htmlFor="cancel-reason" className={styles.reasonLabel}>
              Reason for cancellation (optional):
            </label>
            <select
              id="cancel-reason"
              className={styles.reasonSelect}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="">Select a reason</option>
              <option value="Traveling / Moving">Traveling or relocating</option>
              <option value="Want different cuisine">Want different cuisine options</option>
              <option value="Too many meals">Portions or frequency too high</option>
              <option value="Found alternative">Found another service</option>
              <option value="Other">Other reason</option>
            </select>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.keepBtn}
            onClick={onClose}
            disabled={isSubmitting}
          >
            Keep Subscription
          </button>
          <button
            type="button"
            className={styles.confirmCancelBtn}
            onClick={handleConfirmCancel}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className={styles.spinner} />
                <span>Cancelling...</span>
              </>
            ) : (
              "Yes, Cancel Subscription"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelSubscriptionModal;
