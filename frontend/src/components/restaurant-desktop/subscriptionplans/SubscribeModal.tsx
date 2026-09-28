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
import { 
  loadRazorpayScript,
  initiateMealSubscriptionPayment,
  verifyAndActivateMealSubscription,
} from "@/lib/meal-subscriptions";
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
    if (!deliveryAddress.trim()) {
      setErrorMsg("Please enter your delivery address or room number.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Initiate online payment order on the backend
      const initData = await initiateMealSubscriptionPayment(plan.id, planDuration);

      // 2. Load Razorpay Checkout SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setErrorMsg("Failed to load Razorpay payment SDK. Please check your internet connection.");
        setIsSubmitting(false);
        return;
      }

      // 3. Open Razorpay Checkout Modal
      const options = {
        key: initData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_TX4MPQgJuetMFP",
        amount: initData.amount,
        currency: initData.currency || "INR",
        name: "Neo Cloud Kitchen",
        description: `Meal Plan: ${plan.name} (${initData.subscriptionCycle || planDuration})`,
        order_id: initData.razorpayOrderId,
        handler: async function (response: any) {
          try {
            setIsSubmitting(true);
            const verified = await verifyAndActivateMealSubscription({
              planId: plan.id,
              cycle: initData.subscriptionCycle || planDuration,
              deliveryAddress: deliveryAddress.trim(),
              contactPhone: contactPhone.trim(),
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (onSubscribed) {
              onSubscribed(verified.subscription);
            }
            onClose();
          } catch (vErr: any) {
            console.error("Verification error:", vErr);
            setErrorMsg(vErr.message || "Payment verification failed. Please contact support.");
            setIsSubmitting(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false);
            setErrorMsg("Payment was cancelled. Subscription was not activated.");
          },
        },
        prefill: {
          contact: contactPhone.trim(),
        },
        theme: {
          color: "#FF6B00",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setIsSubmitting(false);
        setErrorMsg("Payment failed: " + (response.error?.description || "Transaction declined. Subscription was not activated."));
      });
      rzp.open();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to initiate subscription payment. Please try again.");
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
