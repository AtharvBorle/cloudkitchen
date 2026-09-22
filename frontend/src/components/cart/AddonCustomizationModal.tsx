"use client";

import React, { useState, useEffect } from "react";
import { X, Check, ShoppingBag } from "lucide-react";
import styles from "./AddonCustomizationModal.module.css";
import { AddonItem } from "@/context/CartContext";

export interface ModalItem {
  id?: string;
  name?: string;
  dishName?: string;
  title?: string;
  price?: number | string;
  basePrice?: number | string;
  description?: string;
  imageUrl?: string;
  image?: any;
  itemType?: string;
  isVeg?: boolean;
  addons?: any[];
}

export interface AddonCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: ModalItem;
  dishName?: string;
  basePrice?: number | string;
  description?: string;
  imageUrl?: string;
  itemType?: string;
  addons?: any[];
  initialSelectedAddons?: any[];
  onConfirm?: (selectedAddons: AddonItem[], totalUnitPrice: number) => void;
  onAddToCart?: (selectedAddons: AddonItem[], quantity?: number) => void;
}

export const AddonCustomizationModal: React.FC<AddonCustomizationModalProps> = ({
  isOpen,
  onClose,
  item,
  dishName: propDishName,
  basePrice: propBasePrice,
  description: propDescription,
  imageUrl: propImageUrl,
  itemType: propItemType,
  addons: propAddons,
  initialSelectedAddons,
  onConfirm,
  onAddToCart,
}) => {
  // 1. Resolve dish metadata safely
  const resolvedDishName =
    item?.name || item?.dishName || item?.title || propDishName || "Menu Item";

  const rawBasePrice = item?.price ?? item?.basePrice ?? propBasePrice ?? 0;
  const resolvedBasePrice =
    typeof rawBasePrice === "number"
      ? isNaN(rawBasePrice)
        ? 0
        : Math.max(0, rawBasePrice)
      : parseFloat(String(rawBasePrice).replace(/[^0-9.]/g, "")) || 0;

  const resolvedDescription =
    item?.description || propDescription || "";

  // 2. Parse and normalize available add-ons list
  const rawAddons = item?.addons ?? propAddons ?? [];
  let parsedAddons: AddonItem[] = [];
  try {
    const list = typeof rawAddons === "string" ? JSON.parse(rawAddons) : rawAddons;
    if (Array.isArray(list)) {
      parsedAddons = list
        .filter((a: any) => a && (a.name || "").trim())
        .map((a: any, idx: number) => ({
          id: String(a.id || `addon_${idx + 1}`),
          name: String(a.name || "").trim(),
          price: Math.max(0, parseFloat(String(a.price).replace(/[^0-9.]/g, "")) || 0),
        }));
    }
  } catch (err) {
    console.error("Failed to parse addons in AddonCustomizationModal:", err);
  }

  // 3. Track selected add-on IDs
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>(() => {
    if (initialSelectedAddons && Array.isArray(initialSelectedAddons)) {
      return initialSelectedAddons
        .map((a: any) => (typeof a === "object" && a !== null ? String(a.id || "") : String(a)))
        .filter(Boolean);
    }
    return [];
  });

  // Re-sync when modal opens or item/initialSelectedAddons change
  useEffect(() => {
    if (isOpen) {
      if (initialSelectedAddons && Array.isArray(initialSelectedAddons)) {
        setSelectedAddonIds(
          initialSelectedAddons
            .map((a: any) => (typeof a === "object" && a !== null ? String(a.id || "") : String(a)))
            .filter(Boolean)
        );
      } else {
        setSelectedAddonIds([]);
      }
    }
  }, [isOpen, initialSelectedAddons, item?.id, resolvedDishName]);

  if (!isOpen) return null;

  const toggleAddon = (addonId: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(addonId)
        ? prev.filter((id) => id !== addonId)
        : [...prev, addonId]
    );
  };

  const selectedAddonsList = parsedAddons.filter((a) =>
    selectedAddonIds.includes(String(a.id))
  );

  const addonsTotal = selectedAddonsList.reduce(
    (sum, a) => sum + (Number(a.price) || 0),
    0
  );

  const totalUnitPrice = resolvedBasePrice + addonsTotal;

  const handleAdd = () => {
    if (onConfirm) {
      onConfirm(selectedAddonsList, totalUnitPrice);
    }
    if (onAddToCart) {
      onAddToCart(selectedAddonsList, 1);
    }
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.titleRow}>
              <h2 className={styles.dishName}>{resolvedDishName}</h2>
            </div>
            <span className={styles.basePrice}>Base: ₹{resolvedBasePrice}</span>
            {resolvedDescription && (
              <p className={styles.dishDesc}>{resolvedDescription}</p>
            )}
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content / Addons List */}
        <div className={styles.content}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Choose Add-ons</h3>
            <span className={styles.sectionSubtitle}>
              {selectedAddonIds.length > 0
                ? `${selectedAddonIds.length} selected`
                : "Optional extras"}
            </span>
          </div>

          {parsedAddons.length === 0 ? (
            <div style={{ padding: "16px 0", textAlign: "center", color: "#64748B", fontSize: "0.9rem" }}>
              No extra add-ons available for this item.
            </div>
          ) : (
            <div className={styles.addonsList}>
              {parsedAddons.map((addon) => {
                const addonId = String(addon.id);
                const isSelected = selectedAddonIds.includes(addonId);

                return (
                  <div
                    key={addonId}
                    className={`${styles.addonCard} ${
                      isSelected ? styles.addonCardSelected : ""
                    }`}
                    onClick={() => toggleAddon(addonId)}
                  >
                    <div className={styles.addonLeft}>
                      <div className={styles.checkbox}>
                        {isSelected && <Check size={13} strokeWidth={3} />}
                      </div>
                      <span className={styles.addonName}>{addon.name}</span>
                    </div>
                    <span className={styles.addonPrice}>+₹{addon.price}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={styles.footer}>
          <div className={styles.totalStack}>
            <span className={styles.totalLabel}>Total Price</span>
            <span className={styles.totalPrice}>₹{totalUnitPrice}</span>
          </div>

          <button
            type="button"
            className={styles.submitBtn}
            onClick={handleAdd}
          >
            <ShoppingBag size={18} />
            <span>Add Item • ₹{totalUnitPrice}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddonCustomizationModal;
