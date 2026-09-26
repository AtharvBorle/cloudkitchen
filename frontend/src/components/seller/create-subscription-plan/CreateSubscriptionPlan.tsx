'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, Pencil, CheckCircle2 } from 'lucide-react';
import ConsoleSidebar from '../sidebar/Sidebar';
import Topbar from '../nav/Topbar';
import { useSellerProfile } from '@/hooks/useSellerProfile';
import { saveMealPlan } from '@/lib/meal-subscriptions';
import styles from './CreateSubscriptionPlan.module.css';

export interface CreateSubscriptionPlanProps {
  ownerName?: string;
  partnerRole?: string;
  avatarInitials?: string;
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
}

export interface PlanFeature {
  id: string;
  label: string;
  checked: boolean;
}

export const CreateSubscriptionPlan: React.FC<CreateSubscriptionPlanProps> = ({
  ownerName: initialOwnerName,
  partnerRole: initialPartnerRole,
  avatarInitials: initialAvatarInitials,
  onSearch,
  onNotificationClick,
}) => {
  const router = useRouter();
  const seller = useSellerProfile();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const ownerName = initialOwnerName || seller.ownerName;
  const partnerRole = initialPartnerRole || seller.partnerRole;
  const avatarInitials = initialAvatarInitials || seller.avatarInitials;

  // Form states
  const [planName, setPlanName] = useState('');
  const [planTier, setPlanTier] = useState('Bronze');
  const [weeklyPrice, setWeeklyPrice] = useState('');

  // Included in weekly plans feature list (starts empty for user to add)
  const [features, setFeatures] = useState<PlanFeature[]>([]);

  // 4. Plan Timing & Schedule
  const [planDuration, setPlanDuration] = useState('1 Week');
  const [mealTimings, setMealTimings] = useState([
    { id: '1', name: 'Breakfast', time: '7:30 AM – 9:30 AM' },
    { id: '2', name: 'Lunch', time: '12:30 PM – 2:00 PM' },
    { id: '3', name: 'Evening Snacks', time: '5:30 PM – 6:30 PM' },
    { id: '4', name: 'Dinner', time: '8:00 PM – 9:30 PM' },
  ]);

  // 5. Subscription Policies
  const [allowCancel, setAllowCancel] = useState(true);
  const [pauseBillingPeriod, setPauseBillingPeriod] = useState('30 Days');

  const handleRemoveMealTiming = (id: string) => {
    setMealTimings((prev) => prev.filter((m) => m.id !== id));
  };

  const handleToggleFeature = (id: string) => {
    setFeatures((prev) =>
      prev.map((f) => (f.id === id ? { ...f, checked: !f.checked } : f))
    );
  };

  const handleUpdateFeatureLabel = (id: string, label: string) => {
    setFeatures((prev) =>
      prev.map((f) => (f.id === id ? { ...f, label } : f))
    );
  };

  const handleRemoveFeature = (id: string) => {
    setFeatures((prev) =>
      prev.filter((f) => f.id !== id));
  };

  const handleAddFeature = () => {
    const newFeature: PlanFeature = {
      id: `feat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      label: '',
      checked: true,
    };
    setFeatures((prev) => [...prev, newFeature]);
  };

  const enabledFeatures = features.filter((f) => f.checked && f.label.trim().length > 0);

  const parsedPriceNum = parseFloat(weeklyPrice);
  const formattedPrice =
    weeklyPrice && !isNaN(parsedPriceNum) && parsedPriceNum >= 0
      ? parsedPriceNum.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : '0.00';

  return (
    <div className={styles.planContainer}>
      {/* 1. Left Sidebar with active Subscription tab */}
      <ConsoleSidebar
        activeItemId="subscription"
        isMobileOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        ownerName={ownerName}
        partnerRole={partnerRole}
        avatarInitials={avatarInitials}
      />

      {/* 2. Right Content Section */}
      <div className={styles.rightSection}>
        {/* Top Navbar */}
        <Topbar
          title="Owner Operations Console"
          ownerName={ownerName}
          partnerRole={partnerRole}
          avatarInitials={avatarInitials}
          onSearch={onSearch}
          onNotificationClick={onNotificationClick}
          onMenuToggle={() => setIsMobileOpen((prev) => !prev)}
        />

        {/* Main Content Canvas */}
        <main className={styles.mainContent}>
          {/* Header Row: Breadcrumb, Title & Subtitle */}
          <div className={styles.headerSection}>
            <div className={styles.breadcrumbRow}>
              <Link href="/seller/subscription" className={styles.breadcrumbRoot} style={{ textDecoration: 'none' }}>
                Subscriptions
              </Link>
              <span className={styles.breadcrumbSeparator}>&gt;</span>
              <span className={styles.breadcrumbCurrent}>Create Plan</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h1 className={styles.title}>Create New Subscription Plan</h1>
                <p className={styles.subtitle}>
                  Define tier packages, custom features, and cycle options for partners.
                </p>
              </div>
              <Link
                href="/seller/subscription"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  color: '#475569',
                  fontSize: '0.88rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                ← Back to Plans
              </Link>
            </div>
          </div>

          {/* 2-Column Form & Live Preview Layout */}
          <div className={styles.contentLayout}>
            {/* Left Column: Form Cards */}
            <div className={styles.leftColumn}>
              {/* 1. Plan Basics Card */}
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Plan Basics &amp; Duration</h2>
                <div className={styles.twoColRow}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Plan Name</label>
                    <input
                      type="text"
                      className={styles.textInput}
                      placeholder="e.g. Starter Partner, Enterprise Growth"
                      value={planName}
                      onChange={(e) => setPlanName(e.target.value)}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Plan Tier</label>
                    <div className={styles.selectWrapper}>
                      <select
                        className={styles.selectInput}
                        value={planTier}
                        onChange={(e) => setPlanTier(e.target.value)}
                      >
                        <option value="Bronze">Bronze Tier</option>
                        <option value="Silver">Silver Tier</option>
                        <option value="Gold">Gold Tier</option>
                      </select>
                      <span className={styles.selectArrow}>▼</span>
                    </div>
                  </div>
                </div>

                {/* Plan Duration Dropdown */}
                <div className={styles.fieldGroup} style={{ marginTop: "6px" }}>
                  <label className={styles.fieldLabel}>Plan Duration (Billing Cycle)</label>
                  <div className={styles.selectWrapper}>
                    <select
                      className={styles.selectInput}
                      value={planDuration}
                      onChange={(e) => setPlanDuration(e.target.value)}
                    >
                      <option value="1 Week">1 Week (Weekly)</option>
                      <option value="2 Weeks">2 Weeks (Bi-weekly)</option>
                      <option value="1 Month">1 Month (Monthly)</option>
                    </select>
                    <span className={styles.selectArrow}>▼</span>
                  </div>
                  <p style={{ fontSize: "11.5px", color: "#64748B", margin: "4px 0 0 0" }}>
                    Selected cycle: <strong>{planDuration}</strong>. Subscriptions will automatically operate and renew on this cycle.
                  </p>
                </div>
              </div>

              {/* 2. Plan Pricing Card */}
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Plan Pricing (₹ INR)</h2>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    Price for {planDuration} (₹)
                  </label>
                  <div className={styles.priceInputWrapper}>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={styles.priceInput}
                      placeholder={`Enter price for ${planDuration}`}
                      value={weeklyPrice}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "" || (!isNaN(Number(val)) && Number(val) >= 0)) {
                          setWeeklyPrice(val);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
                          e.preventDefault();
                        }
                      }}
                    />
                  </div>
                  <p style={{ fontSize: "11.5px", color: "#64748B", margin: "4px 0 0 0" }}>
                    Direct amount charged to subscribers for the entire <strong>{planDuration}</strong> duration.
                  </p>
                </div>
              </div>

              {/* 3. Included Features Card */}
              <div className={styles.card}>
                <div className={styles.cardHeaderRow}>
                  <h2 className={styles.cardTitle}>Included in Plan</h2>
                  <button
                    type="button"
                    className={styles.addBtn}
                    onClick={handleAddFeature}
                  >
                    <span>+ Add</span>
                  </button>
                </div>

                {/* Features List */}
                <div className={styles.featuresList}>
                  {features.length === 0 ? (
                    <div className={styles.emptyFeaturesState}>
                      <span>No features added yet.</span>
                      <button
                        type="button"
                        className={styles.addBtn}
                        onClick={handleAddFeature}
                        style={{ padding: '6px 12px', border: '1px solid #FED7AA', borderRadius: '6px', backgroundColor: '#FFF7ED' }}
                      >
                        + Add First Feature
                      </button>
                    </div>
                  ) : (
                    features.map((feature) => (
                      <div key={feature.id} className={styles.featureItem}>
                        <label
                          className={styles.checkboxLabel}
                          onClick={() => handleToggleFeature(feature.id)}
                        >
                          <div
                            className={`${styles.checkboxBox} ${
                              feature.checked ? styles.checkboxBoxActive : ''
                            }`}
                          >
                            {feature.checked && <span className={styles.checkmark}>✓</span>}
                          </div>
                        </label>
                        <input
                          type="text"
                          className={styles.featureInput}
                          placeholder="e.g. 7 Meals per week, 1 Dal + 1 Sabzi..."
                          value={feature.label}
                          onChange={(e) => handleUpdateFeatureLabel(feature.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddFeature();
                            }
                          }}
                          autoFocus={!feature.label}
                        />
                        <button
                          type="button"
                          className={styles.deleteBtn}
                          onClick={() => handleRemoveFeature(feature.id)}
                          aria-label="Remove feature"
                        >
                          <Trash2 size={16} strokeWidth={2.2} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 4. Meal Serving Timings Card */}
              <div className={styles.card}>
                <div className={styles.cardHeaderRow}>
                  <h2 className={styles.cardTitle}>Meal Serving Timings</h2>
                  <button
                    type="button"
                    className={styles.addBtn}
                    onClick={() => {
                      const newId = (mealTimings.length + 1).toString();
                      setMealTimings([
                        ...mealTimings,
                        { id: newId, name: 'New Meal', time: '10:00 AM – 11:00 AM' },
                      ]);
                    }}
                  >
                    <span>+ Add</span>
                  </button>
                </div>

                {/* Meal Serving Timings */}
                <div className={styles.fieldGroup}>
                  <div className={styles.mealTimingsList}>
                    {mealTimings.map((meal) => (
                      <div key={meal.id} className={styles.mealTimingRow}>
                        <span className={styles.mealName}>{meal.name}</span>
                        <div className={styles.mealActionGroup}>
                          <span className={styles.mealTimeRange}>{meal.time}</span>
                          <button
                            type="button"
                            className={styles.mealEditBtn}
                            aria-label={`Edit ${meal.name} timing`}
                          >
                            <Pencil size={15} strokeWidth={2.2} />
                          </button>
                          <button
                            type="button"
                            className={styles.mealDeleteBtn}
                            onClick={() => handleRemoveMealTiming(meal.id)}
                            aria-label={`Remove ${meal.name}`}
                          >
                            <Trash2 size={16} strokeWidth={2.2} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 5. Subscription Policies Card */}
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Subscription Policies</h2>

                {/* Policy 1: Allow User to Cancel Subscription */}
                <div className={styles.policyRow}>
                  <div className={styles.policyInfo}>
                    <span className={styles.policyLabel}>Allow User to Cancel Subscription</span>
                    <p className={styles.policyDescription}>
                      Partners can cancel anytime directly from their cloud merchant dashboard.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAllowCancel((prev) => !prev)}
                    className={`${styles.toggleSwitch} ${
                      allowCancel ? styles.toggleSwitchActive : ''
                    }`}
                    aria-label="Toggle allow cancel subscription"
                  >
                    <span
                      className={`${styles.toggleThumb} ${
                        allowCancel ? styles.toggleThumbActive : ''
                      }`}
                    />
                  </button>
                </div>

                <div className={styles.policyDivider} />

                {/* Policy 2: Allow User to Pause Billing */}
                <div className={styles.policyRow}>
                  <div className={styles.policyInfo}>
                    <span className={styles.policyLabel}>Allow User to Pause Billing</span>
                    <p className={styles.policyDescription}>
                      Enable temporary pause states instead of absolute subscription termination.
                    </p>
                  </div>
                  <div className={styles.pauseSelectWrapper}>
                    <select
                      className={styles.pauseSelectInput}
                      value={pauseBillingPeriod}
                      onChange={(e) => setPauseBillingPeriod(e.target.value)}
                    >
                      {Array.from({ length: 30 }, (_, i) => {
                        const day = i + 1;
                        const label = `${day} ${day === 1 ? 'Day' : 'Days'}`;
                        return (
                          <option key={label} value={label}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                    <span className={styles.selectArrow}>▼</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Live Plan Preview Card */}
            <div className={styles.rightColumn}>
              <div className={styles.previewCard}>
                <h3 className={styles.previewTitle}>Live Plan Preview</h3>

                {/* Inner Preview Box */}
                <div className={styles.innerPreviewBox}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                    <span className={styles.previewModeLabel}>PREVIEW MODE</span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.4px',
                        backgroundColor: planTier === 'Bronze' ? '#FFFBEB' : planTier === 'Silver' ? '#F1F5F9' : '#FEF3C7',
                        color: planTier === 'Bronze' ? '#B45309' : planTier === 'Silver' ? '#475569' : '#D97706',
                      }}
                    >
                      {planTier} Tier
                    </span>
                  </div>
                  <h4 className={styles.previewPlanName}>
                    {planName.trim() ? planName : '[Plan Name Draft]'}
                  </h4>
                  <div className={styles.previewPriceRow}>
                    <span className={styles.previewPriceAmount}>
                      ₹{formattedPrice}
                    </span>
                    <span className={styles.previewPriceCycle}>
                      {planDuration === "1 Week" ? " / week" : planDuration === "2 Weeks" ? " / 2 weeks" : " / month"}
                    </span>
                  </div>

                  <div className={styles.previewDivider} />

                  <div className={styles.previewFeaturesList}>
                    {enabledFeatures.length > 0 ? (
                      enabledFeatures.map((f) => (
                        <div key={f.id} className={styles.previewFeatureItem}>
                          <span className={styles.previewCheckIcon}>✓</span>
                          <span>{f.label}</span>
                        </div>
                      ))
                    ) : (
                      <div className={styles.noFeaturesText}>
                        <span className={styles.previewCheckMuted}>✓</span>
                        <span>No Features Enabled Yet</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Metadata details */}
                <div className={styles.metaDetails}>
                  <div className={styles.metaRow}>
                    <span className={styles.metaKey}>Cycle Duration</span>
                    <span className={styles.metaValue}>{planDuration}</span>
                  </div>
                  <div className={styles.metaRow}>
                    <span className={styles.metaKey}>Tax Model</span>
                    <span className={styles.metaValue}>GST 18% Extra</span>
                  </div>
                </div>

                {errorMessage && (
                  <div style={{ padding: "10px 14px", backgroundColor: "#FEF2F2", color: "#EF4444", borderRadius: "8px", fontSize: "13px", fontWeight: 600 }}>
                    {errorMessage}
                  </div>
                )}

                {/* Action Buttons */}
                <button
                  type="button"
                  className={styles.deployBtn}
                  onClick={async () => {
                    if (!planName.trim()) {
                      setErrorMessage('Please enter a Plan Name before deploying.');
                      return;
                    }
                    const basePriceNum = parseFloat(weeklyPrice);
                    if (!weeklyPrice.trim() || isNaN(basePriceNum) || basePriceNum <= 0) {
                      setErrorMessage(`Please enter a valid positive Price (₹) greater than 0 for ${planDuration}.`);
                      return;
                    }

                    setErrorMessage(null);

                    const durLower = planDuration.toLowerCase();
                    const isWeekly = durLower.includes("week");
                    let weeklyCalculated = basePriceNum;
                    let monthlyCalculated = basePriceNum * 4;

                    if (durLower.includes("2 week")) {
                      weeklyCalculated = basePriceNum / 2;
                      monthlyCalculated = basePriceNum * 2;
                    } else if (durLower.includes("1 week") || durLower.includes("week")) {
                      weeklyCalculated = basePriceNum;
                      monthlyCalculated = basePriceNum * 4;
                    } else if (durLower.includes("1 month") || durLower.includes("month")) {
                      monthlyCalculated = basePriceNum;
                      weeklyCalculated = basePriceNum / 4;
                    } else if (durLower.includes("6 month")) {
                      monthlyCalculated = basePriceNum / 6;
                      weeklyCalculated = basePriceNum / 26;
                    } else if (durLower.includes("year")) {
                      monthlyCalculated = basePriceNum / 12;
                      weeklyCalculated = basePriceNum / 52;
                    }

                    await saveMealPlan({
                      name: planName.trim(),
                      tier: planTier,
                      weeklyPrice: String(basePriceNum),
                      monthlyPrice: `₹${monthlyCalculated.toFixed(0)}`,
                      quarterlyPrice: isWeekly ? "" : `₹${(monthlyCalculated * 3 * 0.9).toFixed(0)}`,
                      yearlyPrice: isWeekly ? "" : `₹${(monthlyCalculated * 12 * 0.8).toFixed(0)}`,
                      duration: planDuration,
                      features: enabledFeatures.map((f) => f.label),
                      mealTimings: mealTimings.map((m) => `${m.name}: ${m.time}`),
                      status: 'Live',
                      allowCancel,
                      pauseBillingPeriod,
                    });

                    setToastMessage(`Plan "${planName}" created & deployed successfully!`);
                    setTimeout(() => {
                      router.push('/seller/subscription');
                    }, 900);
                  }}
                >
                  Create & Deploy Plan
                </button>

                <button
                  type="button"
                  className={styles.discardBtn}
                  onClick={() => {
                    router.push('/seller/subscription');
                  }}
                >
                  Discard Draft
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "32px",
            right: "32px",
            backgroundColor: "#0F172A",
            color: "#FFFFFF",
            padding: "14px 24px",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: 600,
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <CheckCircle2 size={18} color="#22C55E" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default CreateSubscriptionPlan;
