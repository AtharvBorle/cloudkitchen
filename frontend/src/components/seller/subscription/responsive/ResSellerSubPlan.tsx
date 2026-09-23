"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
  Bell,
} from "lucide-react";
import { saveMealPlan } from "@/lib/meal-subscriptions";
import styles from "./ResSellerSubPlan.module.css";

export interface MealTimingSlot {
  id: string;
  name: string;
  time: string;
}

export interface ResSellerSubPlanProps {
  initialPlanName?: string;
  initialPlanTier?: string;
  initialPrice?: string;
  initialFeatures?: string[];
  initialDuration?: string;
  initialMealTimings?: MealTimingSlot[];
  initialAllowCancellation?: boolean;
  initialAllowPauseBilling?: boolean;
  onBack?: () => void;
  onDeployPlan?: (planData: any) => void;
  onDiscard?: () => void;
}

const DEFAULT_FEATURES: string[] = [];

const DEFAULT_MEAL_TIMINGS: MealTimingSlot[] = [
  { id: "1", name: "Breakfast", time: "7:30 AM - 9:30 AM" },
  { id: "2", name: "Lunch", time: "12:30 PM - 1:30 PM" },
  { id: "3", name: "Evening Snacks", time: "5:30 PM - 6:30 PM" },
  { id: "4", name: "Dinner", time: "8:30 PM - 9:30 PM" },
];

const DURATION_OPTIONS = [
  "1 Week",
  "2 Weeks",
  "1 Month",
];

export const ResSellerSubPlan: React.FC<ResSellerSubPlanProps> = ({
  initialPlanName = "Bronze Plan",
  initialPlanTier = "Bronze",
  initialPrice = "499",
  initialFeatures = DEFAULT_FEATURES,
  initialDuration = "1 Week",
  initialMealTimings = DEFAULT_MEAL_TIMINGS,
  initialAllowCancellation = true,
  initialAllowPauseBilling = false,
  onBack,
  onDeployPlan,
  onDiscard,
}) => {
  const router = useRouter();

  // Form State
  const [planName, setPlanName] = useState(initialPlanName);
  const [planTier, setPlanTier] = useState(initialPlanTier);
  const [price, setPrice] = useState(initialPrice);
  const [features, setFeatures] = useState<string[]>(initialFeatures);
  const [duration, setDuration] = useState(initialDuration);
  const [isDurationMenuOpen, setIsDurationMenuOpen] = useState(false);
  const [mealTimings, setMealTimings] = useState<MealTimingSlot[]>(initialMealTimings);
  const [allowCancellation, setAllowCancellation] = useState(initialAllowCancellation);
  const [allowPauseBilling, setAllowPauseBilling] = useState(initialAllowPauseBilling);
  const [pauseBillingPeriod, setPauseBillingPeriod] = useState("30 Days");

  // Edit Timing Modal State
  const [editingTiming, setEditingTiming] = useState<MealTimingSlot | null>(null);
  const [timingTimeValue, setTimingTimeValue] = useState("");

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  const handleOpenEditTiming = (timing: MealTimingSlot) => {
    setEditingTiming(timing);
    setTimingTimeValue(timing.time);
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

  const handleDiscard = () => {
    if (onDiscard) {
      onDiscard();
    } else {
      router.push("/seller/subscription");
    }
  };

  const handleDeploy = async () => {
    const validFeatures = features.map((f) => f.trim()).filter((f) => f.length > 0);
    const payload = {
      name: planName.trim() || "Bronze Plan",
      tier: planTier.trim() || "Bronze",
      weeklyPrice: price.trim() || "0",
      monthlyPrice: `₹${((parseFloat(price) || 0) * 4).toFixed(0)}`,
      quarterlyPrice: `₹${((parseFloat(price) || 0) * 12 * 0.9).toFixed(0)}`,
      yearlyPrice: `₹${((parseFloat(price) || 0) * 52 * 0.8).toFixed(0)}`,
      duration,
      features: validFeatures,
      mealTimings: mealTimings.map((m) => `${m.name}: ${m.time}`),
      allowCancel: allowCancellation,
      pauseBillingPeriod: pauseBillingPeriod || "30 Days",
      status: "Live" as const,
    };

    await saveMealPlan(payload);

    if (onDeployPlan) {
      onDeployPlan(payload);
    } else {
      setToastMessage("Plan Created & Deployed Successfully!");
      setTimeout(() => {
        router.push("/seller/subscription");
      }, 900);
    }
  };

  // Compute unit suffix for price preview (e.g., /wk, /mo, /yr)
  const getDurationSuffix = (dur: string) => {
    const d = dur.toLowerCase();
    if (d.includes("2 week")) return " / 2 wks";
    if (d.includes("1 week") || d.includes("week")) return " / wk";
    if (d.includes("6 month")) return " / 6 mos";
    if (d.includes("1 month") || d.includes("month")) return " / mo";
    if (d.includes("year")) return " / yr";
    return ` / ${dur.toLowerCase()}`;
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
              <h1 className={styles.headerTitle}>Create New Plan</h1>
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
            Define tier packages, custom features &amp; timings.
          </p>
        </header>

        {/* Form Content Area */}
        <main className={styles.contentArea}>
          {/* Section 1: Plan Basics & Duration */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Plan Basics &amp; Duration</h2>

            <div className={styles.formGroup}>
              <label htmlFor="planName" className={styles.label}>
                Plan Name
              </label>
              <input
                id="planName"
                type="text"
                className={styles.input}
                placeholder="e.g. Bronze Plan, Silver Plan, Gold Plan"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="planTier" className={styles.label}>
                Plan Tier
              </label>
              <select
                id="planTier"
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

          {/* Section 2: Plan Pricing (₹ INR) */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Plan Pricing (₹ INR)</h2>

            <div className={styles.formGroup}>
              <label htmlFor="weeklyPrice" className={styles.label}>
                Price for {duration} (₹)
              </label>
              <div className={styles.priceInputWrapper}>
                <span className={styles.currencyPrefix}>₹</span>
                <input
                  id="weeklyPrice"
                  type="number"
                  inputMode="decimal"
                  className={`${styles.input} ${styles.priceInput}`}
                  placeholder={`Price for ${duration}`}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <p style={{ fontSize: "11px", color: "#64748B", margin: "4px 0 0 0" }}>
                Total amount for the <strong>{duration}</strong> subscription cycle.
              </p>
            </div>
          </section>

          {/* Section 3: Included Features */}
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

          {/* Section 4: Plan Timing & Schedule */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Plan Timing &amp; Schedule</h2>

            {/* Meal Timings List */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Meal Timings</label>
              <div className={styles.mealTimingsList}>
                {mealTimings.map((slot) => (
                  <div key={slot.id} className={styles.mealTimingSlot}>
                    <span className={styles.mealName}>{slot.name}</span>
                    <div className={styles.mealRight}>
                      <span className={styles.mealTimingText}>{slot.time}</span>
                      <button
                        type="button"
                        className={styles.editTimingBtn}
                        onClick={() => handleOpenEditTiming(slot)}
                        aria-label={`Edit ${slot.name} timing`}
                        title="Edit Timing"
                      >
                        <Pencil size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 5: Subscription Policies */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Subscription Policies</h2>

            <div className={styles.policyList}>
              {/* Allow User to Cancel Subscription */}
              <div className={styles.policyRow}>
                <div className={styles.policyInfo}>
                  <h3 className={styles.policyTitle}>Allow User to Cancel Subscription</h3>
                  <p className={styles.policyDesc}>Partners can cancel anytime directly from their cloud merchant dashboard.</p>
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
                  <p className={styles.policyDesc}>Enable temporary pause states instead of absolute subscription termination.</p>
                </div>
                <div style={{ position: "relative", minWidth: "115px", flexShrink: 0 }}>
                  <select
                    value={pauseBillingPeriod}
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
          </section>

          {/* Sticky / Bottom Footer Actions */}
          <footer className={styles.footerArea}>
            <div className={styles.draftPreviewRow}>
              <div className={styles.draftLeft}>
                <span className={styles.draftLabel}>DRAFT PREVIEW</span>
                <h4 className={styles.draftPlanName}>
                  {planName.trim() || "New Plan"}
                </h4>
              </div>
              <span className={styles.draftPrice}>
                ₹{price || "0"}
                {getDurationSuffix(duration)}
              </span>
            </div>

            <button
              type="button"
              className={styles.deployButton}
              onClick={handleDeploy}
            >
              Create &amp; Deploy Plan
            </button>

            <button
              type="button"
              className={styles.discardButton}
              onClick={handleDiscard}
            >
              Discard Draft
            </button>

            <div className={styles.homeIndicator} aria-hidden="true" />
          </footer>
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

export default ResSellerSubPlan;
