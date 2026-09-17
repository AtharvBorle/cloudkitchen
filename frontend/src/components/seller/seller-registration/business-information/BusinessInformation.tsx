"use client";

import React, { useState } from "react";
import { ChevronDown, ArrowRight, X } from "lucide-react";
import styles from "./BusinessInformation.module.css";
import { SellerMapPicker, AddressDetails } from "./SellerMapPicker";
import { saveSellerDraft } from "@/lib/seller-registration-store";

export interface BusinessInformationData {
  businessName: string;
  sellerType: string; // 'FOOD' | 'PROPERTY' | 'BOTH'
  categories: string[];
  foodType: string; // 'BOTH' | 'PURE_VEG' | 'NON_VEG'
  address: string;
  city?: string;
  pincode?: string;
  locationCoordinates?: { lat: number; lng: number };
  isLocationPinned?: boolean;
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
    sellerType: initialData?.sellerType || "FOOD",
    categories:
      initialData?.categories && initialData.categories.length > 0
        ? initialData.categories
        : ["North Indian", "Biryani"],
    foodType: initialData?.foodType || "BOTH",
    address: initialData?.address || "",
    city: initialData?.city || "Pune",
    pincode: initialData?.pincode || "411038",
    locationCoordinates: initialData?.locationCoordinates || {
      lat: 18.5204,
      lng: 73.8567,
    },
    isLocationPinned: initialData?.isLocationPinned ?? true,
  });

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      saveSellerDraft({ [name]: value });
      return next;
    });
  };

  const handleSellerTypeSelect = (type: string) => {
    setFormData((prev) => {
      const next = { ...prev, sellerType: type };
      saveSellerDraft({ sellerType: type as any });
      return next;
    });
  };

  const removeCategory = (catToRemove: string) => {
    setFormData((prev) => {
      const nextCategories = prev.categories.filter((cat) => cat !== catToRemove);
      const next = {
        ...prev,
        categories: nextCategories,
      };
      saveSellerDraft({ categories: nextCategories });
      return next;
    });
  };

  const handleAddCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (trimmed && !formData.categories.includes(trimmed)) {
      const nextCategories = [...formData.categories, trimmed];
      setFormData((prev) => {
        const next = {
          ...prev,
          categories: nextCategories,
        };
        saveSellerDraft({ categories: nextCategories });
        return next;
      });
      setNewCategoryInput("");
      setShowAddCategory(false);
    }
  };

  const handleLocationChange = (
    lat: number,
    lng: number,
    formattedAddress?: string,
    details?: AddressDetails
  ) => {
    setFormData((prev) => {
      const next = {
        ...prev,
        isLocationPinned: true,
        locationCoordinates: { lat, lng },
        address: formattedAddress ? formattedAddress : prev.address,
        city: details?.city || prev.city || "Pune",
        pincode: details?.pincode || prev.pincode || "411038",
      };
      saveSellerDraft({
        locationCoordinates: { lat, lng },
        isLocationPinned: true,
        address: next.address,
        city: next.city,
        pincode: next.pincode,
      });
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSellerDraft({
      businessName: formData.businessName,
      sellerType: formData.sellerType as any,
      categories: formData.categories,
      foodType: formData.foodType as any,
      address: formData.address,
      city: formData.city,
      pincode: formData.pincode,
      locationCoordinates: formData.locationCoordinates,
      isLocationPinned: formData.isLocationPinned,
    });
    if (onContinue) {
      onContinue(formData);
    }
  };

  return (
    <div className={styles.cardContainer}>
      {/* Desktop Header */}
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
            Business name <span className={styles.required}>*</span>
          </label>
          <div className={styles.inputWrapper}>
            <input
              id="businessName"
              name="businessName"
              type="text"
              required
              placeholder="Neo Kitchens"
              value={formData.businessName}
              onChange={handleChange}
              className={styles.input}
            />
          </div>
        </div>

        {/* 2. Seller Type (Segmented Tab Bar) */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>
            Seller type <span className={styles.required}>*</span>
          </label>
          <div className={styles.segmentedControl}>
            <button
              type="button"
              className={`${styles.segmentBtn} ${
                formData.sellerType === "FOOD" ? styles.segmentBtnActive : ""
              }`}
              onClick={() => handleSellerTypeSelect("FOOD")}
            >
              Food
            </button>
            <button
              type="button"
              className={`${styles.segmentBtn} ${
                formData.sellerType === "PROPERTY" ? styles.segmentBtnActive : ""
              }`}
              onClick={() => handleSellerTypeSelect("PROPERTY")}
            >
              Property
            </button>
            <button
              type="button"
              className={`${styles.segmentBtn} ${
                formData.sellerType === "BOTH" ? styles.segmentBtnActive : ""
              }`}
              onClick={() => handleSellerTypeSelect("BOTH")}
            >
              Both
            </button>
          </div>
        </div>

        {/* 3. Category / Cuisine */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>
            Category / cuisine <span className={styles.required}>*</span>
          </label>
          <div className={styles.categoryContainer}>
            {formData.categories.map((category) => (
              <span key={category} className={styles.categoryPill}>
                {category}
                <button
                  type="button"
                  onClick={() => removeCategory(category)}
                  className={styles.removeTagBtn}
                  aria-label={`Remove ${category}`}
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              </span>
            ))}

            {showAddCategory ? (
              <div className={styles.addCategoryInputWrapper}>
                <input
                  type="text"
                  placeholder="Cuisine name"
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCategory();
                    }
                  }}
                  autoFocus
                  className={styles.addCategoryInput}
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className={styles.addTagConfirmBtn}
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCategory(false)}
                  className={styles.addTagCancelBtn}
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddCategory(true)}
                className={styles.addMoreBtn}
              >
                + Add more
              </button>
            )}
          </div>
        </div>

        {/* 4. Food Type */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="foodType">
            Food type <span className={styles.required}>*</span>
          </label>
          <div className={styles.selectWrapper}>
            <select
              id="foodType"
              name="foodType"
              required
              value={formData.foodType}
              onChange={handleChange}
              className={styles.select}
            >
              <option value="BOTH">Both (Veg & Non-veg)</option>
              <option value="PURE_VEG">Pure Veg</option>
              <option value="NON_VEG">Non-veg</option>
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
            value={formData.address}
            onChange={handleChange}
            placeholder="12, 1st Floor, Cloud Hub, HSR Layout, Sector 6, Bangalore - 560102"
            className={styles.textarea}
          />
        </div>

        {/* 6. Pin Location on Map */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>
            Pin Location on Map <span className={styles.required}>*</span>
          </label>
          <SellerMapPicker
            latitude={formData.locationCoordinates?.lat || null}
            longitude={formData.locationCoordinates?.lng || null}
            isPinned={formData.isLocationPinned}
            onChange={handleLocationChange}
          />
        </div>

        {/* Action Row / Bottom Button */}
        <div className={styles.actionRow}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className={styles.backBtn}
            >
              Back
            </button>
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
