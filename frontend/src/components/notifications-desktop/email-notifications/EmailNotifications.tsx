"use client";

import React, { useState, useEffect } from "react";
import styles from "./EmailNotifications.module.css";
import { Mail, FileText } from "lucide-react";
import {
  getGenericNotificationPreferences,
  saveGenericNotificationPreferences,
  NOTIFICATION_PREFERENCES_EVENT,
} from "@/lib/user-notification-preferences";

export interface EmailOption {
  id: string;
  title: string;
  subtitle: string;
  iconType: "mail" | "file";
  defaultEnabled: boolean;
}

const DEFAULT_EMAIL_OPTIONS: EmailOption[] = [
  {
    id: "weekly-newsletter",
    title: "Weekly Newsletter",
    subtitle: "Digest of recommended meal plans & healthy recipes",
    iconType: "mail",
    defaultEnabled: true,
  },
  {
    id: "order-confirmations",
    title: "Order Confirmations",
    subtitle: "Digital receipts, invoices & plan receipts",
    iconType: "file",
    defaultEnabled: true,
  },
];

const INITIAL_EMAIL_MAP: Record<string, boolean> = {
  "weekly-newsletter": true,
  "order-confirmations": true,
};

export const EmailNotifications: React.FC = () => {
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>(() => {
    return getGenericNotificationPreferences("email", INITIAL_EMAIL_MAP);
  });

  useEffect(() => {
    setToggleStates(getGenericNotificationPreferences("email", INITIAL_EMAIL_MAP));

    const handlePrefChange = () => {
      setToggleStates(getGenericNotificationPreferences("email", INITIAL_EMAIL_MAP));
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
      saveGenericNotificationPreferences("email", { [id]: nextVal });
      return updated;
    });
  };

  const renderIcon = (type: EmailOption["iconType"]) => {
    switch (type) {
      case "mail":
        return <Mail size={20} className={styles.icon} />;
      case "file":
        return <FileText size={20} className={styles.icon} />;
      default:
        return <Mail size={20} className={styles.icon} />;
    }
  };

  return (
    <div className={styles.cardContainer}>
      <h3 className={styles.sectionHeading}>EMAIL NOTIFICATIONS</h3>

      <div className={styles.optionsList}>
        {DEFAULT_EMAIL_OPTIONS.map((option) => {
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