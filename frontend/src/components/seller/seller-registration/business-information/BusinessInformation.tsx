"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ChevronDown, ArrowRight, X, Check, Plus, Search, Loader2 } from "lucide-react";
import styles from "./BusinessInformation.module.css";
import { SellerMapPicker, AddressDetails } from "./SellerMapPicker";
import { saveSellerDraft } from "@/lib/seller-registration-store";
import { fetchApi } from "@/lib/fetch-api";

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

export interface AdminCategoryItem {
  id?: string;
  name: string;
  type: "FOOD" | "PROPERTY" | "BOTH";
}

const isCategoryCompatibleWithSellerType = (
  catType: string,
  sellerType: string
): boolean => {
  const sType = (sellerType || "FOOD").toUpperCase();
  const cType = (catType || "FOOD").toUpperCase();

  if (sType === "BOTH") {
    return true;
  }
  if (cType === "BOTH") {
    return true;
  }
  if (sType === "FOOD") {
    return cType === "FOOD";
  }
  if (sType === "PROPERTY") {
    return cType === "PROPERTY" || cType === "ROOM";
  }
  return true;
};

export const BusinessInformation: React.FC<BusinessInformationProps> = ({
  initialData,
  onContinue,
  onBack,
}) => {
  const [formData, setFormData] = useState<BusinessInformationData>({
    businessName: initialData?.businessName || "",
    sellerType: initialData?.sellerType || "FOOD",
    categories: Array.isArray(initialData?.categories) ? initialData.categories : [],
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

  const [adminCategories, setAdminCategories] = useState<AdminCategoryItem[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState<boolean>(true);
  const [categorySearch, setCategorySearch] = useState<string>("");
  const [categoryError, setCategoryError] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    async function loadAdminCategories() {
      try {
        setIsCategoriesLoading(true);
        const res = await fetchApi("/api/public/categories");
        if (res.ok) {
          const json = await res.json();
          const data = json.data || json;
          const formattedList: AdminCategoryItem[] = [];
          const seen = new Set<string>();

          if (Array.isArray(data.categories)) {
            data.categories.forEach((c: any) => {
              const name = typeof c === "string" ? c : c.name;
              if (name && typeof name === "string" && name.trim()) {
                const trimmedName = name.trim();
                const lower = trimmedName.toLowerCase();
                if (!seen.has(lower)) {
                  seen.add(lower);
                  const cleanName = trimmedName.charAt(0).toUpperCase() + trimmedName.slice(1);
                  let catType: "FOOD" | "PROPERTY" | "BOTH" = "FOOD";
                  const rawType = (c.type || "").toUpperCase();
                  if (rawType === "PROPERTY" || rawType === "ROOM") {
                    catType = "PROPERTY";
                  } else if (rawType === "BOTH") {
                    catType = "BOTH";
                  } else {
                    catType = "FOOD";
                  }
                  formattedList.push({
                    id: c.id,
                    name: cleanName,
                    type: catType,
                  });
                }
              }
            });
          }

          if (formattedList.length === 0) {
            const defaults: AdminCategoryItem[] = [
              { name: "Cloud Kitchen", type: "FOOD" },
              { name: "Bakery & Confectionery", type: "FOOD" },
              { name: "Homestyle / Tiffin Service", type: "FOOD" },
              { name: "Cafe & Bistro", type: "FOOD" },
              { name: "Catering Service", type: "FOOD" },
              { name: "Quick Service Restaurant (QSR)", type: "FOOD" },
              { name: "Sweet Shop / Mithai", type: "FOOD" },
              { name: "Ice Cream & Desserts", type: "FOOD" },
              { name: "Commercial Kitchen Rental", type: "PROPERTY" },
              { name: "Cloud Kitchen Room", type: "PROPERTY" },
              { name: "Studio & Shoot Space", type: "PROPERTY" },
              { name: "Co-working Kitchen", type: "PROPERTY" },
              { name: "Co-living & Rooms", type: "PROPERTY" },
              { name: "Banquet / Event Hall", type: "PROPERTY" },
              { name: "Farmhouse / Resort Kitchen", type: "PROPERTY" },
              { name: "Kitchen + Dining Space", type: "BOTH" },
              { name: "Boutique Stay & Dining", type: "BOTH" },
              { name: "Food Hub / Multi-brand", type: "BOTH" },
            ];
            formattedList.push(...defaults);
          }

          formattedList.sort((a, b) => a.name.localeCompare(b.name));

          if (isMounted) {
            setAdminCategories(formattedList);

            // Clean up & normalize any pre-existing draft categories against current admin categories
            setFormData((prev) => {
              const validAndNormalized: string[] = [];
              for (const selected of prev.categories) {
                const match = formattedList.find(
                  (ac) => ac.name.toLowerCase() === selected.toLowerCase()
                );
                if (match && isCategoryCompatibleWithSellerType(match.type, prev.sellerType)) {
                  if (!validAndNormalized.includes(match.name)) {
                    validAndNormalized.push(match.name);
                  }
                }
              }
              if (
                validAndNormalized.length !== prev.categories.length ||
                validAndNormalized.some((v, idx) => v !== prev.categories[idx])
              ) {
                saveSellerDraft({ categories: validAndNormalized });
                return { ...prev, categories: validAndNormalized };
              }
              return prev;
            });
          }
        }
      } catch (err) {
        console.error("Failed to load admin categories:", err);
      } finally {
        if (isMounted) {
          setIsCategoriesLoading(false);
        }
      }
    }

    loadAdminCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        businessName: initialData.businessName ?? prev.businessName,
        sellerType: initialData.sellerType ?? prev.sellerType,
        categories: Array.isArray(initialData.categories) ? initialData.categories : prev.categories,
        foodType: initialData.foodType ?? prev.foodType,
        address: initialData.address ?? prev.address,
        city: initialData.city ?? prev.city,
        pincode: initialData.pincode ?? prev.pincode,
        locationCoordinates: initialData.locationCoordinates ?? prev.locationCoordinates,
        isLocationPinned: initialData.isLocationPinned ?? prev.isLocationPinned,
      }));
    }
  }, [initialData]);

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
      // Filter existing selected categories to remove any that are incompatible with the new seller type
      const validCategories = prev.categories.filter((catName) => {
        const found = adminCategories.find(
          (ac) => ac.name.toLowerCase() === catName.toLowerCase()
        );
        if (!found) return false;
        return isCategoryCompatibleWithSellerType(found.type, type);
      });

      const next = { ...prev, sellerType: type, categories: validCategories };
      saveSellerDraft({ sellerType: type as any, categories: validCategories });
      return next;
    });
  };

  const toggleCategory = (catName: string) => {
    setFormData((prev) => {
      const exists = prev.categories.some(
        (c) => c.toLowerCase() === catName.toLowerCase()
      );
      const nextCategories = exists
        ? prev.categories.filter((c) => c.toLowerCase() !== catName.toLowerCase())
        : [...prev.categories, catName];

      saveSellerDraft({ categories: nextCategories });
      if (nextCategories.length > 0) {
        setCategoryError("");
      }
      return { ...prev, categories: nextCategories };
    });
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

  const selectedCount = useMemo(() => {
    return formData.categories.filter((catName) =>
      adminCategories.some(
        (ac) =>
          ac.name.toLowerCase() === catName.toLowerCase() &&
          isCategoryCompatibleWithSellerType(ac.type, formData.sellerType)
      )
    ).length;
  }, [formData.categories, adminCategories, formData.sellerType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.sellerType !== "PROPERTY" && selectedCount === 0) {
      setCategoryError("Please select at least one business category.");
      return;
    }

    const validCategories = formData.categories.filter((catName) =>
      adminCategories.some(
        (ac) =>
          ac.name.toLowerCase() === catName.toLowerCase() &&
          isCategoryCompatibleWithSellerType(ac.type, formData.sellerType)
      )
    );

    saveSellerDraft({
      businessName: formData.businessName,
      sellerType: formData.sellerType as any,
      categories: validCategories,
      foodType: formData.foodType as any,
      address: formData.address,
      city: formData.city,
      pincode: formData.pincode,
      locationCoordinates: formData.locationCoordinates,
      isLocationPinned: formData.isLocationPinned,
    });
    if (onContinue) {
      onContinue({ ...formData, categories: validCategories });
    }
  };

  const filteredCategories = useMemo(() => {
    const typeFiltered = adminCategories.filter((cat) =>
      isCategoryCompatibleWithSellerType(cat.type, formData.sellerType)
    );

    if (!categorySearch.trim()) return typeFiltered;
    return typeFiltered.filter((c) =>
      c.name.toLowerCase().includes(categorySearch.trim().toLowerCase())
    );
  }, [adminCategories, formData.sellerType, categorySearch]);

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

        {/* 3. Business Category */}
        <div className={styles.fieldGroup}>
          <div className={styles.categorySectionHeader}>
            <label className={styles.label} style={{ marginBottom: 0 }}>
              Business category <span className={styles.required}>*</span>
            </label>
            <span className={styles.categoryCountBadge}>
              {selectedCount} Selected
            </span>
          </div>
          <p className={styles.categorySubtitle}>
            Select the business category that applies to your business operations (configured by admin).
          </p>

          {/* Quick Search */}
          {filteredCategories.length > 4 && (
            <div className={styles.categorySearchWrapper}>
              <Search size={14} className={styles.categorySearchIcon} />
              <input
                type="text"
                placeholder="Search business categories..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className={styles.categorySearchInput}
              />
            </div>
          )}

          {/* Selectable Categories Grid */}
          <div className={styles.selectableCategoriesGrid}>
            {isCategoriesLoading ? (
              <div className={styles.loadingCategories}>
                <Loader2 size={16} className="animate-spin" />
                <span>Loading business categories...</span>
              </div>
            ) : filteredCategories.length > 0 ? (
              filteredCategories.map((category) => {
                const isSelected = formData.categories.some(
                  (c) => c.toLowerCase() === category.name.toLowerCase()
                );
                return (
                  <button
                    key={category.id || category.name}
                    type="button"
                    onClick={() => toggleCategory(category.name)}
                    className={`${styles.selectableCategoryChip} ${
                      isSelected ? styles.selectableCategoryChipActive : ""
                    }`}
                  >
                    {isSelected ? (
                      <Check size={13} strokeWidth={2.8} className={styles.chipCheckIcon} />
                    ) : (
                      <Plus size={13} strokeWidth={2.4} className={styles.chipPlusIcon} />
                    )}
                    <span>{category.name}</span>
                  </button>
                );
              })
            ) : (
              <span className={styles.noCategoriesFound}>
                {categorySearch
                  ? `No business categories matching "${categorySearch}"`
                  : `No business categories configured for ${
                      formData.sellerType === "FOOD"
                        ? "Food"
                        : formData.sellerType === "PROPERTY"
                        ? "Property"
                        : "this type"
                    }.`}
              </span>
            )}
          </div>

          {categoryError && (
            <p className={styles.categoryError}>⚠️ {categoryError}</p>
          )}
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
              <option value="PURE_VEG">Pure Veg (includes Jain, and vegan foods)</option>
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
