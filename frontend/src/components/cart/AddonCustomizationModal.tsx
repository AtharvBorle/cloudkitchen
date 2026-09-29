"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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
  submitButtonText?: string;
  isEditMode?: boolean;
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
  submitButtonText,
  isEditMode = false,
  onConfirm,
  onAddToCart,
}) => {
  // 1. Resolve dish metadata safely
  const resolvedDishName =
    item?.name || item?.dishName || item?.title || propDishName || "Menu Item";

  const rawBasePrice = item?.basePrice ?? item?.price ?? propBasePrice ?? 0;
  const resolvedBasePrice =
    typeof rawBasePrice === "number"
      ? isNaN(rawBasePrice)
        ? 0
        : Math.max(0, rawBasePrice)
      : parseFloat(String(rawBasePrice).replace(/[^0-9.]/g, "")) || 0;

  const resolvedDescription =
    item?.description || propDescription || "";

  // 2. Parse and normalize available add-ons list with stable keys
  const parsedAddons: AddonItem[] = useMemo(() => {
    const raw = item?.addons ?? propAddons ?? [];
    try {
      const list = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (Array.isArray(list)) {
        return list
          .filter((a: any) => a && (a.name || "").trim())
          .map((a: any) => {
            const cleanName = String(a.name || "").trim();
            const cleanId = a.id ? String(a.id) : `addon_${cleanName.toLowerCase().replace(/\s+/g, "_")}`;
            const cleanPrice =
              typeof a.price === "number"
                ? a.price
                : parseFloat(String(a.price).replace(/[^0-9.]/g, "")) || 0;
            return {
              id: cleanId,
              name: cleanName,
              price: Math.max(0, cleanPrice),
            };
          });
      }
    } catch (err) {
      console.error("Failed to parse addons in AddonCustomizationModal:", err);
    }
    return [];
  }, [item?.addons, propAddons]);

  // Helper to compute initially selected IDs matched by ID or name
  const computeInitialIds = React.useCallback(
    (initial: any[] | undefined, available: AddonItem[]): string[] => {
      if (!initial || !Array.isArray(initial) || initial.length === 0) return [];
      const initialKeys = initial
        .map((a: any) => {
          if (typeof a === "object" && a !== null) {
            return {
              id: a.id ? String(a.id).toLowerCase() : null,
              name: a.name ? String(a.name).toLowerCase().trim() : null,
            };
          }
          return {
            id: String(a).toLowerCase(),
            name: String(a).toLowerCase().trim(),
          };
        })
        .filter((k) => k.id || k.name);

      return available
        .filter((pa) => {
          const paId = String(pa.id).toLowerCase();
          const paName = String(pa.name).toLowerCase().trim();
          return initialKeys.some(
            (k) =>
              (k.id && (k.id === paId || k.id === paName)) ||
              (k.name && (k.name === paName || k.name === paId))
          );
        })
        .map((pa) => String(pa.id));
    },
    []
  );

  // 3. Track selected add-on IDs
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const isOpenRef = useRef(false);
  const activeItemKeyRef = useRef<string | undefined>(undefined);

  // Synchronize initial selections ONLY when the modal transitions from closed to open or item switches
  useEffect(() => {
    const currentItemKey = item?.id || resolvedDishName;
    const isJustOpening = isOpen && !isOpenRef.current;
    const isItemSwitched = isOpen && activeItemKeyRef.current !== currentItemKey;

    if (isJustOpening || isItemSwitched) {
      setSelectedAddonIds(computeInitialIds(initialSelectedAddons, parsedAddons));
      activeItemKeyRef.current = currentItemKey;
    }

    isOpenRef.current = isOpen;
    if (!isOpen) {
      activeItemKeyRef.current = undefined;
    }
  }, [isOpen, item?.id, resolvedDishName, initialSelectedAddons, parsedAddons, computeInitialIds]);

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
  const buttonLabel = submitButtonText || (isEditMode ? "Update Item" : "Add Item");

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
            <span>{buttonLabel} • ₹{totalUnitPrice}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddonCustomizationModal;
