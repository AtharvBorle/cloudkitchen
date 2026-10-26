"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { X, Plus, Minus, ShoppingBag, Package } from "lucide-react";
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

export interface ModalAddonItem extends AddonItem {
  description?: string;
  imageUrl?: string;
  stockQuantity?: number;
  lowStockThreshold?: number;
  isActive?: boolean;
  quantity?: number;
  lineTotal?: number;
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
  onConfirm?: (selectedAddons: ModalAddonItem[], totalUnitPrice: number) => void;
  onAddToCart?: (selectedAddons: ModalAddonItem[], quantity?: number) => void;
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

  const resolvedDescription = item?.description || propDescription || "";

  // 2. Parse and normalize available add-ons list
  const parsedAddons: ModalAddonItem[] = useMemo(() => {
    const raw = item?.addons ?? propAddons ?? [];
    try {
      const list = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (Array.isArray(list)) {
        const seenNames = new Set<string>();
        const result: ModalAddonItem[] = [];
        list.forEach((a: any, idx: number) => {
          if (!a || !(a.name || "").trim()) return;
          const cleanName = String(a.name || "").trim();
          const lowerName = cleanName.toLowerCase();
          if (seenNames.has(lowerName)) return;
          seenNames.add(lowerName);

          const cleanId = a.id ? String(a.id) : `addon_${idx + 1}_${lowerName.replace(/\s+/g, "_")}`;
          const cleanPrice =
            typeof a.price === "number"
              ? a.price
              : parseFloat(String(a.price).replace(/[^0-9.]/g, "")) || 0;

          const stockQuantity =
            a.stockQuantity !== undefined && a.stockQuantity !== null
              ? parseInt(String(a.stockQuantity), 10)
              : undefined;

          const isActive = a.isActive !== undefined ? Boolean(a.isActive) : true;

          result.push({
            id: cleanId,
            name: cleanName,
            price: Math.max(0, cleanPrice),
            description: a.description || "",
            imageUrl: a.imageUrl || a.image || undefined,
            stockQuantity: !isNaN(Number(stockQuantity)) ? Number(stockQuantity) : 99,
            lowStockThreshold: a.lowStockThreshold || 5,
            isActive: isActive,
          });
        });
        return result;
      }
    } catch (err) {
      console.error("Failed to parse addons in AddonCustomizationModal:", err);
    }
    return [];
  }, [item?.addons, propAddons]);

  // 3. Track selected quantity per add-on ID
  const [addonQuantities, setAddonQuantities] = useState<Record<string, number>>({});
  const isOpenRef = useRef(false);
  const activeItemKeyRef = useRef<string | undefined>(undefined);

  // Initialize quantities when modal opens
  useEffect(() => {
    const currentItemKey = item?.id || resolvedDishName;
    const isJustOpening = isOpen && !isOpenRef.current;
    const isItemSwitched = isOpen && activeItemKeyRef.current !== currentItemKey;

    if (isJustOpening || isItemSwitched) {
      const initialMap: Record<string, number> = {};
      if (Array.isArray(initialSelectedAddons) && initialSelectedAddons.length > 0) {
        for (const init of initialSelectedAddons) {
          if (!init) continue;
          const initId = typeof init === "object" ? String(init.id || "").toLowerCase() : String(init).toLowerCase();
          const initName = typeof init === "object" ? String(init.name || "").toLowerCase().trim() : "";
          const qty = typeof init === "object" ? Math.max(1, Number(init.quantity) || 1) : 1;

          const matched = parsedAddons.find(
            (pa) => String(pa.id).toLowerCase() === initId || (initName && pa.name.toLowerCase().trim() === initName)
          );
          if (matched && matched.id) {
            initialMap[matched.id] = qty;
          }
        }
      }
      setAddonQuantities(initialMap);
      activeItemKeyRef.current = currentItemKey;
    }

    isOpenRef.current = isOpen;
    if (!isOpen) {
      activeItemKeyRef.current = undefined;
    }
  }, [isOpen, item?.id, resolvedDishName, initialSelectedAddons, parsedAddons]);

  // Lock background scrolling while modal is open
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Quantity Change Handler
  const handleQuantityChange = (addonId: string, delta: number, maxStock: number = 99) => {
    setAddonQuantities((prev) => {
      const current = prev[addonId] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[addonId];
        return copy;
      }
      const capped = Math.min(next, maxStock);
      return { ...prev, [addonId]: capped };
    });
  };

  // Compute selected add-ons list with quantities and line totals
  const selectedAddonsList: ModalAddonItem[] = parsedAddons
    .filter((a) => a.id && (addonQuantities[a.id] || 0) > 0)
    .map((a) => {
      const qty = addonQuantities[a.id!] || 1;
      return {
        ...a,
        quantity: qty,
        lineTotal: a.price * qty,
      };
    });

  const addonsSubtotal = selectedAddonsList.reduce(
    (sum, a) => sum + (Number(a.lineTotal) || 0),
    0
  );

  const totalUnitPrice = resolvedBasePrice + addonsSubtotal;
  const totalSelectedCount = selectedAddonsList.reduce((sum, a) => sum + (a.quantity || 1), 0);

  const buttonLabel =
    submitButtonText ||
    (isEditMode || Boolean(onConfirm) ? "Update Add-ons" : "Add Item");

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
    <div
      className={styles.overlay}
      onClick={onClose}
      style={{ zIndex: 99999999 }}
    >
      <div
        className={styles.modalCard}
        onClick={(e) => e.stopPropagation()}
        style={{ zIndex: 100000000 }}
      >
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
              {totalSelectedCount > 0
                ? `${totalSelectedCount} items selected (+₹${addonsSubtotal})`
                : "Quantity selectors with live totals"}
            </span>
          </div>

          {parsedAddons.length === 0 ? (
            <div style={{ padding: "28px 0", textAlign: "center", color: "#64748B", fontSize: "0.9rem" }}>
              <Package size={28} color="#94A3B8" style={{ margin: "0 auto 8px" }} />
              <p style={{ margin: 0, fontWeight: 600 }}>No add-ons available for this item</p>
            </div>
          ) : (
            <div className={styles.addonsList}>
              {parsedAddons.map((addon) => {
                const addonId = String(addon.id);
                const currentQty = addonQuantities[addonId] || 0;
                const isSelected = currentQty > 0;
                const stock = addon.stockQuantity !== undefined ? addon.stockQuantity : 99;
                const isOutOfStock = addon.isActive === false || stock <= 0;
                const isLowStock = !isOutOfStock && stock <= (addon.lowStockThreshold || 5);
                const canIncrease = !isOutOfStock && currentQty < stock;
                const lineTotal = addon.price * currentQty;

                return (
                  <div
                    key={addonId}
                    className={`${styles.addonCard} ${
                      isSelected ? styles.addonCardSelected : ""
                    } ${isOutOfStock ? styles.addonCardDisabled : ""}`}
                  >
                    {/* Left: Thumbnail & Name & Unit Price */}
                    <div className={styles.addonLeft}>
                      {addon.imageUrl ? (
                        <img
                          src={addon.imageUrl}
                          alt={addon.name}
                          className={styles.addonImg}
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : null}

                      <div className={styles.addonInfo}>
                        <span className={styles.addonName}>{addon.name}</span>
                        <div className={styles.addonPriceMeta}>
                          <span className={styles.addonUnitPrice}>₹{addon.price}</span>
                          {isOutOfStock ? (
                            <span className={`${styles.stockBadge} ${styles.stockBadgeOut}`}>
                              Out of stock
                            </span>
                          ) : isLowStock ? (
                            <span className={`${styles.stockBadge} ${styles.stockBadgeLow}`}>
                              Only {stock} left
                            </span>
                          ) : (
                            <span className={`${styles.stockBadge} ${styles.stockBadgeIn}`}>
                              In Stock
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Quantity Stepper & Line Total */}
                    <div className={styles.addonRight}>
                      <div className={styles.qtyStepper}>
                        <button
                          type="button"
                          className={styles.stepperBtn}
                          disabled={currentQty <= 0}
                          onClick={() => handleQuantityChange(addonId, -1, stock)}
                          aria-label={`Decrease ${addon.name}`}
                        >
                          <Minus size={14} strokeWidth={2.8} />
                        </button>

                        <span className={styles.qtyValue}>{currentQty}</span>

                        <button
                          type="button"
                          className={styles.stepperBtn}
                          disabled={!canIncrease}
                          onClick={() => handleQuantityChange(addonId, 1, stock)}
                          aria-label={`Increase ${addon.name}`}
                          title={!canIncrease && !isOutOfStock ? `Max available units reached (${stock})` : undefined}
                        >
                          <Plus size={14} strokeWidth={2.8} />
                        </button>
                      </div>

                      <div
                        className={`${styles.addonLineTotal} ${
                          isSelected ? styles.addonLineTotalActive : ""
                        }`}
                      >
                        ₹{lineTotal}
                      </div>
                    </div>
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
