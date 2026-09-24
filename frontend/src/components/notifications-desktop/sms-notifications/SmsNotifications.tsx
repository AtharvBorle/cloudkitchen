"use client";

import React, { useState, useEffect } from "react";
import styles from "./SmsNotifications.module.css";
import { Phone, Tag } from "lucide-react";
import {
  getGenericNotificationPreferences,
  saveGenericNotificationPreferences,
  NOTIFICATION_PREFERENCES_EVENT,
} from "@/lib/user-notification-preferences";

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

const INITIAL_SMS_MAP: Record<string, boolean> = {
  "order-status": true,
  "deals-discounts": false,
};

export const SmsNotifications: React.FC = () => {
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>(() => {
    return getGenericNotificationPreferences("sms", INITIAL_SMS_MAP);
  });

  useEffect(() => {
    setToggleStates(getGenericNotificationPreferences("sms", INITIAL_SMS_MAP));

    const handlePrefChange = () => {
      setToggleStates(getGenericNotificationPreferences("sms", INITIAL_SMS_MAP));
    };

    window.addEventListener(NOTIFICATION_PREFERENCES_EVENT, handlePrefChange);
    window.addEventListener("storage", handlePrefChange);

    return () => {
      window.removeEventListener(NOTIFICATION_PREFERENCES_EVENT, handlePrefChange);
      window.removeEventListener("storage", handlePrefChange);
    };
  }, []);

  const handleToggle = (id: string) => {
    setToggleStates((prev) => {
      const nextVal = !prev[id];
      const updated = { ...prev, [id]: nextVal };
      saveGenericNotificationPreferences("sms", { [id]: nextVal });
      return updated;
    });
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