"use client";

import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import styles from "./SubscriptionPlans.module.css";

export interface PlanItem {
  id: string;
  name: string;
  subtitle: string;
  price: string;
  period: string;
  badge?: string;
  features: string[];
  buttonText: string;
  isPremium?: boolean;
}

const DEFAULT_PLANS: PlanItem[] = [
  {
    id: "basic",
    name: "Basic Plan",
    subtitle: "Perfect for light eaters",
    price: "₹299",
    period: "/week",
    features: [
      "3 gourmet meals per week",
      "Curated Lunch delivery",
      "Pause or cancel anytime",
      "Standard packaging",
    ],
    buttonText: "Choose Plan",
    isPremium: false,
  },
  {
    id: "silver",
    name: "Silver Plan",
    subtitle: "Our most balanced plan",
    price: "₹499",
    period: "/week",
    features: [
      "5 gourmet meals per week",
      "Flexible Lunch/Dinner options",
      "Pause or cancel anytime",
      "Premium insulated packing",
    ],
    buttonText: "Choose Plan",
    isPremium: false,
  },
  {
    id: "premium",
    name: "Premium Plan",
    subtitle: "The complete dining experience",
    price: "₹799",
    period: "/week",
    badge: "BEST VALUE",
    features: [
      "7 gourmet meals per week",
      "All meals included (Lunch & Dinner)",
      "Diet customization options",
      "Weekly chef consults & updates",
    ],
    buttonText: "Subscribe Now",
    isPremium: true,
  },
];

export interface SubscriptionPlansProps {
  plans?: PlanItem[];
  defaultActivePlanId?: string;
  onSelectPlan?: (plan: PlanItem) => void;
}

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({
  plans = DEFAULT_PLANS,
  defaultActivePlanId = "basic",
  onSelectPlan,
}) => {
  const [activePlanId, setActivePlanId] = useState<string>(defaultActivePlanId);

  const handlePlanClick = (plan: PlanItem) => {
    setActivePlanId(plan.id);
    if (onSelectPlan) {
      onSelectPlan(plan);
    }
  };

  return (
    <section
      className={styles.plansContainer}
      aria-label="Weekly Subscription Plans"
    >
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Weekly Subscription Plans</h2>
      </div>

      <div className={styles.cardsGrid}>
        {plans.map((plan) => {
          const isActive = activePlanId === plan.id;
          return (
            <div
              key={plan.id}
              className={`${styles.planCard} ${
                isActive ? styles.activeCard : ""
              }`}
              onClick={() => handlePlanClick(plan)}
              role="button"
              tabIndex={0}
              onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handlePlanClick(plan);
                }
              }}
              aria-pressed={isActive}
            >
              <div>
                {/* Header with Title and Optional Badge */}
                <div className={styles.cardHeader}>
                  <h3 className={styles.planName}>{plan.name}</h3>
                  {plan.badge && (
                    <span className={styles.bestValueBadge}>{plan.badge}</span>
                  )}
                </div>

                <p className={styles.planSubtitle}>{plan.subtitle}</p>

                {/* Price Row */}
                <div className={styles.priceRow}>
                  <span className={styles.priceAmount}>{plan.price}</span>
                  <span className={styles.pricePeriod}>{plan.period}</span>
                </div>

                <div
                  className={`${styles.cardDivider} ${
                    isActive ? styles.activeDivider : ""
                  }`}
                />

                  {/* Features List */}
                <ul className={styles.featuresList}>
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className={styles.featureItem}>
                      <CheckCircle2
                        size={20}
                        strokeWidth={2.4}
                        className={styles.featureIcon}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <button
                type="button"
                className={isActive ? styles.filledBtn : styles.outlineBtn}
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation();
                  handlePlanClick(plan);
                }}
                aria-label={`${plan.buttonText} for ${plan.name}`}
              >
                {plan.buttonText}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default SubscriptionPlans;
