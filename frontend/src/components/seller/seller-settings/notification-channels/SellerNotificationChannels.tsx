"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import styles from "./SellerNotificationChannels.module.css";

export interface NotificationChannelsData {
  emailNotifications: boolean;
  smsAlerts: boolean;
  pushNotifications: boolean;
  whatsappUpdates: boolean;
  enableQuietHours: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export const DEFAULT_NOTIFICATION_CHANNELS: NotificationChannelsData = {
  emailNotifications: true,
  smsAlerts: true,
  pushNotifications: true,
  whatsappUpdates: false,
  enableQuietHours: true,
  quietHoursStart: "10:00 PM",
  quietHoursEnd: "07:00 AM",
};

export const TIME_SLOT_OPTIONS = [
  "12:00 AM", "01:00 AM", "02:00 AM", "03:00 AM", "04:00 AM", "05:00 AM",
  "06:00 AM", "07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM",
  "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM", "10:00 PM", "11:00 PM",
];

export interface SellerNotificationChannelsProps {
  data?: Partial<NotificationChannelsData>;
  onChange?: (field: keyof NotificationChannelsData, value: boolean | string) => void;
  onToggle?: (field: keyof NotificationChannelsData) => void;
  className?: string;
}

export const SellerNotificationChannels: React.FC<SellerNotificationChannelsProps> = ({
  data,
  onChange,
  onToggle,
  className = "",
}) => {
  const [internalState, setInternalState] = useState<NotificationChannelsData>({
    ...DEFAULT_NOTIFICATION_CHANNELS,
    ...data,
  });

  const currentValues: NotificationChannelsData = {
    ...DEFAULT_NOTIFICATION_CHANNELS,
    ...internalState,
    ...data,
  };

  const handleToggle = (field: keyof NotificationChannelsData) => {
    const newValue = !currentValues[field];
    setInternalState((prev) => ({
      ...prev,
      [field]: newValue,
    }));
    if (onToggle) {
      onToggle(field);
    }
    if (onChange) {
      onChange(field, newValue);
    }
  };

  const handleTimeChange = (
    field: "quietHoursStart" | "quietHoursEnd",
    value: string
  ) => {
    setInternalState((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (onChange) {
      onChange(field, value);
    }
  };

  return (
    <div className={`${styles.container} ${className}`}>
      {/* 1. Notification Channels Card */}
      <section className={styles.card} aria-labelledby="notification-channels-heading">
        <div className={styles.cardHeader}>
          <h2 id="notification-channels-heading" className={styles.cardTitle}>
            Notification Channels
          </h2>
        </div>

        <div className={styles.itemsList}>
          {/* Email Notifications */}
          <div className={styles.itemRow}>
            <div className={styles.itemInfo}>
              <h3 className={styles.itemTitle}>Email Notifications</h3>
              <p className={styles.itemSubtitle}>
                Receive order summaries, invoices, and legal updates.
              </p>
            </div>
            <div className={styles.switchWrapper}>
              <label className={styles.toggleSwitch} aria-label="Toggle Email Notifications">
                <input
                  type="checkbox"
                  role="switch"
                  aria-checked={currentValues.emailNotifications}
                  checked={currentValues.emailNotifications}
                  onChange={() => handleToggle("emailNotifications")}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>
          </div>

          {/* SMS Alerts */}
          <div className={styles.itemRow}>
            <div className={styles.itemInfo}>
              <h3 className={styles.itemTitle}>SMS Alerts</h3>
              <p className={styles.itemSubtitle}>
                Get critical alerts on your mobile for real-time order issues.
              </p>
            </div>
            <div className={styles.switchWrapper}>
              <label className={styles.toggleSwitch} aria-label="Toggle SMS Alerts">
                <input
                  type="checkbox"
                  role="switch"
                  aria-checked={currentValues.smsAlerts}
                  checked={currentValues.smsAlerts}
                  onChange={() => handleToggle("smsAlerts")}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>
          </div>

          {/* Push Notifications */}
          <div className={styles.itemRow}>
            <div className={styles.itemInfo}>
              <h3 className={styles.itemTitle}>Push Notifications</h3>
              <p className={styles.itemSubtitle}>
                Get instant desktop browser popups for incoming orders.
              </p>
            </div>
            <div className={styles.switchWrapper}>
              <label className={styles.toggleSwitch} aria-label="Toggle Push Notifications">
                <input
                  type="checkbox"
                  role="switch"
                  aria-checked={currentValues.pushNotifications}
                  checked={currentValues.pushNotifications}
                  onChange={() => handleToggle("pushNotifications")}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>
          </div>

          {/* WhatsApp Updates */}
          <div className={styles.itemRow}>
            <div className={styles.itemInfo}>
              <h3 className={styles.itemTitle}>WhatsApp Updates</h3>
              <p className={styles.itemSubtitle}>
                Get weekly sales metrics and booking digests directly on WhatsApp.
              </p>
            </div>
            <div className={styles.switchWrapper}>
              <label className={styles.toggleSwitch} aria-label="Toggle WhatsApp Updates">
                <input
                  type="checkbox"
                  role="switch"
                  aria-checked={currentValues.whatsappUpdates}
                  checked={currentValues.whatsappUpdates}
                  onChange={() => handleToggle("whatsappUpdates")}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Quiet Hours & Do Not Disturb Card */}
      <section className={styles.card} aria-labelledby="quiet-hours-heading">
        <div className={styles.cardHeader}>
          <h2 id="quiet-hours-heading" className={styles.cardTitle}>
            Quiet Hours &amp; Do Not Disturb
          </h2>
        </div>

        {/* Enable Quiet Hours Row */}
        <div className={styles.quietHoursRow}>
          <div className={styles.itemInfo}>
            <h3 className={styles.itemTitle}>Enable Quiet Hours</h3>
            <p className={styles.itemSubtitle}>
              Silence all marketing and automated report alerts during specific times.
            </p>
          </div>
          <div className={styles.switchWrapper}>
            <label className={styles.toggleSwitch} aria-label="Toggle Enable Quiet Hours">
              <input
                type="checkbox"
                role="switch"
                aria-checked={currentValues.enableQuietHours}
                checked={currentValues.enableQuietHours}
                onChange={() => handleToggle("enableQuietHours")}
              />
              <span className={styles.toggleSlider} />
            </label>
          </div>
        </div>

        {/* Start Time & End Time Inputs */}
        <div className={styles.timeGrid}>
          {/* Start Time */}
          <div className={styles.timeField}>
            <label htmlFor="quiet-hours-start" className={styles.timeLabel}>
              Start Time
            </label>
            <div className={styles.timeInputWrapper}>
              <select
                id="quiet-hours-start"
                className={styles.timeSelect}
                value={currentValues.quietHoursStart}
                disabled={!currentValues.enableQuietHours}
                onChange={(e) => handleTimeChange("quietHoursStart", e.target.value)}
              >
                {TIME_SLOT_OPTIONS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
              <ChevronDown size={18} className={styles.selectChevron} />
            </div>
          </div>

          {/* End Time */}
          <div className={styles.timeField}>
            <label htmlFor="quiet-hours-end" className={styles.timeLabel}>
              End Time
            </label>
            <div className={styles.timeInputWrapper}>
              <select
                id="quiet-hours-end"
                className={styles.timeSelect}
                value={currentValues.quietHoursEnd}
                disabled={!currentValues.enableQuietHours}
                onChange={(e) => handleTimeChange("quietHoursEnd", e.target.value)}
              >
                {TIME_SLOT_OPTIONS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
              <ChevronDown size={18} className={styles.selectChevron} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SellerNotificationChannels;
