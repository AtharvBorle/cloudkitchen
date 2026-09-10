"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, CheckCircle2 } from "lucide-react";
import styles from "./ResponsiveDeliverySettings.module.css";

export interface DeliverySettingsData {
  enableDelivery: boolean;
  deliveryRadiusKm: number;
  deliveryFee: string;
  enableFreeDelivery: boolean;
  freeDeliveryMinOrder: string;
  riderCommission: string;
  enableCod: boolean;
}

export interface ResponsiveDeliverySettingsProps {
  initialSettings?: Partial<DeliverySettingsData>;
  onSave?: (settings: DeliverySettingsData) => void;
  onBack?: () => void;
}

const DEFAULT_SETTINGS: DeliverySettingsData = {
  enableDelivery: true,
  deliveryRadiusKm: 5,
  deliveryFee: "₹40",
  enableFreeDelivery: true,
  freeDeliveryMinOrder: "₹500",
  riderCommission: "₹20 per delivery",
  enableCod: true,
};

export const ResponsiveDeliverySettings: React.FC<
  ResponsiveDeliverySettingsProps
> = ({ initialSettings = DEFAULT_SETTINGS, onSave, onBack }) => {
  const router = useRouter();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [enableDelivery, setEnableDelivery] = useState(
    initialSettings.enableDelivery ?? true
  );
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState(
    initialSettings.deliveryRadiusKm ?? 5
  );
  const [deliveryFee, setDeliveryFee] = useState(
    initialSettings.deliveryFee ?? "₹40"
  );
  const [enableFreeDelivery, setEnableFreeDelivery] = useState(
    initialSettings.enableFreeDelivery ?? true
  );
  const [freeDeliveryMinOrder, setFreeDeliveryMinOrder] = useState(
    initialSettings.freeDeliveryMinOrder ?? "₹500"
  );
  const [riderCommission, setRiderCommission] = useState(
    initialSettings.riderCommission ?? "₹20 per delivery"
  );
  const [enableCod, setEnableCod] = useState(initialSettings.enableCod ?? true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleBack = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (onBack) {
      onBack();
    } else {
      router.push("/seller/delivery");
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const data: DeliverySettingsData = {
      enableDelivery,
      deliveryRadiusKm,
      deliveryFee,
      enableFreeDelivery,
      freeDeliveryMinOrder,
      riderCommission,
      enableCod,
    };

    if (onSave) {
      onSave(data);
    } else {
      showToast("Delivery settings saved successfully!");
      setTimeout(() => {
        router.push("/seller/delivery");
      }, 900);
    }
  };

  return (
    <div className={styles.screenWrapper}>
      {/* 420px Mobile View Container */}
      <div className={styles.mobileContainer}>
        {/* Top Header Bar */}
        <header className={styles.topBar}>
          <button
            type="button"
            className={styles.backButton}
            onClick={handleBack}
            aria-label="Back"
            title="Back"
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>

          <h1 className={styles.headerTitle}>Delivery Settings</h1>

          <div className={styles.headerPlaceholder} />
        </header>

        {/* Form Content Area */}
        <form onSubmit={handleSave} className={styles.contentArea}>
          {/* 1. Enable Delivery Card */}
          <div className={`${styles.settingCard} ${styles.cardHeaderRow}`}>
            <span className={styles.settingTitle}>Enable delivery</span>
            <button
              type="button"
              role="switch"
              aria-checked={enableDelivery}
              className={`${styles.toggleSwitch} ${
                enableDelivery ? styles.toggleSwitchActive : ""
              }`}
              onClick={() => setEnableDelivery((prev) => !prev)}
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>

          {/* 2. Delivery Radius Card */}
          <div className={styles.settingCard}>
            <div className={styles.cardHeaderRow}>
              <span className={styles.settingLabelUpper}>DELIVERY RADIUS</span>
              <span className={styles.radiusValue}>{deliveryRadiusKm} km</span>
            </div>
            <input
              type="range"
              min={1}
              max={25}
              value={deliveryRadiusKm}
              onChange={(e) => setDeliveryRadiusKm(Number(e.target.value))}
              className={styles.rangeSlider}
            />
          </div>

          {/* 3. Delivery Fee Card */}
          <div className={styles.settingCard}>
            <span className={styles.settingLabelUpper}>DELIVERY FEE</span>
            <input
              type="text"
              className={styles.textInput}
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(e.target.value)}
              placeholder="₹40"
            />
            <p className={styles.subtitle}>Per order delivery charge</p>
          </div>

          {/* 4. Free Delivery Card */}
          <div className={styles.settingCard}>
            <div className={styles.cardHeaderRow}>
              <span className={styles.settingTitleUpper}>FREE DELIVERY</span>
              <button
                type="button"
                role="switch"
                aria-checked={enableFreeDelivery}
                className={`${styles.toggleSwitch} ${
                  enableFreeDelivery ? styles.toggleSwitchActive : ""
                }`}
                onClick={() => setEnableFreeDelivery((prev) => !prev)}
              >
                <span className={styles.toggleThumb} />
              </button>
            </div>
            <input
              type="text"
              className={styles.textInput}
              value={freeDeliveryMinOrder}
              onChange={(e) => setFreeDeliveryMinOrder(e.target.value)}
              placeholder="₹500"
            />
            <p className={styles.subtitle}>
              Minimum order value for free delivery
            </p>
          </div>

          {/* 5. Rider Commission Card */}
          <div className={styles.settingCard}>
            <span className={styles.settingLabelUpper}>RIDER COMMISSION</span>
            <input
              type="text"
              className={styles.textInput}
              value={riderCommission}
              onChange={(e) => setRiderCommission(e.target.value)}
              placeholder="₹20 per delivery"
            />
            <p className={styles.subtitle}>Rider earns per delivery</p>
          </div>

          {/* 6. COD Settings Card */}
          <div className={styles.settingCard}>
            <div className={styles.cardHeaderRow}>
              <span className={styles.settingTitleUpper}>COD SETTINGS</span>
              <button
                type="button"
                role="switch"
                aria-checked={enableCod}
                className={`${styles.toggleSwitch} ${
                  enableCod ? styles.toggleSwitchActive : ""
                }`}
                onClick={() => setEnableCod((prev) => !prev)}
              >
                <span className={styles.toggleThumb} />
              </button>
            </div>
            <div className={styles.codInfoBox}>
              Riders collect cash and settle with you periodically via the
              Delivery &amp; COD screen.
            </div>
          </div>

          {/* Save Settings Button */}
          <button type="submit" className={styles.saveButton}>
            Save Settings
          </button>
        </form>

        {/* Toast Notification */}
        {toastMessage && (
          <div className={styles.toastNotification}>
            <CheckCircle2 size={18} color="#10B981" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponsiveDeliverySettings;

