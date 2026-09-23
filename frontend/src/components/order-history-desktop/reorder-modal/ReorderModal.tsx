"use client";

import React, { useEffect } from "react";
import { 
  AlertTriangle, 
  Store, 
  Trash2, 
  X, 
  Utensils, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  ShoppingBag
} from "lucide-react";
import styles from "./ReorderModal.module.css";

export type ReorderModalType = "OFFLINE" | "ALL_UNAVAILABLE" | "PARTIAL" | "CART_CONFLICT" | "ERROR";

export interface ReorderItemInfo {
  id?: string;
  name: string;
  quantity?: number;
  price?: number;
  reason?: string;
  warning?: string | null;
}

export interface ReorderModalProps {
  isOpen: boolean;
  type: ReorderModalType;
  onClose: () => void;
  sellerName?: string;
  sellerId?: string;
  currentCartSellerName?: string;
  availableItems?: ReorderItemInfo[];
  unavailableItems?: ReorderItemInfo[];
  errorMessage?: string;
  onConfirmClearAndReorder?: () => void;
  onConfirmPartialReorder?: () => void;
  onExploreOtherKitchens?: () => void;
  onExploreSellerMenu?: () => void;
}

export const ReorderModal: React.FC<ReorderModalProps> = ({
  isOpen,
  type,
  onClose,
  sellerName = "Cloud Kitchen",
  sellerId,
  currentCartSellerName = "another kitchen",
  availableItems = [],
  unavailableItems = [],
  errorMessage,
  onConfirmClearAndReorder,
  onConfirmPartialReorder,
  onExploreOtherKitchens,
  onExploreSellerMenu,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        
        {/* ================= HEADER ================= */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            {type === "OFFLINE" && (
              <div className={`${styles.iconCircle} ${styles.iconOffline}`}>
                <Store size={24} />
              </div>
            )}
            {type === "ALL_UNAVAILABLE" && (
              <div className={`${styles.iconCircle} ${styles.iconWarning}`}>
                <AlertCircle size={24} />
              </div>
            )}
            {type === "PARTIAL" && (
              <div className={`${styles.iconCircle} ${styles.iconWarning}`}>
                <AlertTriangle size={24} />
              </div>
            )}
            {type === "CART_CONFLICT" && (
              <div className={`${styles.iconCircle} ${styles.iconConflict}`}>
                <Trash2 size={24} />
              </div>
            )}
            {type === "ERROR" && (
              <div className={`${styles.iconCircle} ${styles.iconError}`}>
                <AlertCircle size={24} />
              </div>
            )}

            <div className={styles.headerTitles}>
              <h3 className={styles.modalTitle}>
                {type === "OFFLINE" && "Kitchen is Offline"}
                {type === "ALL_UNAVAILABLE" && "Items Currently Unavailable"}
                {type === "PARTIAL" && "Some Items Unavailable"}
                {type === "CART_CONFLICT" && "Replace Existing Cart Items?"}
                {type === "ERROR" && "Unable to Process Reorder"}
              </h3>
              <p className={styles.modalSubtitle}>
                {type === "OFFLINE" && sellerName}
                {type === "ALL_UNAVAILABLE" && `${sellerName} • Reorder Update`}
                {type === "PARTIAL" && `${sellerName} • Partial Availability`}
                {type === "CART_CONFLICT" && "Single Kitchen Cart Policy"}
                {type === "ERROR" && "Order Verification"}
              </p>
            </div>
          </div>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* ================= BODY ================= */}
        <div className={styles.modalBody}>
          {/* OFFLINE VIEW */}
          {type === "OFFLINE" && (
            <>
              <div className={styles.kitchenNotice}>
                <span className={styles.kitchenNoticeTitle}>Store Temporarily Closed</span>
                <span className={styles.kitchenNoticeText}>
                  <strong>{sellerName}</strong> is currently offline or not accepting orders at this time.
                  Please check back later or discover delicious meals from other active kitchens nearby.
                </span>
              </div>
            </>
          )}

          {/* ALL UNAVAILABLE VIEW */}
          {type === "ALL_UNAVAILABLE" && (
            <>
              <p style={{ margin: 0, color: "#475569" }}>
                None of the items from this previous order are currently available on the menu or in stock right now at <strong>{sellerName}</strong>.
              </p>

              {unavailableItems.length > 0 && (
                <div className={styles.sectionBlock}>
                  <div className={`${styles.sectionHeader} ${styles.sectionHeaderUnavailable}`}>
                    <span>Unavailable Items ({unavailableItems.length})</span>
                  </div>
                  <div className={styles.itemList}>
                    {unavailableItems.map((item, idx) => (
                      <div key={idx} className={`${styles.itemCard} ${styles.itemCardUnavailable}`}>
                        <div className={styles.itemInfo}>
                          <span className={styles.itemName}>{item.name}</span>
                          <span className={styles.itemReason}>{item.reason || "Currently unavailable"}</span>
                        </div>
                        {item.price !== undefined && item.price > 0 && (
                          <span className={styles.itemPrice}>₹{item.price}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* PARTIAL VIEW */}
          {type === "PARTIAL" && (
            <>
              <p style={{ margin: 0, color: "#475569" }}>
                Some items from your previous order are currently out of stock or unavailable.
                Would you like to continue and add the remaining <strong>{availableItems.length} available item(s)</strong> to your cart?
              </p>

              {/* Unavailable section */}
              {unavailableItems.length > 0 && (
                <div className={styles.sectionBlock}>
                  <div className={`${styles.sectionHeader} ${styles.sectionHeaderUnavailable}`}>
                    <span>Unavailable Items ({unavailableItems.length})</span>
                  </div>
                  <div className={styles.itemList}>
                    {unavailableItems.map((item, idx) => (
                      <div key={idx} className={`${styles.itemCard} ${styles.itemCardUnavailable}`}>
                        <div className={styles.itemInfo}>
                          <span className={styles.itemName}>{item.name}</span>
                          <span className={styles.itemReason}>{item.reason || "Out of stock / Unavailable"}</span>
                        </div>
                        {item.quantity && (
                          <span style={{ fontSize: "0.8125rem", color: "#64748b" }}>
                            Qty: {item.quantity}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available section */}
              {availableItems.length > 0 && (
                <div className={styles.sectionBlock}>
                  <div className={`${styles.sectionHeader} ${styles.sectionHeaderAvailable}`}>
                    <span>Ready to Reorder ({availableItems.length})</span>
                  </div>
                  <div className={styles.itemList}>
                    {availableItems.map((item, idx) => (
                      <div key={idx} className={`${styles.itemCard} ${styles.itemCardAvailable}`}>
                        <div className={styles.itemInfo}>
                          <span className={styles.itemName}>{item.name}</span>
                          {item.warning ? (
                            <span className={styles.itemWarning}>{item.warning}</span>
                          ) : (
                            <span style={{ fontSize: "0.8125rem", color: "#16a34a" }}>In Stock & Available</span>
                          )}
                        </div>
                        <div className={styles.itemMeta}>
                          <span style={{ color: "#64748b" }}>Qty: {item.quantity || 1}</span>
                          {item.price !== undefined && (
                            <span className={styles.itemPrice}>₹{item.price * (item.quantity || 1)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* CART CONFLICT VIEW */}
          {type === "CART_CONFLICT" && (
            <>
              <div className={styles.kitchenNotice}>
                <span className={styles.kitchenNoticeTitle}>Different Kitchen in Cart</span>
                <span className={styles.kitchenNoticeText}>
                  Your cart currently contains items from <strong>{currentCartSellerName}</strong>. 
                  You can only order from one cloud kitchen per checkout.
                </span>
              </div>
              <p style={{ margin: 0, color: "#334155" }}>
                Are you sure you want to clear your current cart and reorder <strong>{availableItems.length} item(s)</strong> from <strong>{sellerName}</strong>?
              </p>
            </>
          )}

          {/* GENERAL ERROR VIEW */}
          {type === "ERROR" && (
            <p style={{ margin: 0, color: "#475569" }}>
              {errorMessage || "We encountered an issue preparing your reorder. Please try again or browse the menu directly."}
            </p>
          )}
        </div>

        {/* ================= FOOTER ================= */}
        <div className={styles.modalFooter}>
          {type === "OFFLINE" && (
            <>
              <button type="button" className={styles.btnCancel} onClick={onClose}>
                Dismiss
              </button>
              {onExploreOtherKitchens && (
                <button type="button" className={styles.btnPrimary} onClick={onExploreOtherKitchens}>
                  <Utensils size={16} />
                  <span>Explore Kitchens</span>
                </button>
              )}
            </>
          )}

          {type === "ALL_UNAVAILABLE" && (
            <>
              <button type="button" className={styles.btnCancel} onClick={onClose}>
                Close
              </button>
              {onExploreSellerMenu && (
                <button type="button" className={styles.btnPrimary} onClick={onExploreSellerMenu}>
                  <ShoppingBag size={16} />
                  <span>Browse Full Menu</span>
                </button>
              )}
            </>
          )}

          {type === "PARTIAL" && (
            <>
              <button type="button" className={styles.btnCancel} onClick={onClose}>
                Cancel
              </button>
              {onConfirmPartialReorder && (
                <button type="button" className={styles.btnPrimary} onClick={onConfirmPartialReorder}>
                  <span>Continue with {availableItems.length} Available Item{availableItems.length > 1 ? "s" : ""}</span>
                  <ArrowRight size={16} />
                </button>
              )}
            </>
          )}

          {type === "CART_CONFLICT" && (
            <>
              <button type="button" className={styles.btnCancel} onClick={onClose}>
                Keep My Current Cart
              </button>
              {onConfirmClearAndReorder && (
                <button type="button" className={styles.btnDanger} onClick={onConfirmClearAndReorder}>
                  <Trash2 size={16} />
                  <span>Clear Cart & Reorder</span>
                </button>
              )}
            </>
          )}

          {type === "ERROR" && (
            <button type="button" className={styles.btnCancel} onClick={onClose}>
              Dismiss
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default ReorderModal;
