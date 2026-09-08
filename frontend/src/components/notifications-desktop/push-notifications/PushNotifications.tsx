"use client";

import React, { useState } from "react";
import styles from "./PushNotifications.module.css";
import { Package, Tag, Sparkles, Truck } from "lucide-react";

export interface NotificationOption {
  id: string;
  title: string;
  subtitle: string;
  iconType: "package" | "tag" | "sparkles" | "truck";
  defaultEnabled: boolean;
}

const DEFAULT_PUSH_OPTIONS: NotificationOption[] = [
  {
    id: "order-updates",
    title: "Order Updates",
    subtitle: "Status tracking, dispatch alerts & delivery times",
    iconType: "package",
    defaultEnabled: true,
  },
  {
    id: "promotional-offers",
    title: "Promotional Offers",
    subtitle: "Coupons, flash deals & specialized discounts",
    iconType: "tag",
    defaultEnabled: false,
  },
  {
    id: "new-arrivals",
    title: "New Arrivals",
    subtitle: "Instant updates on bakery & mess menus",
    iconType: "sparkles",
    defaultEnabled: true,
  },
  {
    id: "delivery-alerts",
    title: "Delivery Alerts",
    subtitle: "Realtime update when delivery agent is nearby",
    iconType: "truck",
    defaultEnabled: true,
  },
];

export const PushNotifications: React.FC = () => {
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({
    "order-updates": true,
    "promotional-offers": false,
    "new-arrivals": true,
    "delivery-alerts": true,
  });

  const handleToggle = (id: string) => {
    setToggleStates((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const renderIcon = (type: NotificationOption["iconType"]) => {
    switch (type) {
      case "package":
        return <Package size={20} className={styles.icon} />;
      case "tag":
        return <Tag size={20} className={styles.icon} />;
      case "sparkles":
        return <Sparkles size={20} className={styles.icon} />;
      case "truck":
        return <Truck size={20} className={styles.icon} />;
      default:
        return <Package size={20} className={styles.icon} />;
    }
  };

  return (
    <div className={styles.cardContainer}>
      <h3 className={styles.sectionHeading}>PUSH NOTIFICATIONS</h3>

      <div className={styles.optionsList}>
        {DEFAULT_PUSH_OPTIONS.map((option) => {
          const isEnabled = toggleStates[option.id];
          return (
            <div key={option.id} className={styles.optionRow}>
              <div className={styles.leftInfo}>
                <div className={styles.iconContainer}>
                  {renderIcon(option.iconType)}
                </div>
                <div>
                  <h4 className={styles.optionTitle}>{option.title}</h4>
                  <p className={styles.optionSubtitle}>{option.subtitle}</p>
                </div>
              </div>

              {/* Interactive Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={isEnabled}
                className={`${styles.toggleSwitch} ${
                  isEnabled ? styles.toggleActive : ""
                }`}
                onClick={() => handleToggle(option.id)}
                aria-label={`Toggle ${option.title}`}
              >
                <div className={styles.toggleThumb} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};