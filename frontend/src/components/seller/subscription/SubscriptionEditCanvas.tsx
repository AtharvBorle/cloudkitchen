"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Trash2, Edit2, Plus, ChevronLeft, CheckCircle2 } from "lucide-react";
import {
  fetchStoredMealPlans,
  getStoredMealPlans,
  updateMealPlan,
  deleteMealPlan,
  MealSubscriptionPlan,
} from "@/lib/meal-subscriptions";


export interface PlanFeatureItem {
  id: string;
  label: string;
  checked?: boolean;
}

export interface MealTimingItem {
  id: string;
  mealName: string;
  timing: string;
}

export interface PlanMetrics {
  subscribers: number | string;
  monthlyRevenue: string;
}

export interface PlanMetadata {
  planId: string;
  deployedDate: string;
  taxCode: string;
  tierBadgeText?: string;
}

export interface SubscriptionPlanData {
  planName: string;
  planTier: string;
  monthlyPrice: string;
  quarterlyPrice: string;
  yearlyPrice: string;
  includedFeatures: PlanFeatureItem[];
  customFeature: string;
  planDuration: string;
  mealTimings: MealTimingItem[];
  allowCancelSubscription: boolean;
  allowPauseBilling: boolean;
  pauseBillingPeriod?: string;
  metrics: PlanMetrics;
  metadata: PlanMetadata;
}

export interface SubscriptionEditCanvasProps {
  initialData?: Partial<SubscriptionPlanData>;
  onSave?: (data: SubscriptionPlanData) => void;
  onDiscard?: () => void;
  onArchive?: () => void;
  onAddFeature?: () => void;
  onAddTiming?: () => void;
}

const DEFAULT_INCLUDED_FEATURES: PlanFeatureItem[] = [];

const DEFAULT_MEAL_TIMINGS: MealTimingItem[] = [
  { id: "time-1", mealName: "Breakfast", timing: "7:30 AM – 9:30 AM" },
  { id: "time-2", mealName: "Lunch", timing: "12:30 AM – 1:30 AM" },
  { id: "time-3", mealName: "Evening Snacks", timing: "5:30 AM – 6:30 AM" },
  { id: "time-4", mealName: "Dinner", timing: "8:30 AM – 9:30 AM" },
];

const DEFAULT_DATA: SubscriptionPlanData = {
  planName: "Bronze Plan",
  planTier: "Bronze",
  monthlyPrice: "₹ 999.00",
  quarterlyPrice: "₹ 2,699.00",
  yearlyPrice: "₹ 9,599.00",
  includedFeatures: DEFAULT_INCLUDED_FEATURES,
  customFeature: "",
  planDuration: "1 Week",
  mealTimings: DEFAULT_MEAL_TIMINGS,
  allowCancelSubscription: true,
  allowPauseBilling: true,
  metrics: {
    subscribers: 342,
    monthlyRevenue: "₹3.4L",
  },
  metadata: {
    planId: "PLN-7832",
    deployedDate: "Feb 10, 2024",
    taxCode: "GST 18% Extra",
    tierBadgeText: "BRONZE TIER",
  },
};

export default function SubscriptionEditCanvas({
  initialData,
  onSave,
  onDiscard,
  onArchive,
  onAddFeature,
  onAddTiming,
}: SubscriptionEditCanvasProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planIdParam = searchParams.get("id");

  const [targetPlanId, setTargetPlanId] = useState<string | null>(planIdParam);
  const [formData, setFormData] = useState<SubscriptionPlanData>({
    ...DEFAULT_DATA,
    ...initialData,
    metrics: { ...DEFAULT_DATA.metrics, ...initialData?.metrics },
    metadata: { ...DEFAULT_DATA.metadata, ...initialData?.metadata },
  });

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
        setFormData({
          planName: found.name,
          planTier: found.tier,
          monthlyPrice: found.monthlyPrice,
          quarterlyPrice: found.quarterlyPrice,
          yearlyPrice: found.yearlyPrice,
          includedFeatures: (found.features || []).map((feat, idx) => ({
            id: `feat-${idx}`,
            label: feat,
            checked: true,
          })),
          customFeature: "",
          planDuration: found.duration,
          mealTimings: (found.mealTimings || []).map((t, idx) => {
            const [mealName, timing] = t.includes(":") ? t.split(/:\s*(.+)/) : ["Meal", t];
            return {
              id: `time-${idx}`,
              mealName: mealName || "Meal",
              timing: timing || t,
            };
          }),
          allowCancelSubscription: found.allowCancel ?? true,
          allowPauseBilling: found.pauseBillingPeriod !== "None",
          pauseBillingPeriod: found.pauseBillingPeriod || "30 Days",
          metrics: {
            subscribers: found.subscribersCount,
            monthlyRevenue: found.monthlyRevenue,
          },
          metadata: {
            planId: found.planId,
            deployedDate: found.deployedDate,
            taxCode: "GST 18% Extra",
            tierBadgeText: `${found.tier.toUpperCase()} TIER`,
          },
        });
      }
    };

    loadPlan();
  }, [planIdParam]);

  const [isDurationDropdownOpen, setIsDurationDropdownOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const durationOptions = ["1 Week", "2 Weeks", "1 Month"];

  // Form field update handlers
  const handleTextChange = (field: keyof SubscriptionPlanData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleInputChange = (field: keyof SubscriptionPlanData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggle = (field: "allowCancelSubscription" | "allowPauseBilling") => {
    setFormData((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleFeatureToggle = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      includedFeatures: prev.includedFeatures.map((f) =>
        f.id === id ? { ...f, checked: !f.checked } : f
      ),
    }));
  };

  const handleFeatureUpdateLabel = (id: string, label: string) => {
    setFormData((prev) => ({
      ...prev,
      includedFeatures: prev.includedFeatures.map((f) =>
        f.id === id ? { ...f, label } : f
      ),
    }));
  };

  const handleFeatureDelete = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      includedFeatures: prev.includedFeatures.filter((f) => f.id !== id),
    }));
  };

  const handleAddFeatureDirect = () => {
    const newFeature: PlanFeatureItem = {
      id: `feat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      label: "",
      checked: true,
    };
    setFormData((prev) => ({
      ...prev,
      includedFeatures: [...prev.includedFeatures, newFeature],
    }));
    if (onAddFeature) onAddFeature();
  };

  const handleTimingChange = (id: string, newTiming: string) => {
    setFormData((prev) => ({
      ...prev,
      mealTimings: prev.mealTimings.map((t) =>
        t.id === id ? { ...t, timing: newTiming } : t
      ),
    }));
  };

  const handleMealNameChange = (id: string, newMealName: string) => {
    setFormData((prev) => ({
      ...prev,
      mealTimings: prev.mealTimings.map((t) =>
        t.id === id ? { ...t, mealName: newMealName } : t
      ),
    }));
  };

  const handleTimingDelete = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      mealTimings: prev.mealTimings.filter((t) => t.id !== id),
    }));
  };

  const handleDeleteTiming = handleTimingDelete;

  const handleAddMealTiming = () => {
    const newTiming: MealTimingItem = {
      id: `time-${Date.now()}`,
      mealName: "New Meal",
      timing: "10:00 AM – 11:00 AM",
    };
    setFormData((prev) => ({
      ...prev,
      mealTimings: [...prev.mealTimings, newTiming],
    }));
    if (onAddTiming) onAddTiming();
  };

  const handleAddTimingItem = handleAddMealTiming;

  const handleSave = async () => {
    if (targetPlanId) {
      await updateMealPlan(targetPlanId, {
        name: formData.planName,
        tier: formData.planTier,
        monthlyPrice: formData.monthlyPrice,
        quarterlyPrice: formData.quarterlyPrice,
        yearlyPrice: formData.yearlyPrice,
        duration: formData.planDuration,
        features: formData.includedFeatures.filter((f) => f.checked !== false).map((f) => f.label),
        mealTimings: formData.mealTimings.map((m) => `${m.mealName}: ${m.timing}`),
        allowCancel: formData.allowCancelSubscription,
        pauseBillingPeriod: formData.pauseBillingPeriod || (formData.allowPauseBilling ? "30 Days" : "None"),
      });
    }

    if (onSave) {
      onSave(formData);
    }
    setSaveStatus("Plan modifications saved successfully!");
    setTimeout(() => {
      setSaveStatus(null);
      router.push("/seller/subscription");
    }, 900);
  };

  const handleDiscard = () => {
    if (onDiscard) {
      onDiscard();
    } else {
      router.push("/seller/subscription");
    }
  };

  const handleArchive = async () => {
    if (targetPlanId) {
      await deleteMealPlan(targetPlanId);
    }
    if (onArchive) {
      onArchive();
    } else {
      setSaveStatus("Plan archived successfully");
      setTimeout(() => {
        setSaveStatus(null);
        router.push("/seller/subscription");
      }, 900);
    }
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "1320px",
        backgroundColor: "#F7F8FB",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        padding: "32px 24px",
        boxSizing: "border-box",
        fontFamily: "var(--font-poppins), 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        margin: "0 auto",
      }}
      className="subscription-edit-canvas"
    >
      {/* Toast Notification */}
      {saveStatus && (
        <div
          style={{
            position: "fixed",
            bottom: "32px",
            right: "32px",
            backgroundColor: "#0F172A",
            color: "#FFFFFF",
            padding: "12px 24px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 600,
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>✓</span>
          <span>{saveStatus}</span>
        </div>
      )}

      {/* header-row */}
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          justifyContent: "center",
          boxSizing: "border-box",
        }}
        className="header-row"
      >
        {/* Breadcrumbs */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12.5px",
            color: "#64748B",
            fontWeight: 500,
          }}
        >
          <Link
            href="/seller/subscription"
            style={{
              color: "#334155",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontWeight: 600,
            }}
          >
            <ChevronLeft size={15} />
            <span>Subscriptions</span>
          </Link>
          <span style={{ color: "#94A3B8" }}>&gt;</span>
          <span>Plans</span>
          <span style={{ color: "#94A3B8" }}>&gt;</span>
          <span style={{ color: "#FF5500", fontWeight: 600 }}>
            Edit Plan #{formData.metadata.planId}
          </span>
        </div>


        {/* Title + Badge Row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 800,
              color: "#0F172A",
              margin: 0,
              letterSpacing: "-0.4px",
              lineHeight: 1.25,
            }}
          >
            Edit Subscription Plan
          </h1>
          <span
            style={{
              backgroundColor:
                formData.planTier?.toLowerCase() === "gold"
                  ? "#FEF9C3"
                  : formData.planTier?.toLowerCase() === "silver"
                  ? "#F1F5F9"
                  : "#FEF3C7",
              color:
                formData.planTier?.toLowerCase() === "gold"
                  ? "#A16207"
                  : formData.planTier?.toLowerCase() === "silver"
                  ? "#475569"
                  : "#B45309",
              border: `1px solid ${
                formData.planTier?.toLowerCase() === "gold"
                  ? "#FDE047"
                  : formData.planTier?.toLowerCase() === "silver"
                  ? "#CBD5E1"
                  : "#FDE68A"
              }`,
              fontSize: "10.5px",
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: "4px",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              display: "inline-flex",
              alignItems: "center",
              lineHeight: 1.2,
            }}
          >
            {formData.metadata.tierBadgeText || `${(formData.planTier || "BRONZE").toUpperCase()} TIER`}
          </span>
        </div>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "13px",
            color: "#64748B",
            margin: 0,
            fontWeight: 400,
          }}
        >
          Updating active plan. Plan deployed since {formData.metadata.deployedDate}.
        </p>
      </div>

      {/* columns-group */}
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "row",
          gap: "24px",
          alignItems: "flex-start",
          boxSizing: "border-box",
        }}
        className="columns-group"
      >
        {/* form-column (Left side) */}
        <div
          style={{
            flex: "1 1 0%",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            boxSizing: "border-box",
          }}
          className="form-column"
        >
          {/* Card 1: Plan Basics & Duration */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              border: "1px solid #E2E8F0",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              boxSizing: "border-box",
            }}
          >
            <h2
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "#0F172A",
                margin: 0,
              }}
            >
              Plan Basics &amp; Duration
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                width: "100%",
              }}
            >
              {/* Plan Name */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label
                  style={{
                    fontSize: "12.5px",
                    fontWeight: 600,
                    color: "#0F172A",
                  }}
                >
                  Plan Name
                </label>
                <input
                  type="text"
                  value={formData.planName}
                  onChange={(e) => handleTextChange("planName", e.target.value)}
                  style={{
                    width: "100%",
                    borderRadius: "8px",
                    border: "1px solid #E2E8F0",
                    padding: "10px 14px",
                    fontSize: "13.5px",
                    color: "#0F172A",
                    backgroundColor: "#FFFFFF",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                    transition: "border-color 0.15s ease",
                  }}
                />
              </div>

              {/* Plan Tier */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label
                  style={{
                    fontSize: "12.5px",
                    fontWeight: 600,
                    color: "#0F172A",
                  }}
                >
                  Plan Tier
                </label>
                <select
                  value={formData.planTier}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      planTier: val,
                      metadata: {
                        ...prev.metadata,
                        tierBadgeText: `${val.toUpperCase()} TIER`,
                      },
                    }));
                  }}
                  style={{
                    width: "100%",
                    borderRadius: "8px",
                    border: "1px solid #E2E8F0",
                    padding: "10px 14px",
                    fontSize: "13.5px",
                    color: "#0F172A",
                    backgroundColor: "#FFFFFF",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                    transition: "border-color 0.15s ease",
                    cursor: "pointer",
                  }}
                >
                  <option value="Bronze">Bronze Tier</option>
                  <option value="Silver">Silver Tier</option>
                  <option value="Gold">Gold Tier</option>
                </select>
              </div>
            </div>

            {/* Plan Duration Dropdown */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                position: "relative",
              }}
            >
              <label
                style={{
                  fontSize: "12.5px",
                  fontWeight: 600,
                  color: "#0F172A",
                }}
              >
                Plan Duration (Billing Cycle)
              </label>
              <div
                onClick={() => setIsDurationDropdownOpen((prev) => !prev)}
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  border: "1px solid #E2E8F0",
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "#FFFFFF",
                  fontSize: "13.5px",
                  color: "#0F172A",
                  cursor: "pointer",
                  boxSizing: "border-box",
                }}
              >
                <span style={{ fontWeight: 600 }}>{formData.planDuration || "1 Week"}</span>
                <ChevronDown
                  size={16}
                  color="#64748B"
                  style={{
                    transform: isDurationDropdownOpen ? "rotate(180deg)" : "none",
                    transition: "transform 0.2s ease",
                  }}
                />
              </div>

              {/* Dropdown Menu */}
              {isDurationDropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    marginTop: "4px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                    boxShadow: "0 10px 20px rgba(0, 0, 0, 0.08)",
                    zIndex: 20,
                    overflow: "hidden",
                  }}
                >
                  {durationOptions.map((opt) => (
                    <div
                      key={opt}
                      onClick={() => {
                        handleTextChange("planDuration", opt);
                        setIsDurationDropdownOpen(false);
                      }}
                      style={{
                        padding: "10px 14px",
                        fontSize: "13px",
                        color: formData.planDuration === opt ? "#FF5500" : "#334155",
                        fontWeight: formData.planDuration === opt ? 600 : 400,
                        backgroundColor:
                          formData.planDuration === opt ? "#FFF1E8" : "transparent",
                        cursor: "pointer",
                        transition: "background-color 0.15s ease",
                      }}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              )}
              <span style={{ fontSize: "11.5px", color: "#64748B" }}>
                Selected cycle: <strong>{formData.planDuration || "1 Week"}</strong>. Customers will be billed and active for this exact period.
              </span>
            </div>
          </div>

          {/* Card 2: Plan Pricing (₹ INR) */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              border: "1px solid #E2E8F0",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              boxSizing: "border-box",
            }}
          >
            <h2
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "#0F172A",
                margin: 0,
              }}
            >
              Plan Pricing (₹ INR)
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "16px",
                width: "100%",
              }}
            >
              {/* Price for Plan Duration */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label
                  style={{
                    fontSize: "12.5px",
                    fontWeight: 600,
                    color: "#0F172A",
                  }}
                >
                  Price for {formData.planDuration || "1 Week"} (₹)
                </label>
                <input
                  type="text"
                  placeholder={`Price for ${formData.planDuration || "1 Week"}`}
                  value={formData.monthlyPrice}
                  onChange={(e) => handleTextChange("monthlyPrice", e.target.value)}
                  style={{
                    width: "100%",
                    borderRadius: "8px",
                    border: "1px solid #E2E8F0",
                    padding: "10px 14px",
                    fontSize: "13.5px",
                    color: "#0F172A",
                    backgroundColor: "#FFFFFF",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              {/* Quarterly Price */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label
                  style={{
                    fontSize: "12.5px",
                    fontWeight: 600,
                    color: "#0F172A",
                  }}
                >
                  Quarterly Price
                </label>
                <input
                  type="text"
                  value={formData.quarterlyPrice}
                  onChange={(e) => handleTextChange("quarterlyPrice", e.target.value)}
                  style={{
                    width: "100%",
                    borderRadius: "8px",
                    border: "1px solid #E2E8F0",
                    padding: "10px 14px",
                    fontSize: "13.5px",
                    color: "#0F172A",
                    backgroundColor: "#FFFFFF",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              {/* Yearly Price */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label
                  style={{
                    fontSize: "12.5px",
                    fontWeight: 600,
                    color: "#0F172A",
                  }}
                >
                  Yearly Price
                </label>
                <input
                  type="text"
                  value={formData.yearlyPrice}
                  onChange={(e) => handleTextChange("yearlyPrice", e.target.value)}
                  style={{
                    width: "100%",
                    borderRadius: "8px",
                    border: "1px solid #E2E8F0",
                    padding: "10px 14px",
                    fontSize: "13.5px",
                    color: "#0F172A",
                    backgroundColor: "#FFFFFF",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Card 3: Included in Weekly Plans */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              border: "1px solid #E2E8F0",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#0F172A",
                  margin: 0,
                }}
              >
                Included in Weekly Plans
              </h2>
              <button
                type="button"
                onClick={handleAddFeatureDirect}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  color: "#FF5500",
                  fontSize: "13px",
                  fontWeight: 600,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  fontFamily: "inherit",
                }}
              >
                <Plus size={14} strokeWidth={2.5} />
                <span>Add</span>
              </button>
            </div>

            {/* Feature items */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {formData.includedFeatures.length === 0 ? (
                <div
                  style={{
                    padding: "20px 16px",
                    backgroundColor: "#F8FAFC",
                    border: "1.5px dashed #CBD5E1",
                    borderRadius: "8px",
                    textAlign: "center",
                    fontSize: "13px",
                    color: "#64748B",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span>No features added yet.</span>
                  <button
                    type="button"
                    onClick={handleAddFeatureDirect}
                    style={{
                      padding: "6px 14px",
                      border: "1px solid #FED7AA",
                      borderRadius: "6px",
                      backgroundColor: "#FFF7ED",
                      color: "#FF5500",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    + Add First Feature
                  </button>
                </div>
              ) : (
                formData.includedFeatures.map((feature) => (
                  <div
                    key={feature.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "2px 0",
                    }}
                  >
                    <div
                      style={{
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                      }}
                      onClick={() => handleFeatureToggle(feature.id)}
                    >
                      <div
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "4px",
                          border: feature.checked ? "1.5px solid #FF5500" : "1.5px solid #CBD5E1",
                          backgroundColor: feature.checked ? "#FF5500" : "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          transition: "all 0.15s ease",
                        }}
                      >
                        {feature.checked && (
                          <span style={{ color: "#FFFFFF", fontSize: "11px", fontWeight: "bold" }}>
                            ✓
                          </span>
                        )}
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="e.g. 7 Meals per week, 1 Dal + 1 Sabzi..."
                      value={feature.label}
                      onChange={(e) => handleFeatureUpdateLabel(feature.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddFeatureDirect();
                        }
                      }}
                      autoFocus={!feature.label}
                      style={{
                        flex: 1,
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                        borderRadius: "6px",
                        padding: "8px 12px",
                        fontSize: "13px",
                        color: "#0F172A",
                        outline: "none",
                        fontFamily: "inherit",
                      }}
                    />

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleFeatureDelete(feature.id)}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "6px",
                        border: "1px solid #FEE2E2",
                        backgroundColor: "#FFF5F5",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#EF4444",
                        cursor: "pointer",
                        padding: 0,
                        flexShrink: 0,
                        transition: "background-color 0.15s ease",
                      }}
                      title="Delete item"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Card 4: Plan Timing & Schedule */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              border: "1px solid #E2E8F0",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#0F172A",
                  margin: 0,
                }}
              >
                Plan Timing & Schedule
              </h2>
              <button
                type="button"
                onClick={handleAddTimingItem}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  color: "#FF5500",
                  fontSize: "13px",
                  fontWeight: 600,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  fontFamily: "inherit",
                }}
              >
                <Plus size={14} strokeWidth={2.5} />
                <span>Add</span>
              </button>
            </div>

            {/* Meal Serving Timings */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                marginTop: "4px",
              }}
            >
              <label
                style={{
                  fontSize: "12.5px",
                  fontWeight: 700,
                  color: "#0F172A",
                }}
              >
                Meal Serving Timings
              </label>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {formData.mealTimings.map((timing) => (
                  <div
                    key={timing.id}
                    style={{
                      border: "1px solid #E2E8F0",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: "#FFFFFF",
                      boxSizing: "border-box",
                      gap: "10px",
                    }}
                  >
                    <input
                      type="text"
                      value={timing.mealName}
                      onChange={(e) => handleMealNameChange(timing.id, e.target.value)}
                      placeholder="Meal (e.g. Breakfast)"
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#0F172A",
                        minWidth: "120px",
                        width: "140px",
                        border: "1px solid #E2E8F0",
                        borderRadius: "6px",
                        padding: "6px 10px",
                        outline: "none",
                        fontFamily: "inherit",
                      }}
                    />

                    <input
                      type="text"
                      value={timing.timing}
                      onChange={(e) => handleTimingChange(timing.id, e.target.value)}
                      placeholder="e.g. 7:30 AM – 9:30 AM"
                      style={{
                        fontSize: "13px",
                        color: "#334155",
                        fontWeight: 500,
                        flex: 1,
                        border: "1px solid #E2E8F0",
                        borderRadius: "6px",
                        padding: "6px 10px",
                        outline: "none",
                        fontFamily: "inherit",
                      }}
                    />

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleDeleteTiming(timing.id)}
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "6px",
                          border: "1px solid #FEE2E2",
                          backgroundColor: "#FFF5F5",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#EF4444",
                          cursor: "pointer",
                          padding: 0,
                          flexShrink: 0,
                          transition: "background-color 0.15s ease",
                        }}
                        title="Delete Timing"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 5: Subscription Policies */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              border: "1px solid #E2E8F0",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              boxSizing: "border-box",
            }}
          >
            <h2
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "#0F172A",
                margin: 0,
              }}
            >
              Subscription Policies
            </h2>

            {/* Policy 1: Allow User to Cancel Subscription */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#0F172A",
                  }}
                >
                  Allow User to Cancel Subscription
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: "#64748B",
                    fontWeight: 400,
                  }}
                >
                  Partners can cancel anytime directly from their cloud merchant dashboard.
                </span>
              </div>

              {/* Toggle switch */}
              <div
                onClick={() => handleToggle("allowCancelSubscription")}
                style={{
                  width: "42px",
                  height: "24px",
                  borderRadius: "12px",
                  backgroundColor: formData.allowCancelSubscription ? "#FF5500" : "#CBD5E1",
                  display: "flex",
                  alignItems: "center",
                  padding: "2px",
                  cursor: "pointer",
                  boxSizing: "border-box",
                  transition: "background-color 0.2s ease",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    backgroundColor: "#FFFFFF",
                    transform: formData.allowCancelSubscription
                      ? "translateX(18px)"
                      : "translateX(0px)",
                    transition: "transform 0.2s ease",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                  }}
                />
              </div>
            </div>

            {/* Policy 2: Allow User to Pause Billing */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#0F172A",
                  }}
                >
                  Allow User to Pause Billing
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: "#64748B",
                    fontWeight: 400,
                  }}
                >
                  Enable temporary pause states instead of absolute subscription termination.
                </span>
              </div>

              {/* Days Dropdown (1-30 Days) */}
              <div style={{ position: "relative", minWidth: "130px", flexShrink: 0 }}>
                <select
                  value={formData.pauseBillingPeriod || "30 Days"}
                  onChange={(e) => handleInputChange("pauseBillingPeriod", e.target.value)}
                  style={{
                    width: "100%",
                    height: "38px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                    padding: "0 28px 0 12px",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#0F172A",
                    outline: "none",
                    cursor: "pointer",
                    appearance: "none",
                    boxSizing: "border-box",
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
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "10px",
                    color: "#64748B",
                    pointerEvents: "none",
                  }}
                >
                  ▼
                </span>
              </div>
            </div>
          </div>

          {/* Card 6: Danger Zone */}
          <div
            style={{
              backgroundColor: "#FFF5F5",
              borderRadius: "12px",
              border: "1px solid #FCA5A5",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              boxSizing: "border-box",
            }}
          >
            <h2
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "#EF4444",
                margin: 0,
              }}
            >
              Danger Zone
            </h2>

            <p
              style={{
                fontSize: "12.5px",
                color: "#64748B",
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              Archiving this plan will prevent new subscribers from purchasing it. Existing
              active subscriptions will continue until their billing cycle finishes.
            </p>

            <button
              type="button"
              onClick={handleArchive}
              style={{
                backgroundColor: "#EF4444",
                color: "#FFFFFF",
                fontSize: "13px",
                fontWeight: 700,
                borderRadius: "6px",
                padding: "10px 18px",
                border: "none",
                cursor: "pointer",
                width: "fit-content",
                marginTop: "4px",
                fontFamily: "inherit",
                transition: "opacity 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Archive Plan Tier
            </button>
          </div>
        </div>

        {/* summary-column (Right side - pinned top right) */}
        <div
          style={{
            width: "340px",
            minWidth: "340px",
            maxWidth: "340px",
            flex: "0 0 340px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            boxSizing: "border-box",
            position: "sticky",
            top: "24px",
            alignSelf: "flex-start",
          }}
          className="summary-column"
        >
          {/* Card 1: PLAN METRICS */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              border: "1px solid #E2E8F0",
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              boxSizing: "border-box",
            }}
          >
            <h3
              style={{
                fontSize: "11.5px",
                fontWeight: 700,
                color: "#475569",
                letterSpacing: "0.6px",
                textTransform: "uppercase",
                margin: 0,
              }}
            >
              PLAN METRICS
            </h3>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              {/* Subscribers */}
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span
                  style={{
                    fontSize: "10.5px",
                    fontWeight: 700,
                    color: "#94A3B8",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                  }}
                >
                  SUBSCRIBERS
                </span>
                <span
                  style={{
                    fontSize: "26px",
                    fontWeight: 800,
                    color: "#0F172A",
                    lineHeight: 1.2,
                  }}
                >
                  {formData.metrics.subscribers}
                </span>
              </div>

              {/* Monthly Revenue */}
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span
                  style={{
                    fontSize: "10.5px",
                    fontWeight: 700,
                    color: "#94A3B8",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                  }}
                >
                  MONTHLY REV
                </span>
                <span
                  style={{
                    fontSize: "26px",
                    fontWeight: 800,
                    color: "#10B981",
                    lineHeight: 1.2,
                  }}
                >
                  {formData.metrics.monthlyRevenue}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Plan Metadata Summary */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              border: "1px solid #E2E8F0",
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
              boxSizing: "border-box",
            }}
          >
            <h3
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "#0F172A",
                margin: 0,
              }}
            >
              Plan Metadata Summary
            </h3>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {/* Plan ID */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "12.5px", color: "#64748B" }}>Plan ID</span>
                <span
                  style={{
                    fontSize: "12.5px",
                    fontWeight: 700,
                    color: "#0F172A",
                  }}
                >
                  {formData.metadata.planId}
                </span>
              </div>

              {/* Deployed Date */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "12.5px", color: "#64748B" }}>Deployed Date</span>
                <span
                  style={{
                    fontSize: "12.5px",
                    fontWeight: 700,
                    color: "#0F172A",
                  }}
                >
                  {formData.metadata.deployedDate}
                </span>
              </div>

              {/* Tax Code */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "12.5px", color: "#64748B" }}>Tax Code</span>
                <span
                  style={{
                    fontSize: "12.5px",
                    fontWeight: 700,
                    color: "#0F172A",
                  }}
                >
                  {formData.metadata.taxCode}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                marginTop: "4px",
              }}
            >
              {/* Save Changes button */}
              <button
                type="button"
                onClick={handleSave}
                style={{
                  width: "100%",
                  height: "44px",
                  backgroundColor: "#FF5500",
                  color: "#FFFFFF",
                  borderRadius: "8px",
                  border: "none",
                  fontSize: "13.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "inherit",
                  boxShadow: "0 2px 4px rgba(255, 85, 0, 0.15)",
                  transition: "opacity 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Save Changes
              </button>

              {/* Discard Modifications button */}
              <button
                type="button"
                onClick={handleDiscard}
                style={{
                  width: "100%",
                  height: "42px",
                  backgroundColor: "#FFFFFF",
                  color: "#475569",
                  borderRadius: "8px",
                  border: "1px solid #E2E8F0",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "inherit",
                  transition: "background-color 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
              >
                Discard Modifications
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 1024px) {
          .columns-group {
            flex-direction: column !important;
          }
          .summary-column {
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
            flex: 1 1 100% !important;
            position: static !important;
          }
        }
      `}</style>
    </div>
  );
}
