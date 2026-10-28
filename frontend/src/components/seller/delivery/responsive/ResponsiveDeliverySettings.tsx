"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, CheckCircle2, Bell, Truck } from "lucide-react";
import { fetchApi } from "@/lib/fetch-api";
import { useSellerProfile, updateCachedProfile } from "@/hooks/useSellerProfile";
import styles from "./ResponsiveDeliverySettings.module.css";

export interface DeliverySettingsData {
  deliveryRadiusKm: number;
  deliveryFee: string;
  enableFreeDelivery: boolean;
  freeDeliveryMinOrder: string;
  enableCod?: boolean;
}

export interface ResponsiveDeliverySettingsProps {
  initialSettings?: Partial<DeliverySettingsData>;
  onSave?: (settings: DeliverySettingsData) => void;
  onBack?: () => void;
}

export const ResponsiveDeliverySettings: React.FC<
  ResponsiveDeliverySettingsProps
> = ({ initialSettings, onSave, onBack }) => {
  const router = useRouter();
  const seller = useSellerProfile();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState<number>(() => {
    return initialSettings?.deliveryRadiusKm ?? (seller.deliveryRadiusKm ?? 5);
  });
  const [deliveryFee, setDeliveryFee] = useState<string>(() => {
    const fee = seller.deliveryCharge !== undefined ? seller.deliveryCharge : 50;
    return initialSettings?.deliveryFee ?? `₹${fee}`;
  });
  const [enableFreeDelivery, setEnableFreeDelivery] = useState(
    initialSettings?.enableFreeDelivery ?? seller.enableFreeDelivery ?? false
  );
  const [freeDeliveryMinOrder, setFreeDeliveryMinOrder] = useState(
    initialSettings?.freeDeliveryMinOrder ?? (seller.freeDeliveryThreshold !== undefined ? `₹${seller.freeDeliveryThreshold}` : "₹500")
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("seller_delivery_settings");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.enableFreeDelivery !== undefined && initialSettings?.enableFreeDelivery === undefined) {
            setEnableFreeDelivery(parsed.enableFreeDelivery);
          }
          if (parsed.freeDeliveryMinOrder !== undefined && initialSettings?.freeDeliveryMinOrder === undefined) {
            setFreeDeliveryMinOrder(parsed.freeDeliveryMinOrder);
          }
        }
      } catch {}
    }
    if (seller.deliveryRadiusKm && initialSettings?.deliveryRadiusKm === undefined) {
      setDeliveryRadiusKm(seller.deliveryRadiusKm);
    }
    if (seller.deliveryCharge !== undefined && initialSettings?.deliveryFee === undefined) {
      setDeliveryFee(`₹${seller.deliveryCharge}`);
    }
    if (seller.enableFreeDelivery !== undefined && initialSettings?.enableFreeDelivery === undefined) {
      setEnableFreeDelivery(seller.enableFreeDelivery);
    }
    if (seller.freeDeliveryThreshold !== undefined && initialSettings?.freeDeliveryMinOrder === undefined) {
      setFreeDeliveryMinOrder(`₹${seller.freeDeliveryThreshold}`);
    }
  }, [seller.deliveryRadiusKm, seller.deliveryCharge, seller.enableFreeDelivery, seller.freeDeliveryThreshold, initialSettings]);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const parsedFee = parseFloat(String(deliveryFee).replace(/[^0-9.]/g, "")) || 50;
    const formattedFee = `₹${parsedFee}`;
    const data: DeliverySettingsData = {
      deliveryRadiusKm,
      deliveryFee: formattedFee,
      enableFreeDelivery,
      freeDeliveryMinOrder,
    };

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("seller_delivery_settings", JSON.stringify(data));
        window.dispatchEvent(new CustomEvent("seller-delivery-settings-updated", { detail: data }));
      } catch (e) {
        console.error("Failed to save delivery settings to localStorage:", e);
      }
    }

    try {
      await fetchApi("/api/seller/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryRadiusKm,
          deliveryCharge: parsedFee,
          enableFreeDelivery,
          freeDeliveryThreshold: parseFloat(String(freeDeliveryMinOrder).replace(/[^0-9.]/g, "")) || 500,
        }),
      });
      updateCachedProfile({
        deliveryRadiusKm,
        deliveryCharge: parsedFee,
        enableFreeDelivery,
        freeDeliveryThreshold: parseFloat(String(freeDeliveryMinOrder).replace(/[^0-9.]/g, "")) || 500,
      });
    } catch (err) {
      console.error("Failed to persist delivery radius and fee:", err);
    }

    if (onSave) {
      onSave(data);
    } else {
      showToast("Delivery settings saved successfully!");
      setTimeout(() => {
        router.push("/seller/delivery");
      }, 900);
    }
    setIsSaving(false);
  };

  return (
    <div className={styles.screenWrapper}>
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

          <button
            type="button"
            className={styles.iconButton}
            onClick={() => router.push("/seller/notifications")}
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={20} />
          </button>
        </header>

        {/* Form Content Area */}
        <form onSubmit={handleSave} className={styles.contentArea}>
          {/* 1. Delivery Radius Card */}
          <div className={styles.settingCard}>
            <div className={styles.cardHeaderRow}>
              <span className={styles.settingLabelUpper}>DELIVERY RADIUS</span>
              <span className={styles.radiusValue}>{deliveryRadiusKm} km</span>
            </div>
            <input
              type="range"
              min={1}
              max={15}
              step={1}
              value={deliveryRadiusKm}
              onChange={(e) => setDeliveryRadiusKm(Number(e.target.value))}
              className={styles.rangeSlider}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748B", marginTop: "4px" }}>
              <span>1 km (Hyperlocal)</span>
              <span>15 km</span>
            </div>
          </div>

          {/* 2. Delivery Fee Card */}
          <div className={styles.settingCard}>
            <span className={styles.settingLabelUpper}>DELIVERY FEE</span>
            <input
              type="text"
              className={styles.textInput}
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(e.target.value)}
              placeholder="₹50"
            />
            <p className={styles.subtitle}>Per order delivery charge (Consistent with cart and checkout)</p>
          </div>

          {/* 3. Free Delivery Card */}
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
            {enableFreeDelivery && (
              <>
                <input
                  type="text"
                  className={styles.textInput}
                  value={freeDeliveryMinOrder}
                  onChange={(e) => setFreeDeliveryMinOrder(e.target.value)}
                  placeholder="₹500"
                />
                <p className={styles.subtitle}>
                  Minimum cart value to waive delivery fee
                </p>
              </>
            )}
          </div>

          

          {/* Save Settings Button */}
          <button type="submit" className={styles.saveButton} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Delivery Settings"}
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
