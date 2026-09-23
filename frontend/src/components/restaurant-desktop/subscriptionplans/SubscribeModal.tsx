"use client";

import React, { useState } from "react";
import { 
  X, 
  CheckCircle2, 
  Loader2, 
  Utensils, 
  MapPin, 
  Phone, 
  Calendar 
} from "lucide-react";
import { subscribeToMealPlan } from "@/lib/meal-subscriptions";
import styles from "./SubscribeModal.module.css";

export interface SubscribeModalPlan {
  id: string;
  name: string;
  tier?: string;
  price?: number | string;
  weeklyPrice?: number | string;
  monthlyPrice?: number | string;
  duration?: string;
  period?: string;
  description?: string;
  features?: string[];
  mealTimings?: string[];
  sellerName?: string;
}

export interface SubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: SubscribeModalPlan | null;
  onSubscribed?: (newSubscription: any) => void;
}

export const SubscribeModal: React.FC<SubscribeModalProps> = ({
  isOpen,
  onClose,
  plan,
  onSubscribed,
}) => {
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !plan) return null;

  const planDuration = plan.duration || "1 Week";
  const planPriceNum = typeof plan.price === "number"
    ? plan.price
    : typeof plan.weeklyPrice === "number"
    ? plan.weeklyPrice
    : parseFloat(String(plan.price || plan.weeklyPrice || "0").replace(/[^\d.]/g, "")) || 499;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await subscribeToMealPlan(plan.id, {
        cycle: planDuration,
        deliveryAddress,
        contactPhone,
      });

      if (onSubscribed) {
        onSubscribed(res.subscription);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create subscription. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.iconCircle}>
              <Utensils size={24} />
            </div>
            <div className={styles.headerTitles}>
              <h3 className={styles.modalTitle}>Subscribe to Meal Plan</h3>
              <p className={styles.modalSubtitle}>{plan.sellerName || "Cloud Kitchen"}</p>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close dialog">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {errorMsg && (
            <div style={{ backgroundColor: "#FEF2F2", color: "#DC2626", padding: "10px 14px", borderRadius: "10px", fontSize: "0.875rem" }}>
              {errorMsg}
            </div>
          )}

          {/* Plan overview */}
          <div className={styles.planOverviewCard}>
            <div className={styles.planCardTop}>
              <span className={styles.planName}>{plan.name}</span>
              <span className={`${styles.tierBadge} ${
                plan.tier?.toLowerCase() === "gold"
                  ? styles.tierGold
                  : plan.tier?.toLowerCase() === "silver"
                  ? styles.tierSilver
                  : styles.tierBronze
              }`}>
                {plan.tier || "Bronze"}
              </span>
            </div>
            {plan.description && (
              <p style={{ margin: 0, fontSize: "0.875rem", color: "#64748B" }}>
                {plan.description}
              </p>
            )}
          </div>

          {/* Plan Duration & Billing Summary */}
          <div className={styles.planDurationBox}>
            <div className={styles.planDurationLabel}>
              <span className={styles.planDurationTitle}>Plan Validity &amp; Duration</span>
              <span className={styles.planDurationSubtitle}>Billed once for <strong>{planDuration}</strong></span>
            </div>
            <span className={styles.planDurationPrice}>₹{planPriceNum.toFixed(0)}</span>
          </div>

          {/* Delivery Address */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Delivery Address</label>
            <input
              type="text"
              className={styles.formInput}
              placeholder="Enter flat, building, locality (e.g. Flat 402, Green Valley)"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
            />
          </div>

          {/* Phone */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Contact Phone</label>
            <input
              type="tel"
              className={styles.formInput}
              placeholder="Your contact number for daily meal delivery"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </div>

          {/* Included Features */}
          {plan.features && plan.features.length > 0 && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Plan Highlights</label>
              <ul className={styles.featuresList}>
                {plan.features.slice(0, 4).map((f, i) => (
                  <li key={i} className={styles.featureItem}>
                    <CheckCircle2 size={16} color="#16A34A" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button type="button" className={styles.btnCancel} onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.btnSubscribe}
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                <span>Processing...</span>
              </>
            ) : (
              <span>Confirm & Subscribe (₹{planPriceNum.toFixed(0)})</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscribeModal;
