"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  MoreHorizontal,
  Plus,
  Check,
  Trash2,
  ChevronDown,
  Pencil,
  X,
  CheckCircle2,
  AlertTriangle,
  Bell,
} from "lucide-react";
import {
  getStoredMealPlans,
  updateMealPlan,
  deleteMealPlan,
  MealSubscriptionPlan,
} from "@/lib/meal-subscriptions";
import styles from "./ResSellerSubEdit.module.css";

export interface MealServingTiming {
  id: string;
  name: string;
  time: string;
}

export interface PlanMetricsData {
  subscribers: number | string;
  monthlyRevenue: string;
}

export interface PlanMetadataData {
  planId: string;
  deployedDate: string;
  taxCode: string;
}

export interface ResSellerSubEditProps {
  initialPlanName?: string;
  initialPlanTier?: string;
  initialPrice?: string;
  initialMetrics?: PlanMetricsData;
  initialFeatures?: string[];
  initialDuration?: string;
  initialMealTimings?: MealServingTiming[];
  initialAllowCancellation?: boolean;
  initialAllowPauseBilling?: boolean;
  initialMetadata?: PlanMetadataData;
  onBack?: () => void;
  onSaveChanges?: (planData: any) => void;
  onDiscard?: () => void;
  onArchivePlan?: () => void;
}

const DEFAULT_METRICS: PlanMetricsData = {
  subscribers: 0,
  monthlyRevenue: "₹0",
};

const DEFAULT_FEATURES = [
  "7 Meals per week",
  "1 Dal (Seasonal) + 1 Sabzi (Dry / Gravy)",
  "Salad, Pickle & Papad",
];

const DEFAULT_MEAL_TIMINGS: MealServingTiming[] = [
  { id: "1", name: "Breakfast", time: "7:30 AM - 9:30 AM" },
  { id: "2", name: "Lunch", time: "12:30 PM - 1:30 PM" },
  { id: "3", name: "Evening Snacks", time: "5:30 PM - 6:30 PM" },
  { id: "4", name: "Dinner", time: "8:30 PM - 9:30 PM" },
];

const DEFAULT_METADATA: PlanMetadataData = {
  planId: "PLN-7832",
  deployedDate: "Feb 10, 2024",
  taxCode: "GST 18% Extra",
};

const DURATION_OPTIONS = [
  "1 Week",
  "2 Weeks",
  "1 Month",
  "3 Months",
  "6 Months",
  "1 Year",
];

export const ResSellerSubEdit: React.FC<ResSellerSubEditProps> = ({
  initialPlanName = "Bronze Plan",
  initialPlanTier = "Bronze",
  initialPrice = "499.00",
  initialMetrics = DEFAULT_METRICS,
  initialFeatures = DEFAULT_FEATURES,
  initialDuration = "1 Week",
  initialMealTimings = DEFAULT_MEAL_TIMINGS,
  initialAllowCancellation = true,
  initialAllowPauseBilling = false,
  initialMetadata = DEFAULT_METADATA,
  onBack,
  onSaveChanges,
  onDiscard,
  onArchivePlan,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planIdParam = searchParams.get("id");

  // Form State
  const [targetPlanId, setTargetPlanId] = useState<string | null>(planIdParam);
  const [metrics, setMetrics] = useState<PlanMetricsData>(initialMetrics);
  const [planName, setPlanName] = useState(initialPlanName);
  const [planTier, setPlanTier] = useState(initialPlanTier);
  const [price, setPrice] = useState(initialPrice);
  const [features, setFeatures] = useState<string[]>(initialFeatures);
  const [customFeatureInput, setCustomFeatureInput] = useState("");
  const [duration, setDuration] = useState(initialDuration);
  const [isDurationMenuOpen, setIsDurationMenuOpen] = useState(false);
  const [mealTimings, setMealTimings] = useState<MealServingTiming[]>(initialMealTimings);
  const [allowCancellation, setAllowCancellation] = useState(initialAllowCancellation);
  const [allowPauseBilling, setAllowPauseBilling] = useState(initialAllowPauseBilling);
  const [metadata, setMetadata] = useState<PlanMetadataData>(initialMetadata);

  // Edit Timing Modal State
  const [editingTiming, setEditingTiming] = useState<MealServingTiming | null>(null);
  const [timingTimeValue, setTimingTimeValue] = useState("");

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const plans = getStoredMealPlans();
    const found = plans.find((p) => p.id === planIdParam || p.planId === planIdParam) || plans[0];
    if (found) {
      setTargetPlanId(found.id);
      setPlanName(found.name);
      setPlanTier(found.tier);
      setPrice(found.weeklyPrice ? found.weeklyPrice.replace(/[^\d.]/g, "") : "499.00");
      setFeatures(found.features || []);
      setDuration(found.duration || "1 Week");
      setMealTimings(
        (found.mealTimings || []).map((t, idx) => {
          const [mealName, time] = t.includes(":") ? t.split(/:\s*(.+)/) : [`Meal ${idx + 1}`, t];
          return {
            id: `time-${idx}`,
            name: mealName || "Meal",
            time: time || t,
          };
        })
      );
      setAllowCancellation(found.allowCancel ?? true);
      setAllowPauseBilling(found.pauseBillingPeriod !== "None");
      setMetrics({
        subscribers: found.subscribersCount || 0,
        monthlyRevenue: found.monthlyRevenue || "₹0",
      });
      setMetadata({
        planId: found.planId,
        deployedDate: found.deployedDate,
        taxCode: "GST 18% Extra",
      });
    }
  }, [planIdParam]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/seller/subscription");
    }
  };

  const handleAddFeature = () => {
    if (!customFeatureInput.trim()) return;
    setFeatures((prev) => [...prev, customFeatureInput.trim()]);
    setCustomFeatureInput("");
  };

  const handleDeleteFeature = (index: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOpenEditTiming = (timing: MealServingTiming) => {
    setEditingTiming(timing);
    setTimingTimeValue(timing.time);
  };

  const handleDeleteTiming = (timingId: string) => {
    setMealTimings((prev) => prev.filter((t) => t.id !== timingId));
  };

  const handleSaveTiming = () => {
    if (!editingTiming) return;
    setMealTimings((prev) =>
      prev.map((t) =>
        t.id === editingTiming.id ? { ...t, time: timingTimeValue.trim() || t.time } : t
      )
    );
    setEditingTiming(null);
  };

  const handleSave = () => {
    if (targetPlanId) {
      const numPrice = parseFloat(price.replace(/[^\d.]/g, "")) || 0;
      updateMealPlan(targetPlanId, {
        name: planName.trim() || "Bronze Plan",
        tier: planTier.trim() || "Bronze",
        weeklyPrice: price.trim().startsWith("₹") ? price.trim() : `₹${price.trim()}`,
        monthlyPrice: `₹${(numPrice * 4).toFixed(0)}`,
        quarterlyPrice: `₹${(numPrice * 12 * 0.9).toFixed(0)}`,
        yearlyPrice: `₹${(numPrice * 52 * 0.8).toFixed(0)}`,
        duration,
        features,
        mealTimings: mealTimings.map((m) => `${m.name}: ${m.time}`),
        allowCancel: allowCancellation,
        pauseBillingPeriod: allowPauseBilling ? "Monthly" : "None",
      });
    }

    const payload = {
      planName: planName.trim() || "Bronze Plan",
      planTier: planTier.trim() || "Bronze",
      price: price.trim() || "499.00",
      duration,
      features,
      mealTimings,
      allowCancellation,
      allowPauseBilling,
      metadata,
    };

    if (onSaveChanges) {
      onSaveChanges(payload);
    } else {
      setToastMessage("Changes Saved Successfully!");
      setTimeout(() => {
        router.push("/seller/subscription");
      }, 900);
    }
  };

  const handleDiscard = () => {
    if (onDiscard) {
      onDiscard();
    } else {
      router.push("/seller/subscription");
    }
  };

  const handleArchive = () => {
    if (targetPlanId) {
      deleteMealPlan(targetPlanId);
    }
    if (onArchivePlan) {
      onArchivePlan();
    } else {
      setToastMessage("Plan Archived Successfully");
      setTimeout(() => {
        router.push("/seller/subscription");
      }, 900);
    }
  };

  return (
    <div className={styles.screenWrapper}>
      {/* 390px Mobile View Container */}
      <div className={styles.mobileContainer}>
        {/* Top Header Bar */}
        <header className={styles.topBar}>
          <div className={styles.topBarRow}>
            <div className={styles.headerLeft}>
              <button
                type="button"
                className={styles.backButton}
                onClick={handleBack}
                aria-label="Back to Subscriptions"
                title="Back"
              >
                <ChevronLeft size={20} strokeWidth={2.4} />
              </button>
              <h1 className={styles.headerTitle}>Edit Plan</h1>
            </div>

            <button
              type="button"
              className={styles.moreButton}
              onClick={() => router.push("/seller/notifications")}
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={18} />
            </button>
          </div>


          <p className={styles.headerSubtitle}>
            Update plan details, pricing, features, and policies.
          </p>
        </header>

        {/* Form Content Area */}
        <main className={styles.contentArea}>
          {/* Section 1: PLAN METRICS */}
          <section className={styles.card}>
            <h2 className={styles.cardTitleUpper}>PLAN METRICS</h2>

            <div className={styles.metricsGrid}>
              <div className={styles.metricBox}>
                <span className={styles.metricLabel}>SUBSCRIBERS</span>
                <span className={styles.metricValue}>{metrics.subscribers}</span>
              </div>

              <div className={styles.metricBox}>
                <span className={styles.metricLabel}>MONTHLY REVENUE</span>
                <span className={`${styles.metricValue} ${styles.metricValueGreen}`}>
                  {metrics.monthlyRevenue}
                </span>
              </div>
            </div>
          </section>

          {/* Section 2: Plan Basics */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Plan Basics</h2>

            <div className={styles.formGroup}>
              <label htmlFor="editPlanName" className={styles.label}>
                Plan Name
              </label>
              <input
                id="editPlanName"
                type="text"
                className={styles.input}
                placeholder="Plan Name"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="editPlanTier" className={styles.label}>
                Plan Tier
              </label>
              <select
                id="editPlanTier"
                className={styles.input}
                value={planTier}
                onChange={(e) => setPlanTier(e.target.value)}
                style={{ cursor: "pointer" }}
              >
                <option value="Bronze">Bronze Tier</option>
                <option value="Silver">Silver Tier</option>
                <option value="Gold">Gold Tier</option>
              </select>
            </div>
          </section>

          {/* Section 3: Plan Pricing (₹ INR) */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Plan Pricing (₹ INR)</h2>

            <div className={styles.formGroup}>
              <label htmlFor="editWeeklyPrice" className={styles.label}>
                Weekly Price
              </label>
              <div className={styles.priceInputWrapper}>
                <span className={styles.currencyPrefix}>₹</span>
                <input
                  id="editWeeklyPrice"
                  type="text"
                  inputMode="decimal"
                  className={`${styles.input} ${styles.priceInput}`}
                  placeholder="499.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Section 4: Included in Weekly Plans */}
          <section className={styles.card}>
            <div className={styles.cardHeaderRow}>
              <h2 className={styles.cardTitle}>Included in Weekly Plans</h2>
              <button
                type="button"
                className={styles.addFeatureBtn}
                onClick={handleAddFeature}
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>Add</span>
              </button>
            </div>

            {/* List of features */}
            <div className={styles.featuresList}>
              {features.map((feature, idx) => (
                <div key={idx} className={styles.featureItem}>
                  <div className={styles.featureLeft}>
                    <Check size={16} strokeWidth={2.5} className={styles.checkIcon} />
                    <span className={styles.featureText}>{feature}</span>
                  </div>
                  <button
                    type="button"
                    className={styles.deleteFeatureBtn}
                    onClick={() => handleDeleteFeature(idx)}
                    aria-label={`Delete feature ${feature}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Custom Feature Add Input */}
            <div className={styles.customAddBlock}>
              <span className={styles.customAddLabel}>CUSTOM ADD</span>
              <div className={styles.customAddRow}>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Premium Dessert on Sunday"
                  value={customFeatureInput}
                  onChange={(e) => setCustomFeatureInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddFeature();
                    }
                  }}
                />
              </div>
            </div>
          </section>

          {/* Section 5: Plan Timing & Schedule */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Plan Timing &amp; Schedule</h2>

            {/* Plan Duration Dropdown */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Plan Duration</label>
              <div className={styles.selectWrapper}>
                <div
                  className={styles.selectTrigger}
                  onClick={() => setIsDurationMenuOpen((prev) => !prev)}
                  role="button"
                  tabIndex={0}
                >
                  <span>{duration}</span>
                  <ChevronDown size={18} color="#64748B" />
                </div>

                {isDurationMenuOpen && (
                  <div className={styles.selectMenu}>
                    {DURATION_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className={`${styles.selectOption} ${
                          duration === opt ? styles.selectOptionActive : ""
                        }`}
                        onClick={() => {
                          setDuration(opt);
                          setIsDurationMenuOpen(false);
                        }}
                      >
                        <span>{opt}</span>
                        {duration === opt && <Check size={14} color="#F97316" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Meal Serving Timings */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Meal Serving Timings</label>
              <div className={styles.mealTimingsList}>
                {mealTimings.map((slot) => (
                  <div key={slot.id} className={styles.mealTimingSlot}>
                    <span className={styles.mealName}>{slot.name}</span>
                    <div className={styles.mealRight}>
                      <span className={styles.mealTimingText}>{slot.time}</span>
                      <button
                        type="button"
                        className={styles.iconActionBtn}
                        onClick={() => handleOpenEditTiming(slot)}
                        aria-label={`Edit ${slot.name} timing`}
                        title="Edit Timing"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.iconActionBtn} ${styles.deleteTimingBtn}`}
                        onClick={() => handleDeleteTiming(slot.id)}
                        aria-label={`Delete ${slot.name} timing`}
                        title="Delete Timing"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 6: Subscription Policies */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Subscription Policies</h2>

            <div className={styles.policyList}>
              {/* Allow User to Cancel Subscription */}
              <div className={styles.policyRow}>
                <div className={styles.policyInfo}>
                  <h3 className={styles.policyTitle}>Allow User to Cancel Subscription</h3>
                  <p className={styles.policyDesc}>Users can cancel anytime from dashboard.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={allowCancellation}
                  className={`${styles.toggleSwitch} ${
                    allowCancellation ? styles.toggleSwitchActive : ""
                  }`}
                  onClick={() => setAllowCancellation((prev) => !prev)}
                >
                  <span className={styles.toggleThumb} />
                </button>
              </div>

              {/* Allow User to Pause Billing */}
              <div className={styles.policyRow}>
                <div className={styles.policyInfo}>
                  <h3 className={styles.policyTitle}>Allow User to Pause Billing</h3>
                  <p className={styles.policyDesc}>Temporary pause instead of termination.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={allowPauseBilling}
                  className={`${styles.toggleSwitch} ${
                    allowPauseBilling ? styles.toggleSwitchActive : ""
                  }`}
                  onClick={() => setAllowPauseBilling((prev) => !prev)}
                >
                  <span className={styles.toggleThumb} />
                </button>
              </div>
            </div>
          </section>

          {/* Section 7: Plan Metadata Summary */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Plan Metadata Summary</h2>

            <div className={styles.metadataList}>
              <div className={styles.metadataRow}>
                <span className={styles.metadataKey}>Plan ID</span>
                <span className={styles.metadataVal}>{metadata.planId}</span>
              </div>
              <div className={styles.metadataRow}>
                <span className={styles.metadataKey}>Deployed Date</span>
                <span className={styles.metadataVal}>{metadata.deployedDate}</span>
              </div>
              <div className={styles.metadataRow}>
                <span className={styles.metadataKey}>Tax Code</span>
                <span className={styles.metadataVal}>{metadata.taxCode}</span>
              </div>
            </div>
          </section>

          {/* Buttons: Save Changes & Discard Modifications */}
          <div className={styles.actionButtonGroup}>
            <button
              type="button"
              className={styles.saveButton}
              onClick={handleSave}
            >
              Save Changes
            </button>

            <button
              type="button"
              className={styles.discardButton}
              onClick={handleDiscard}
            >
              Discard Modifications
            </button>
          </div>

          {/* Section 8: Danger Zone */}
          <section className={styles.dangerCard}>
            <h3 className={styles.dangerTitle}>Danger Zone</h3>
            <p className={styles.dangerDesc}>
              Archiving this plan will prevent new subscribers from purchasing it. Existing active
              subscriptions will continue until their billing cycle finishes.
            </p>
            <button
              type="button"
              className={styles.archiveButton}
              onClick={handleArchive}
            >
              Archive Plan
            </button>
          </section>

          <div className={styles.homeIndicator} aria-hidden="true" />
        </main>

        {/* Edit Timing Modal */}
        {editingTiming && (
          <div
            className={styles.modalOverlay}
            onClick={() => setEditingTiming(null)}
          >
            <div
              className={styles.modalCard}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  Edit {editingTiming.name} Timing
                </h3>
                <button
                  type="button"
                  className={styles.modalCloseBtn}
                  onClick={() => setEditingTiming(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Slot Timing</label>
                <input
                  type="text"
                  className={styles.input}
                  value={timingTimeValue}
                  onChange={(e) => setTimingTimeValue(e.target.value)}
                  placeholder="e.g. 7:30 AM - 9:30 AM"
                  autoFocus
                />
              </div>

              <div className={styles.modalActionRow}>
                <button
                  type="button"
                  className={styles.cancelModalBtn}
                  onClick={() => setEditingTiming(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.saveModalBtn}
                  onClick={handleSaveTiming}
                >
                  Save Timing
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Alert */}
        {toastMessage && (
          <div className={styles.toastNotification}>
            <CheckCircle2 size={18} color="#10B981" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResSellerSubEdit;
