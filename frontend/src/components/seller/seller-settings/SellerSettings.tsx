"use client";

import React, { useState } from "react";
import SellerSidebar from "../sidebar/Sidebar";
import Topbar from "../nav/Topbar";
import {
  Store,
  Truck,
  Bell,
  Shield,
  Clock,
  CheckCircle2,
  Loader2,
  Save,
} from "lucide-react";
import styles from "./SellerSettings.module.css";

export interface SellerSettingsData {
  storeOnline: boolean;
  autoAcceptOrders: boolean;
  soundAlerts: boolean;
  prepTimeMinutes: number;
  autoConfirmBookings: boolean;
  enableInHouseDelivery: boolean;
  deliveryRadiusKm: number;
  freeDeliveryThreshold: string;
  allowCod: boolean;
  smsAlerts: boolean;
  whatsappUpdates: boolean;
  dailyEmailSummary: boolean;
  requirePinForRefund: boolean;
  twoFactorAuth: boolean;
}

const DEFAULT_SETTINGS: SellerSettingsData = {
  storeOnline: true,
  autoAcceptOrders: false,
  soundAlerts: true,
  prepTimeMinutes: 25,
  autoConfirmBookings: true,
  enableInHouseDelivery: true,
  deliveryRadiusKm: 8,
  freeDeliveryThreshold: "₹499",
  allowCod: true,
  smsAlerts: true,
  whatsappUpdates: true,
  dailyEmailSummary: true,
  requirePinForRefund: true,
  twoFactorAuth: false,
};

import { useSellerProfile, toggleSellerOnlineStatus } from "@/hooks/useSellerProfile";

export interface SellerSettingsProps {
  initialSettings?: Partial<SellerSettingsData>;
  onSave?: (settings: SellerSettingsData) => void;
}

export const SellerSettings: React.FC<SellerSettingsProps> = ({
  initialSettings,
  onSave,
}) => {
  const seller = useSellerProfile();
  const [settings, setSettings] = useState<SellerSettingsData>({
    ...DEFAULT_SETTINGS,
    ...initialSettings,
  });

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (typeof seller.isOnline === "boolean") {
      setSettings((prev) => ({ ...prev, storeOnline: seller.isOnline }));
    }
  }, [seller.isOnline]);

  const handleToggle = (key: keyof SellerSettingsData) => {
    const newVal = !settings[key];
    setSettings((prev) => ({ ...prev, [key]: newVal }));
    if (key === "storeOnline") {
      toggleSellerOnlineStatus(newVal);
    }
  };

  const handleNumberChange = (key: keyof SellerSettingsData, val: number) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleTextChange = (key: keyof SellerSettingsData, val: string) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await toggleSellerOnlineStatus(settings.storeOnline);
      if (onSave) onSave(settings);
      setSuccessMessage("Settings updated successfully!");
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err) {
      console.error("Error saving settings:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* 1. Left Desktop Sidebar */}
      <SellerSidebar
        activeItemId="settings"
        ownerName={seller.ownerName}
        partnerRole={seller.partnerRole}
        avatarInitials={seller.avatarInitials}
      />

      {/* 2. Main Content Area */}
      <div className={styles.contentWrapper}>
        <Topbar
          title="Seller Settings"
          ownerName={seller.ownerName}
          partnerRole={seller.partnerRole}
          avatarInitials={seller.avatarInitials}
        />

        <main className={styles.mainCanvas}>
          {/* Header Title */}
          <div className={styles.headerSection}>
            <h1 className={styles.pageTitle}>Operations &amp; Store Settings</h1>
            <p className={styles.pageDescription}>
              Manage your kitchen dispatch rules, order handling preferences, delivery radii, and security controls.
            </p>
          </div>

          {/* Success Alert Banner */}
          {successMessage && (
            <div className={styles.successAlert}>
              <CheckCircle2 size={18} />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* 1. Kitchen & Store Operations */}
            <div className={styles.settingsCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIconWrapper}>
                  <Store size={20} />
                </div>
                <div>
                  <h2 className={styles.cardTitle}>Kitchen &amp; Order Handling</h2>
                  <p className={styles.cardDescription}>
                    Configure incoming orders and online availability
                  </p>
                </div>
              </div>

              <div className={styles.settingsGrid}>
                {/* Store Live Status */}
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <p className={styles.settingLabel}>Store Online / Live</p>
                    <p className={styles.settingSubtext}>
                      {settings.storeOnline ? "Currently accepting online orders" : "Store is marked offline"}
                    </p>
                  </div>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={settings.storeOnline}
                      onChange={() => handleToggle("storeOnline")}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                {/* Auto-accept Orders */}
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <p className={styles.settingLabel}>Auto-Accept New Orders</p>
                    <p className={styles.settingSubtext}>
                      Automatically send paid orders to kitchen prep queue
                    </p>
                  </div>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={settings.autoAcceptOrders}
                      onChange={() => handleToggle("autoAcceptOrders")}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                {/* Sound Alerts */}
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <p className={styles.settingLabel}>Sound Notification Chimes</p>
                    <p className={styles.settingSubtext}>
                      Play loud chime when a new delivery or dining order arrives
                    </p>
                  </div>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={settings.soundAlerts}
                      onChange={() => handleToggle("soundAlerts")}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                {/* Auto Confirm Bookings */}
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <p className={styles.settingLabel}>Auto-Confirm Room Bookings</p>
                    <p className={styles.settingSubtext}>
                      Instantly approve reservation requests with valid payments
                    </p>
                  </div>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={settings.autoConfirmBookings}
                      onChange={() => handleToggle("autoConfirmBookings")}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                {/* Kitchen Prep Time Selection */}
                <div className={styles.settingItem} style={{ gridColumn: "1 / -1" }}>
                  <div className={styles.settingInfo}>
                    <p className={styles.settingLabel}>Default Estimated Prep Time</p>
                    <p className={styles.settingSubtext}>
                      Shown to customers as average order preparation window
                    </p>
                  </div>
                  <div className={styles.prepTimeGroup}>
                    {[15, 25, 35, 45].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        className={`${styles.prepTimeBtn} ${
                          settings.prepTimeMinutes === mins ? styles.active : ""
                        }`}
                        onClick={() => handleValueChange("prepTimeMinutes", mins)}
                      >
                        {mins} Mins
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Delivery & Fulfillment */}
            <div className={styles.settingsCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIconWrapper}>
                  <Truck size={20} />
                </div>
                <div>
                  <h2 className={styles.cardTitle}>Delivery &amp; Logistics</h2>
                  <p className={styles.cardDescription}>
                    Set dispatch radius, threshold charges, and rider payment terms
                  </p>
                </div>
              </div>

              <div className={styles.settingsGrid}>
                {/* In-House Delivery */}
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <p className={styles.settingLabel}>In-House Fleet Delivery</p>
                    <p className={styles.settingSubtext}>
                      Assign orders directly to registered delivery agents
                    </p>
                  </div>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={settings.enableInHouseDelivery}
                      onChange={() => handleToggle("enableInHouseDelivery")}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                {/* Cash On Delivery */}
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <p className={styles.settingLabel}>Cash On Delivery (COD)</p>
                    <p className={styles.settingSubtext}>
                      Permit riders to collect cash payments on doorstep
                    </p>
                  </div>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={settings.allowCod}
                      onChange={() => handleToggle("allowCod")}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                {/* Delivery Radius */}
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <p className={styles.settingLabel}>Maximum Delivery Radius</p>
                    <p className={styles.settingSubtext}>Orders beyond this radius will be restricted</p>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={settings.deliveryRadiusKm}
                    onChange={(e) => handleValueChange("deliveryRadiusKm", Number(e.target.value))}
                    className={styles.inputField}
                  />
                </div>

                {/* Free Delivery Threshold */}
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <p className={styles.settingLabel}>Free Delivery Minimum Cart</p>
                    <p className={styles.settingSubtext}>Minimum order total to waive delivery fee</p>
                  </div>
                  <input
                    type="text"
                    value={settings.freeDeliveryThreshold}
                    onChange={(e) => handleValueChange("freeDeliveryThreshold", e.target.value)}
                    className={styles.inputField}
                  />
                </div>
              </div>
            </div>

            {/* 3. Notifications & Security */}
            <div className={styles.settingsCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIconWrapper}>
                  <Shield size={20} />
                </div>
                <div>
                  <h2 className={styles.cardTitle}>Notifications &amp; Security</h2>
                  <p className={styles.cardDescription}>
                    Manage alert channels, SMS dispatch, and staff security PIN requirements
                  </p>
                </div>
              </div>

              <div className={styles.settingsGrid}>
                {/* SMS Alerts */}
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <p className={styles.settingLabel}>SMS Dispatch Alerts</p>
                    <p className={styles.settingSubtext}>Send text updates for high-value orders</p>
                  </div>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={settings.smsAlerts}
                      onChange={() => handleToggle("smsAlerts")}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                {/* WhatsApp Updates */}
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <p className={styles.settingLabel}>WhatsApp Customer Updates</p>
                    <p className={styles.settingSubtext}>Live delivery tracking link via WhatsApp</p>
                  </div>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={settings.whatsappUpdates}
                      onChange={() => handleToggle("whatsappUpdates")}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                {/* Daily Digest */}
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <p className={styles.settingLabel}>Daily Email Digest</p>
                    <p className={styles.settingSubtext}>Receive nightly settlement &amp; order metrics report</p>
                  </div>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={settings.dailyEmailSummary}
                      onChange={() => handleToggle("dailyEmailSummary")}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                {/* PIN for Refund */}
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <p className={styles.settingLabel}>Manager PIN for Cancellations</p>
                    <p className={styles.settingSubtext}>Require manager PIN to void or cancel active orders</p>
                  </div>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={settings.requirePinForRefund}
                      onChange={() => handleToggle("requirePinForRefund")}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className={styles.saveBar}>
              <button type="submit" disabled={saving} className={styles.saveBtn}>
                {saving ? (
                  <Loader2 size={18} className={styles.spinner} />
                ) : (
                  <Save size={18} />
                )}
                <span>{saving ? "Saving Changes..." : "Save Settings"}</span>
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default SellerSettings;
