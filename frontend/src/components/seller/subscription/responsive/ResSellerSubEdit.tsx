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
  fetchStoredMealPlans,
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
  initialAllowPauseBilling?: boolean;
  initialMetadata?: PlanMetadataData;
  onBack?: () => void;
  onSaveChanges?: (planData: any) => void;
  onDiscard?: () => void;
}

const DEFAULT_METRICS: PlanMetricsData = {
  subscribers: 0,
  monthlyRevenue: "₹0",
};

const DEFAULT_FEATURES: string[] = [];

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
];

export const ResSellerSubEdit: React.FC<ResSellerSubEditProps> = ({
  initialPlanName = "Bronze Plan",
  initialPlanTier = "Bronze",
  initialPrice = "499.00",
  initialMetrics = DEFAULT_METRICS,
  initialFeatures = DEFAULT_FEATURES,
  initialDuration = "1 Week",
  initialMealTimings = DEFAULT_MEAL_TIMINGS,
  initialAllowPauseBilling = false,
  initialMetadata = DEFAULT_METADATA,
  onBack,
  onSaveChanges,
  onDiscard,
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
  const [duration, setDuration] = useState(initialDuration);
  const [isDurationMenuOpen, setIsDurationMenuOpen] = useState(false);
  const [mealTimings, setMealTimings] = useState<MealServingTiming[]>(initialMealTimings);
  const [allowPauseBilling, setAllowPauseBilling] = useState(initialAllowPauseBilling);
  const [pauseBillingPeriod, setPauseBillingPeriod] = useState("30 Days");
  const [metadata, setMetadata] = useState<PlanMetadataData>(initialMetadata);

  // Edit Timing Modal State
  const [editingTiming, setEditingTiming] = useState<MealServingTiming | null>(null);
  const [timingTimeValue, setTimingTimeValue] = useState("");

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadPlan = async () => {
      let plans = getStoredMealPlans();
      let found = plans.find((p) => p.id === planIdParam || p.planId === planIdParam);
      if (!found) {
        const fetched = await fetchStoredMealPlans();
        if (fetched?.plans) {
          plans = fetched.plans;
          found = plans.find((p) => p.id === planIdParam || p.planId === planIdParam) || plans[0];
        }
      } else {
        found = found || plans[0];
      }

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
          setAllowPauseBilling(found.pauseBillingPeriod !== "None");
        setPauseBillingPeriod(found.pauseBillingPeriod || "30 Days");
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
    };

    loadPlan();
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
    setFeatures((prev) => [...prev, ""]);
  };

  const handleUpdateFeature = (index: number, value: string) => {
    setFeatures((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
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

  const handleSave = async () => {
    const numPrice = parseFloat(price.replace(/[^\d.]/g, ""));
    if (isNaN(numPrice) || numPrice <= 0) {
      setToastMessage("Please enter a valid positive price greater than 0");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    const validFeatures = features.map((f) => f.trim()).filter((f) => f.length > 0);
    const isWeekly = duration.toLowerCase().includes("week");
    if (targetPlanId) {
      await updateMealPlan(targetPlanId, {
        name: planName.trim() || "Bronze Plan",
        tier: planTier.trim() || "Bronze",
        weeklyPrice: isWeekly ? `₹${numPrice.toFixed(0)}` : "",
        monthlyPrice: isWeekly ? "" : `₹${numPrice.toFixed(0)}`,
        quarterlyPrice: "",
        yearlyPrice: "",
        duration,
        features: validFeatures,
        mealTimings: mealTimings.map((m) => `${m.name}: ${m.time}`),
        allowCancel: false,
        pauseBillingPeriod: allowPauseBilling ? (pauseBillingPeriod || "30 Days") : "None",
      });
    }

    const payload = {
      planName: planName.trim() || "Bronze Plan",
      planTier: planTier.trim() || "Bronze",
      price: price.trim() || "499.00",
      duration,
      features: validFeatures,
      mealTimings,
      allowCancellation: false,
      allowPauseBilling,
      pauseBillingPeriod: allowPauseBilling ? (pauseBillingPeriod || "30 Days") : "None",
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

          {/* Section 2: Plan Basics & Duration */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Plan Basics &amp; Duration</h2>

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

            {/* Plan Duration Dropdown */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Plan Duration (Billing Cycle)</label>
              <div className={styles.selectWrapper}>
                <div
                  className={styles.selectTrigger}
                  onClick={() => setIsDurationMenuOpen((prev) => !prev)}
                  role="button"
                  tabIndex={0}
                >
                  <span style={{ fontWeight: 600 }}>{duration}</span>
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
              <p style={{ fontSize: "11px", color: "#64748B", margin: "4px 0 0 0" }}>
                Selected cycle: <strong>{duration}</strong>. Customers will be billed for this exact period.
              </p>
            </div>
          </section>

          {/* Section 3: Plan Pricing (₹ INR) */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Plan Pricing (₹ INR)</h2>

            <div className={styles.formGroup}>
              <label htmlFor="editWeeklyPrice" className={styles.label}>
                Price for {duration} (₹)
              </label>
              <div className={styles.priceInputWrapper}>
                <span className={styles.currencyPrefix}>₹</span>
                <input
                  id="editWeeklyPrice"
                  type="text"
                  inputMode="decimal"
                  className={`${styles.input} ${styles.priceInput}`}
                  placeholder={`Price for ${duration}`}
                  value={price}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val.includes("-")) {
                      setPrice(val);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
              <p style={{ fontSize: "11px", color: "#64748B", margin: "4px 0 0 0" }}>
                Total amount for the <strong>{duration}</strong> subscription cycle.
              </p>
            </div>
          </section>

          {/* Section 4: Included Features */}
          <section className={styles.card}>
            <div className={styles.cardHeaderRow}>
              <h2 className={styles.cardTitle}>Included Features</h2>
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
              {features.length === 0 ? (
                <div className={styles.emptyState}>
                  <span>No features added yet.</span>
                  <button
                    type="button"
                    className={styles.addFeatureBtn}
                    onClick={handleAddFeature}
                    style={{ marginTop: "4px" }}
                  >
                    + Add First Feature
                  </button>
                </div>
              ) : (
                features.map((feature, idx) => (
                  <div key={idx} className={styles.featureItem}>
                    <Check size={16} strokeWidth={2.5} className={styles.checkIcon} />
                    <input
                      type="text"
                      className={styles.featureInput}
                      placeholder="e.g. 7 Meals per week, 1 Dal + 1 Sabzi..."
                      value={feature}
                      onChange={(e) => handleUpdateFeature(idx, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddFeature();
                        }
                      }}
                      autoFocus={!feature}
                    />
                    <button
                      type="button"
                      className={styles.deleteFeatureBtn}
                      onClick={() => handleDeleteFeature(idx)}
                      aria-label={`Delete feature`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Section 5: Plan Timing & Schedule */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Plan Timing &amp; Schedule</h2>

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
              {/* Allow User to Pause Subscription */}
              <div className={styles.policyRow}>
                <div className={styles.policyInfo}>
                  <h3 className={styles.policyTitle}>Allow User to Pause Subscription</h3>
                  <p className={styles.policyDesc}>When enabled, users can pause their meal subscription for up to the max configured days.</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={allowPauseBilling}
                    onClick={() => setAllowPauseBilling(!allowPauseBilling)}
                    style={{
                      width: "44px",
                      height: "24px",
                      backgroundColor: allowPauseBilling ? "#FF5500" : "#CBD5E1",
                      borderRadius: "9999px",
                      position: "relative",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      transition: "background-color 0.25s ease",
                    }}
                    title={allowPauseBilling ? "Disable pause subscription" : "Enable pause subscription"}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: "2px",
                        left: "2px",
                        width: "20px",
                        height: "20px",
                        backgroundColor: "#FFFFFF",
                        borderRadius: "50%",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                        transform: allowPauseBilling ? "translateX(20px)" : "translateX(0)",
                        transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                    />
                  </button>

                  <div style={{ position: "relative", minWidth: "110px", opacity: allowPauseBilling ? 1 : 0.4, pointerEvents: allowPauseBilling ? "auto" : "none" }}>
                    <select
                      value={pauseBillingPeriod}
                      disabled={!allowPauseBilling}
                      onChange={(e) => setPauseBillingPeriod(e.target.value)}
                      style={{
                        width: "100%",
                        height: "36px",
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #CBD5E1",
                        borderRadius: "8px",
                        padding: "0 24px 0 10px",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        color: "#0F172A",
                        outline: "none",
                        cursor: "pointer",
                        appearance: "none",
                      }}
                    >
                      {Array.from({ length: 30 }, (_, i) => {
                        const day = i + 1;
                        const val = `${day} ${day === 1 ? "Day" : "Days"}`;
                        return (
                          <option key={val} value={val}>
                            {val}
                          </option>
                        );
                      })}
                    </select>
                    <span
                      style={{
                        position: "absolute",
                        right: "8px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: "9px",
                        color: "#64748B",
                        pointerEvents: "none",
                      }}
                    >
                      ▼
                    </span>
                  </div>
                </div>
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
            </div>
          </section>

          {/* Buttons: Save Changes */}
          <div className={styles.actionButtonGroup}>
            <button
              type="button"
              className={styles.saveButton}
              onClick={handleSave}
            >
              Save Changes
            </button>
          </div>

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
