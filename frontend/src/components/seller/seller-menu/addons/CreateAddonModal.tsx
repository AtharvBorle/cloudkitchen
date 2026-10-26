"use client";

import React, { useState, useRef } from "react";
import { Sparkles, X, Upload, Loader2, Plus } from "lucide-react";
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
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("20");
  const [formThreshold, setFormThreshold] = useState("5");
  const [formDescription, setFormDescription] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        alert(
          `Image "${file.name}" (${(file.size / (1024 * 1024)).toFixed(
            1
          )} MB) exceeds the 10MB upload limit. Please select an image under 10MB.`
        );
        e.target.value = "";
        return;
      }
      setFormImageFile(file);
      setFormImagePreview(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormPrice("");
    setFormStock("20");
    setFormThreshold("5");
    setFormDescription("");
    setFormIsActive(true);
    setFormImageFile(null);
    setFormImagePreview(null);
    setErrorMsg(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = formName.trim();
    if (!trimmedName) {
      setErrorMsg("Please enter an add-on name");
      return;
    }

    const priceNum = parseFloat(formPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setErrorMsg("Please enter a valid selling price (₹0 or greater)");
      return;
    }

    const stockNum = parseInt(formStock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      setErrorMsg("Stock quantity cannot be negative");
      return;
    }

    const thresholdNum = parseInt(formThreshold, 10);
    if (isNaN(thresholdNum) || thresholdNum < 0) {
      setErrorMsg("Low-stock threshold cannot be negative");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", trimmedName);
      formData.append("price", String(priceNum));
      formData.append("stockQuantity", String(stockNum));
      formData.append("lowStockThreshold", String(thresholdNum));
      formData.append("description", formDescription.trim());
      formData.append("isActive", String(formIsActive));
      if (formImageFile) {
        formData.append("image", formImageFile);
      }

      const res = await fetchApi("/api/seller/addons", {
        method: "POST",
        body: formData,
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        const createdAddon: AddonItemData =
          json.data?.addon || json.data || json.addon || json;
        if (onCreated) {
          onCreated({
            id: createdAddon.id,
            name: createdAddon.name || trimmedName,
            price: Number(createdAddon.price) || priceNum,
            stockQuantity:
              createdAddon.stockQuantity !== undefined
                ? Number(createdAddon.stockQuantity)
                : stockNum,
            lowStockThreshold:
              createdAddon.lowStockThreshold !== undefined
                ? Number(createdAddon.lowStockThreshold)
                : thresholdNum,
            isActive:
              createdAddon.isActive !== undefined
                ? Boolean(createdAddon.isActive)
                : formIsActive,
            stockStatus: !formIsActive
              ? "INACTIVE"
              : stockNum === 0
              ? "OUT_OF_STOCK"
              : stockNum <= thresholdNum
              ? "LOW_STOCK"
              : "IN_STOCK",
            isAvailable: formIsActive && stockNum > 0,
            imageUrl: createdAddon.imageUrl || formImagePreview || null,
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

  return (
    <div className={styles.modalBackdrop} onClick={handleClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
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
            onClick={handleClose}
            className={styles.closeBtn}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
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
                required
                placeholder="e.g. Extra Roti, Extra Sabji, Extra Rice, Dahi"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className={styles.formInput}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Selling Price (₹) <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
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
                  placeholder="e.g. 20"
                  value={formStock}
                  onChange={(e) => setFormStock(e.target.value)}
                  className={styles.formInput}
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Low-Stock Threshold</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g. 5"
                  value={formThreshold}
                  onChange={(e) => setFormThreshold(e.target.value)}
                  className={styles.formInput}
                />
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
                    onClick={() => setFormIsActive(!formIsActive)}
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
                    {formIsActive ? "Active" : "Inactive"}
                  </span>
                </div>
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

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Add-on Image (Optional)</label>
              <div
                className={styles.imageUploadArea}
                onClick={() => fileInputRef.current?.click()}
              >
                {formImagePreview ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <img
                      src={formImagePreview}
                      alt="Preview"
                      className={styles.imagePreview}
                    />
                    <div style={{ textAlign: "left" }}>
                      <span
                        style={{
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          color: "#FF6B00",
                        }}
                      >
                        Click to change photo
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload size={20} color="#94A3B8" />
                    <span style={{ fontSize: "0.84rem", color: "#64748B" }}>
                      Click to upload add-on photo (under 10MB)
                    </span>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: "none" }}
                  onChange={handleImageChange}
                />
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={handleClose}
              className={styles.cancelBtn}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
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
        </form>
      </div>
    </div>
  );
}
