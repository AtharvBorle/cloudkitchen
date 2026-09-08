"use client";

import React, { useState } from "react";
import styles from "./SmsNotifications.module.css";
import { Phone, Tag } from "lucide-react";

export interface SmsOption {
  id: string;
  title: string;
  subtitle: string;
  iconType: "phone" | "tag";
  defaultEnabled: boolean;
}

const DEFAULT_SMS_OPTIONS: SmsOption[] = [
  {
    id: "order-status",
    title: "Order Status",
    subtitle: "OTP confirmation & essential notifications",
    iconType: "phone",
    defaultEnabled: true,
  },
  {
    id: "deals-discounts",
    title: "Deals & Discounts",
    subtitle: "Limited SMS-only special updates",
    iconType: "tag",
    defaultEnabled: false,
  },
];

export const SmsNotifications: React.FC = () => {
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({
    "order-status": true,
    "deals-discounts": false,
  });

  const handleToggle = (id: string) => {
    setToggleStates((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const renderIcon = (type: SmsOption["iconType"]) => {
    switch (type) {
      case "phone":
        return <Phone size={20} className={styles.icon} />;
      case "tag":
        return <Tag size={20} className={styles.icon} />;
      default:
        return <Phone size={20} className={styles.icon} />;
    }
  };

  return (
    <div className={styles.cardContainer}>
      <h3 className={styles.sectionHeading}>SMS NOTIFICATIONS</h3>

      <div className={styles.optionsList}>
        {DEFAULT_SMS_OPTIONS.map((option) => {
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