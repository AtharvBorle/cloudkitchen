"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Sparkles, X, Loader2, Plus } from "lucide-react";
import { fetchApi } from "@/lib/fetch-api";
import type { AddonItemData } from "./SellerAddonsManager";
import styles from "./CreateAddonModal.module.css";

export interface CreateAddonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (newAddon: AddonItemData) => void;
}

export default function CreateAddonModal({
  isOpen,
  onClose,
  onCreated,
}: CreateAddonModalProps) {
  const [mounted, setMounted] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const resetForm = () => {
    setFormName("");
    setFormPrice("");
    setFormStock("");
    setFormDescription("");
    setFormIsActive(true);
    setErrorMsg(null);
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setErrorMsg(null);

    const trimmedName = formName.trim();
    if (!trimmedName) {
      setErrorMsg("Please enter an add-on name");
      return;
    }

    const priceNum = parseFloat(formPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setErrorMsg("Price must be greater than ₹0");
      return;
    }

    const trimmedStock = formStock.trim();
    let stockNum = 0;
    if (trimmedStock !== "") {
      stockNum = parseInt(trimmedStock, 10);
      if (isNaN(stockNum) || stockNum < 0) {
        setErrorMsg("Stock quantity cannot be negative");
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetchApi("/api/seller/addons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          price: priceNum,
          stockQuantity: stockNum,
          description: formDescription.trim(),
          isActive: formIsActive,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        const createdAddon: any =
          json.data?.addon || json.data || json.addon || json;
        const finalId = createdAddon.id || createdAddon._id || `addon_${Date.now()}`;
        if (onCreated) {
          onCreated({
            id: String(finalId),
            name: createdAddon.name || trimmedName,
            price: Number(createdAddon.price) || priceNum,
            stockQuantity:
              createdAddon.stockQuantity !== undefined
                ? Number(createdAddon.stockQuantity)
                : stockNum,
            lowStockThreshold:
              createdAddon.lowStockThreshold !== undefined
                ? Number(createdAddon.lowStockThreshold)
                : 5,
            isActive:
              createdAddon.isActive !== undefined
                ? Boolean(createdAddon.isActive)
                : formIsActive,
            stockStatus: !formIsActive
              ? "INACTIVE"
              : stockNum === 0
              ? "OUT_OF_STOCK"
              : stockNum <= (createdAddon.lowStockThreshold || 5)
              ? "LOW_STOCK"
              : "IN_STOCK",
            isAvailable: formIsActive && stockNum > 0,
            description: createdAddon.description || formDescription.trim(),
          });
        }
        handleClose();
      } else {
        setErrorMsg(json.message || "Failed to create add-on");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to create add-on");
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      handleSubmit(e);
    }
  };

  return createPortal(
    <div
      className={styles.modalBackdrop}
      onClick={(e) => {
        e.stopPropagation();
        handleClose();
      }}
    >
      <div
        className={styles.modalCard}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <div className={styles.modalIconBadge}>
              <Sparkles size={20} color="#FF6B00" />
            </div>
            <div>
              <h3 className={styles.modalTitle}>Create New Add-on</h3>
              <p className={styles.modalSubtitle}>
                Add an extra accompaniment with its own inventory
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className={styles.closeBtn}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {errorMsg && (
            <div
              style={{
                backgroundColor: "#FEF2F2",
                color: "#DC2626",
                border: "1px solid #FECACA",
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "0.85rem",
                fontWeight: 600,
              }}
            >
              {errorMsg}
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Add-on Name <span style={{ color: "#DC2626" }}>*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Extra Roti, Extra Sabji, Extra Rice, Dahi"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className={styles.formInput}
              autoFocus
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Selling Price (₹) <span style={{ color: "#DC2626" }}>*</span>
              </label>
              <input
                type="number"
                min="0.01"
                step="0.5"
                placeholder="e.g. 15"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                className={styles.formInput}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Initial Stock Qty</label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="Enter stock quantity (e.g. 20)"
                value={formStock}
                onChange={(e) => setFormStock(e.target.value)}
                className={styles.formInput}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Status</label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                height: "42px",
              }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFormIsActive(!formIsActive);
                }}
                className={`${styles.toggleSwitch} ${
                  formIsActive ? styles.toggleSwitchActive : ""
                }`}
              >
                <span
                  className={`${styles.toggleThumb} ${
                    formIsActive ? styles.toggleThumbActive : ""
                  }`}
                />
              </button>
              <span
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: formIsActive ? "#16A34A" : "#64748B",
                }}
              >
                {formIsActive ? "Active (Purchasable)" : "Inactive"}
              </span>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Description (Optional)</label>
            <textarea
              rows={2}
              placeholder="Brief description or serving portion size"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className={styles.formTextarea}
            />
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className={styles.cancelBtn}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className={styles.saveBtn}
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            <span>{submitting ? "Saving..." : "Create Add-on"}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
