"use client";

import React, { useState, useEffect } from "react";
import { X, Check, ArrowRight, Sparkles, AlertCircle, Clock, ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import styles from "./ChangePlanModal.module.css";
import { fetchSellerMealPlans, changeUserSubscriptionPlan, getTierColors } from "@/lib/meal-subscriptions";

export interface ChangePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionId: string;
  sellerId: string;
  sellerName?: string;
  currentPlanId: string;
  onPlanChanged: (newPlanData: any) => void;
}

export const ChangePlanModal: React.FC<ChangePlanModalProps> = ({
  isOpen,
  onClose,
  subscriptionId,
  sellerId,
  sellerName = "Kitchen Partner",
  currentPlanId,
  onPlanChanged,
}) => {
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !sellerId) return;

    let isMounted = true;
    setIsLoading(true);
    setErrorMsg(null);

    async function loadPlans() {
      try {
        const data = await fetchSellerMealPlans(sellerId);
        if (isMounted) {
          setPlans(data);
          // Pre-select the current or first other plan
          const other = data.find((p: any) => p.id !== currentPlanId);
          setSelectedPlanId(other?.id || currentPlanId);
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMsg("Failed to load other meal plans for this kitchen.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadPlans();

    return () => {
      isMounted = false;
    };
  }, [isOpen, sellerId, currentPlanId]);

  if (!isOpen) return null;

  const handleConfirmChange = async (planToSwitch: any) => {
    if (!planToSwitch || planToSwitch.id === currentPlanId) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await changeUserSubscriptionPlan(subscriptionId, planToSwitch.id);
      onPlanChanged(res.subscription || planToSwitch);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to switch meal plan. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={styles.modalHeader}>
          <div>
            <div className={styles.headerTag}>
              <Sparkles size={14} className={styles.tagIcon} />
              <span>Available Kitchen Plans</span>
            </div>
            <h2 className={styles.title}>Change Meal Plan</h2>
            <p className={styles.subtitle}>
              Switching plans with <strong>{sellerName}</strong>. Your updated tier and preferences take effect immediately.
            </p>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className={styles.errorBanner}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Body / Plans List */}
        <div className={styles.modalBody}>
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <Loader2 size={36} className={styles.spinner} />
              <p>Fetching available meal plans from {sellerName}...</p>
            </div>
          ) : plans.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No other live meal plans were found for this kitchen partner at this time.</p>
            </div>
          ) : (
            <div className={styles.plansGrid}>
              {plans.map((plan: any) => {
                const isCurrent = plan.id === currentPlanId;
                const isSelected = selectedPlanId === plan.id;
                const tierColors = getTierColors(plan.tier);

                let features: string[] = [];
                if (Array.isArray(plan.features)) {
                  features = plan.features;
                } else if (typeof plan.features === "string") {
                  try {
                    features = JSON.parse(plan.features);
                  } catch {
                    features = [];
                  }
                }

                let timings: string[] = [];
                if (Array.isArray(plan.mealTimings)) {
                  timings = plan.mealTimings;
                } else if (typeof plan.mealTimings === "string") {
                  try {
                    timings = JSON.parse(plan.mealTimings);
                  } catch {
                    timings = [];
                  }
                }

                const getPlanPeriod = (dur?: string) => {
                  const d = (dur || "1 Week").toLowerCase();
                  if (d.includes("2 week")) return "/2 weeks";
                  if (d.includes("week")) return "/week";
                  if (d.includes("6 month")) return "/6 months";
                  if (d.includes("month")) return "/month";
                  if (d.includes("year")) return "/year";
                  return `/${dur || "week"}`;
                };

                return (
                  <div
                    key={plan.id}
                    className={`${styles.planCard} ${
                      isCurrent ? styles.currentCard : isSelected ? styles.selectedCard : ""
                    }`}
                    onClick={() => setSelectedPlanId(plan.id)}
                  >
                    {/* Top Row */}
                    <div className={styles.cardTopRow}>
                      <div className={styles.planHeaderInfo}>
                        <span
                          className={styles.tierBadge}
                          style={{
                            color: tierColors.tierColor,
                            backgroundColor: tierColors.tierBg,
                          }}
                        >
                          {plan.tier || "Standard"} Tier
                        </span>
                        <h3 className={styles.planName}>{plan.name}</h3>
                      </div>

                      {isCurrent ? (
                        <span className={styles.currentBadge}>Current Active Plan</span>
                      ) : (
                        <div className={styles.priceTag}>
                          <span className={styles.priceAmount}>
                            {typeof plan.weeklyPrice === "number"
                              ? `₹${plan.weeklyPrice}`
                              : plan.weeklyPrice}
                          </span>
                          <span className={styles.pricePeriod}>{getPlanPeriod(plan.duration)}</span>
                        </div>
                      )}
                    </div>

                    {/* Pricing Breakdown for non-current plans */}
                    {isCurrent && (
                      <div className={styles.currentPriceRow}>
                        <span className={styles.priceAmount}>
                          {typeof plan.weeklyPrice === "number"
                            ? `₹${plan.weeklyPrice}`
                            : plan.weeklyPrice}
                        </span>
                        <span className={styles.pricePeriod}>{getPlanPeriod(plan.duration)}</span>
                      </div>
                    )}

                    {/* Meal Timings */}
                    {timings.length > 0 && (
                      <div className={styles.timingsRow}>
                        <Clock size={14} className={styles.timingIcon} />
                        <span className={styles.timingLabel}>Includes:</span>
                        <div className={styles.timingTags}>
                          {timings.map((t, idx) => (
                            <span key={idx} className={styles.timingTag}>
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Features List */}
                    {features.length > 0 && (
                      <ul className={styles.featuresList}>
                        {features.slice(0, 4).map((f, idx) => (
                          <li key={idx} className={styles.featureItem}>
                            <Check size={14} className={styles.checkIcon} />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Policy indicator */}
                    <div className={styles.policyRow}>
                      {plan.allowCancel ? (
                        <span className={styles.policyAllowed}>
                          <ShieldCheck size={13} />
                          Cancellation Allowed
                        </span>
                      ) : (
                        <span className={styles.policyRestricted}>
                          <ShieldAlert size={13} />
                          Non-refundable / No self-cancel
                        </span>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className={styles.cardActionRow}>
                      {isCurrent ? (
                        <button type="button" className={styles.disabledBtn} disabled>
                          Currently Active
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={styles.switchBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConfirmChange(plan);
                          }}
                          disabled={isSubmitting}
                        >
                          {isSubmitting && selectedPlanId === plan.id ? (
                            <>
                              <Loader2 size={16} className={styles.spinner} />
                              <span>Switching...</span>
                            </>
                          ) : (
                            <>
                              <span>Switch to {plan.tier}</span>
                              <ArrowRight size={16} />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={styles.modalFooter}>
          <button type="button" className={styles.cancelFooterBtn} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangePlanModal;
