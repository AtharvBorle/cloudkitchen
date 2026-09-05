"use client";

import React, { useState } from "react";
import { ChevronDown, X, Plus, MapPin, ArrowRight } from "lucide-react";
import styles from "./BusinessInformation.module.css";

export interface BusinessInformationData {
  businessName: string;
  sellerType: string;
  categories: string[];
  foodType: string;
  address: string;
  locationCoordinates?: { lat: number; lng: number };
}

export interface BusinessInformationProps {
  initialData?: Partial<BusinessInformationData>;
  onContinue?: (data: BusinessInformationData) => void;
  onBack?: () => void;
}

export const BusinessInformation: React.FC<BusinessInformationProps> = ({
  initialData,
  onContinue,
  onBack,
}) => {
  const [formData, setFormData] = useState<BusinessInformationData>({
    businessName: initialData?.businessName || "",
    sellerType: initialData?.sellerType || "",
    categories: initialData?.categories || ["Cloud Kitchen", "Guest Rooms"],
    foodType: initialData?.foodType || "",
    address: initialData?.address || "",
    locationCoordinates: initialData?.locationCoordinates,
  });

  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const removeCategory = (categoryToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.filter((cat) => cat !== categoryToRemove),
    }));
  };

  const addCategory = (categoryToAdd: string) => {
    const trimmed = categoryToAdd.trim();
    if (trimmed && !formData.categories.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        categories: [...prev.categories, trimmed],
      }));
      setNewCategoryInput("");
      setShowAddCategoryModal(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onContinue) {
      onContinue(formData);
    }
  };

  return (
    <div className={styles.cardContainer}>
      {/* Header */}
      <div className={styles.headerGroup}>
        <h2 className={styles.title}>Business Registration Details</h2>
        <p className={styles.subtitle}>
          Provide your business location, type, and operation categories.
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* 1. Business Name */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="businessName">
            Business Name <span className={styles.required}>*</span>
          </label>
          <input
            id="businessName"
            name="businessName"
            type="text"
            required
            placeholder="e.g. Neo Cloud Kitchens & Rooms"
            value={formData.businessName}
            onChange={handleChange}
            className={styles.input}
          />
        </div>

        {/* 2. Seller Type */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="sellerType">
            Seller Type <span className={styles.required}>*</span>
          </label>
          <div className={styles.selectWrapper}>
            <select
              id="sellerType"
              name="sellerType"
              required
              value={formData.sellerType}
              onChange={handleChange}
              className={styles.select}
            >
              <option value="" disabled>
                Select type (Food / Property / Both)
              </option>
              <option value="FOOD">Food (Cloud Kitchen / Restaurant)</option>
              <option value="PROPERTY">Property (Guest Rooms / Co-living)</option>
              <option value="BOTH">Both (Food & Property)</option>
            </select>
            <ChevronDown className={styles.chevronIcon} />
          </div>
        </div>

        {/* 3. Category */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>
            Category <span className={styles.required}>*</span>
          </label>
          <div className={styles.categoryPillsRow}>
            {formData.categories.map((category) => (
              <button
                type="button"
                key={category}
                className={styles.categoryPill}
                onClick={() => removeCategory(category)}
                title={`Remove ${category}`}
              >
                <span>{category}</span>
                <X className={styles.removeIcon} />
              </button>
            ))}

            {showAddCategoryModal ? (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <input
                  type="text"
                  placeholder="Category name"
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCategory(newCategoryInput);
                    }
                  }}
                  autoFocus
                  style={{
                    height: 32,
                    padding: "0 10px",
                    borderRadius: 16,
                    border: "1px solid #f97316",
                    fontSize: "0.82rem",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={() => addCategory(newCategoryInput)}
                  style={{
                    height: 32,
                    padding: "0 10px",
                    borderRadius: 16,
                    backgroundColor: "#f97316",
                    color: "#ffffff",
                    border: "none",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                  }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                className={styles.addCategoryBtn}
                onClick={() => setShowAddCategoryModal(true)}
              >
                <Plus style={{ width: 14, height: 14 }} />
                <span>Add category</span>
              </button>
            )}
          </div>
        </div>

        {/* 4. Food Type */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="foodType">
            Food Type
          </label>
          <div className={styles.selectWrapper}>
            <select
              id="foodType"
              name="foodType"
              value={formData.foodType}
              onChange={handleChange}
              className={styles.select}
            >
              <option value="">Select preference (Veg / Non-Veg / Both)</option>
              <option value="PURE_VEG">Pure Veg</option>
              <option value="NON_VEG">Non-Veg</option>
              <option value="BOTH">Both (Veg & Non-Veg)</option>
            </select>
            <ChevronDown className={styles.chevronIcon} />
          </div>
        </div>

        {/* 5. Address */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="address">
            Address <span className={styles.required}>*</span>
          </label>
          <textarea
            id="address"
            name="address"
            required
            rows={2}
            placeholder="Street address, Suite, City, State, ZIP code"
            value={formData.address}
            onChange={handleChange}
            className={styles.textarea}
          />
        </div>

        {/* 6. Pin Location */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>
            Pin Location <span className={styles.required}>*</span>
          </label>
          <div
            className={styles.pinLocationCard}
            onClick={() => {
              // Trigger geolocation or map picker
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    setFormData((prev) => ({
                      ...prev,
                      locationCoordinates: {
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                      },
                    }));
                  },
                  () => {
                    // default Pune coordinates
                    setFormData((prev) => ({
                      ...prev,
                      locationCoordinates: { lat: 18.5204, lng: 73.8567 },
                    }));
                  }
                );
              }
            }}
          >
            <div className={styles.pinIconWrapper}>
              <MapPin className={styles.pinIcon} />
            </div>
            <p className={styles.pinTitle}>
              {formData.locationCoordinates
                ? `Marker Set: [${formData.locationCoordinates.lat.toFixed(4)}, ${formData.locationCoordinates.lng.toFixed(4)}]`
                : "Set location coordinate marker"}
            </p>
            <p className={styles.pinSubtitle}>
              Drag map to adjust precision pin placement
            </p>
          </div>
        </div>

        {/* 7. Bottom Action Row */}
        <div className={styles.actionRow}>
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className={styles.backBtn}
            >
              Back
            </button>
          ) : (
            <div />
          )}

          <button type="submit" className={styles.continueBtn}>
            <span>Continue</span>
            <ArrowRight className={styles.btnArrow} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default BusinessInformation;
