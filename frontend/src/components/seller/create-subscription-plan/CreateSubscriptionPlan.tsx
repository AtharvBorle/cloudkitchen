'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, Pencil } from 'lucide-react';
import ConsoleSidebar from '../sidebar/Sidebar';
import Topbar from '../nav/Topbar';
import { useSellerProfile } from '@/hooks/useSellerProfile';
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

  const ownerName = initialOwnerName || seller.ownerName;
  const partnerRole = initialPartnerRole || seller.partnerRole;
  const avatarInitials = initialAvatarInitials || seller.avatarInitials;

  // Form states
  const [planName, setPlanName] = useState('');
  const [planTier, setPlanTier] = useState('');
  const [weeklyPrice, setWeeklyPrice] = useState('');

  // Included in weekly plans feature list
  const [features, setFeatures] = useState<PlanFeature[]>([
    { id: '1', label: '7 Meals per weeek', checked: false },
    { id: '2', label: '1 Dal (Seasonal) + 1 Sabzi (Dry / Gravy)', checked: false },
    { id: '3', label: 'Salad, Pickle & Papad', checked: false },
  ]);

  // Custom add field
  const [customFeatureInput, setCustomFeatureInput] = useState('');

  // 4. Plan Timing & Schedule
  const [planDuration, setPlanDuration] = useState('1 Week');
  const [mealTimings, setMealTimings] = useState([
    { id: '1', name: 'Breakfast', time: '7:30 AM – 9:30 AM' },
    { id: '2', name: 'Lunch', time: '12:30 AM – 1:30 AM' },
    { id: '3', name: 'Evening Snacks', time: '5:30 AM – 6:30 AM' },
    { id: '4', name: 'Dinner', time: '8:30 AM – 9:30 AM' },
  ]);

  // 5. Subscription Policies
  const [allowCancel, setAllowCancel] = useState(true);
  const [pauseBillingPeriod, setPauseBillingPeriod] = useState('Monthly');

  const handleRemoveMealTiming = (id: string) => {
    setMealTimings((prev) => prev.filter((m) => m.id !== id));
  };

  const handleToggleFeature = (id: string) => {
    setFeatures((prev) =>
      prev.map((f) => (f.id === id ? { ...f, checked: !f.checked } : f))
    );
  };

  const handleRemoveFeature = (id: string) => {
    setFeatures((prev) =>
      prev.filter((f) => f.id !== id));
  };

  const handleAddFeature = () => {
    if (customFeatureInput.trim()) {
      const newFeature: PlanFeature = {
        id: Date.now().toString(),
        label: customFeatureInput.trim(),
        checked: true,
      };
      setFeatures((prev) => [...prev, newFeature]);
      setCustomFeatureInput('');
    }
  };

  const enabledFeatures = features.filter((f) => f.checked);

  const formattedPrice = weeklyPrice
    ? parseFloat(weeklyPrice).toLocaleString('en-IN', {
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
                <h2 className={styles.cardTitle}>Plan Basics</h2>
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
                    <input
                      type="text"
                      className={styles.textInput}
                      placeholder="e.g. Starter, Pro, Enterprise"
                      value={planTier}
                      onChange={(e) => setPlanTier(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* 2. Plan Pricing Card */}
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Plan Pricing (₹ INR)</h2>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Weekly Price</label>
                  <div className={styles.priceInputWrapper}>
                    <input
                      type="number"
                      step="0.01"
                      className={styles.priceInput}
                      placeholder="₹ 0.00"
                      value={weeklyPrice}
                      onChange={(e) => setWeeklyPrice(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* 3. Included in Weekly Plans Card */}
              <div className={styles.card}>
                <div className={styles.cardHeaderRow}>
                  <h2 className={styles.cardTitle}>Included in Weekly Plans</h2>
                  <button
                    type="button"
                    className={styles.addBtn}
                    onClick={handleAddFeature}
                  >
                    <span>+ Add</span>
                  </button>
                </div>

                {/* Features Checkbox List */}
                <div className={styles.featuresList}>
                  {features.map((feature) => (
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
                        <span className={styles.featureText}>{feature.label}</span>
                      </label>
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        onClick={() => handleRemoveFeature(feature.id)}
                        aria-label="Remove feature"
                      >
                        <Trash2 size={16} strokeWidth={2.2} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Custom Features Subsection */}
                <div className={styles.customFeaturesSection}>
                  <span className={styles.customFeaturesHeading}>CUSTOM FEATURES</span>
                  <div className={styles.customAddCard}>
                    <span className={styles.customAddLabel}>Custom Add</span>
                    <div className={styles.customAddInputRow}>
                      <input
                        type="text"
                        className={styles.customTextInput}
                        placeholder="e.g. Dedicated Account Manager"
                        value={customFeatureInput}
                        onChange={(e) => setCustomFeatureInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddFeature();
                          }
                        }}
                      />
                      <button
                        type="button"
                        className={styles.customAddDeleteBtn}
                        onClick={() => setCustomFeatureInput('')}
                        aria-label="Clear custom add"
                      >
                        <Trash2 size={16} strokeWidth={2.2} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Plan Timing & Schedule Card */}
              <div className={styles.card}>
                <div className={styles.cardHeaderRow}>
                  <h2 className={styles.cardTitle}>Plan Timing & Schedule</h2>
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

                {/* Plan Duration Dropdown */}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Plan Duration</label>
                  <div className={styles.selectWrapper}>
                    <select
                      className={styles.selectInput}
                      value={planDuration}
                      onChange={(e) => setPlanDuration(e.target.value)}
                    >
                      <option value="1 Week">1 Week</option>
                      <option value="2 Weeks">2 Weeks</option>
                      <option value="1 Month">1 Month</option>
                      <option value="3 Months">3 Months</option>
                    </select>
                    <span className={styles.selectArrow}>▼</span>
                  </div>
                </div>

                {/* Meal Serving Timings */}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Meal Serving Timings</label>
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
                      <option value="Weekly">Weekly</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
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
                  <span className={styles.previewModeLabel}>PREVIEW MODE</span>
                  <h4 className={styles.previewPlanName}>
                    {planName.trim() ? planName : '[Plan Name Draft]'}
                  </h4>
                  <div className={styles.previewPriceRow}>
                    <span className={styles.previewPriceAmount}>
                      ₹{formattedPrice}
                    </span>
                    <span className={styles.previewPriceCycle}> / mo</span>
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
                    <span className={styles.metaKey}>Platform Class</span>
                    <span className={styles.metaValue}>SaaS Premium</span>
                  </div>
                  <div className={styles.metaRow}>
                    <span className={styles.metaKey}>Tax Model</span>
                    <span className={styles.metaValue}>GST 18% Extra</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <button
                  type="button"
                  className={styles.deployBtn}
                  onClick={() => {
                    if (!planName.trim()) {
                      alert('Please enter a Plan Name before deploying.');
                      return;
                    }
                    alert(`Subscription plan "${planName}" created & deployed successfully!`);
                    router.push('/seller/subscription');
                  }}
                >
                  Create & Deploy Plan
                </button>

                <button
                  type="button"
                  className={styles.discardBtn}
                  onClick={() => {
                    if (confirm('Discard changes and return to Manage Subscriptions?')) {
                      router.push('/seller/subscription');
                    }
                  }}
                >
                  Discard Draft
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreateSubscriptionPlan;
