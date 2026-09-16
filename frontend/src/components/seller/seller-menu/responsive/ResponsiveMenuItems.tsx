"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Camera, ChevronDown, Trash2, Plus, Bell } from "lucide-react";
import styles from "./ResponsiveMenuItems.module.css";

export interface ResponsiveVariantItem {
  id: string;
  name: string;
  price: string;
}

export interface ResponsiveDaySchedule {
  day: string;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
}

export interface ResponsiveMenuItemsProps {
  initialItemName?: string;
  initialPrice?: string;
  initialCategory?: string;
  initialType?: string;
  initialSelectedFoodTypes?: string[];
  initialDescription?: string;
  stockQty?: number | string;
  initialStockQty?: number | string;
  initialIsInStock?: boolean;
  initialVariants?: ResponsiveVariantItem[];
  initialSchedules?: ResponsiveDaySchedule[];
  initialImageUrl?: string;
  onBack?: () => void;
  onSave?: (data: {
    itemName: string;
    price: string;
    category: string;
    type: string;
    selectedFoodTypes?: string[];
    description: string;
    stockQty: number | string;
    isInStock: boolean;
    variants: ResponsiveVariantItem[];
    schedules: ResponsiveDaySchedule[];
    imageFile?: File | null;
  }) => void;
}

const DEFAULT_SCHEDULES: ResponsiveDaySchedule[] = [
  { day: "Monday", openTime: "09:00 AM", closeTime: "10:00 PM", isOpen: true },
  { day: "Tuesday", openTime: "09:00 AM", closeTime: "10:00 PM", isOpen: true },
  { day: "Wednesday", openTime: "09:00 AM", closeTime: "10:00 PM", isOpen: true },
  { day: "Thursday", openTime: "09:00 AM", closeTime: "10:00 PM", isOpen: true },
  { day: "Friday", openTime: "09:00 AM", closeTime: "10:00 PM", isOpen: true },
  { day: "Saturday", openTime: "09:00 AM", closeTime: "10:00 PM", isOpen: true },
  { day: "Sunday", openTime: "09:00 AM", closeTime: "10:00 PM", isOpen: true },
];

const DEFAULT_VARIANTS: ResponsiveVariantItem[] = [];

export const ResponsiveMenuItems: React.FC<ResponsiveMenuItemsProps> = ({
  initialItemName = "",
  initialPrice = "",
  initialCategory = "Mains",
  initialType = "Veg",
  initialSelectedFoodTypes,
  initialDescription = "",
  initialStockQty = "24",
  initialIsInStock = true,
  initialVariants = DEFAULT_VARIANTS,
  initialSchedules = DEFAULT_SCHEDULES,
  initialImageUrl,
  onBack,
  onSave,
}) => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [itemName, setItemName] = useState(initialItemName);
  const [price, setPrice] = useState(initialPrice);
  const [category, setCategory] = useState(initialCategory);
  const [type, setType] = useState(initialType);
  const [selectedFoodTypes, setSelectedFoodTypes] = useState<string[]>(() => {
    if (initialSelectedFoodTypes && initialSelectedFoodTypes.length > 0) {
      return initialSelectedFoodTypes;
    }
    if (initialType) return [initialType];
    return ["Veg"];
  });

  const toggleFoodType = (foodType: string) => {
    setSelectedFoodTypes((prev) => {
      const isAlreadySelected = prev.includes(foodType);

      if (isAlreadySelected) {
        const next = prev.filter((t) => t !== foodType);
        setType(next[0] || "Veg");
        return next;
      } else {
        if (foodType === "Non-Veg" || foodType === "Non Veg") {
          setType("Non-Veg");
          return ["Non-Veg"];
        } else {
          const withoutNonVeg = prev.filter(
            (t) => t !== "Non-Veg" && t !== "Non Veg"
          );
          const next = [...withoutNonVeg, foodType];
          setType(next[0] || "Veg");
          return next;
        }
      }
    });
  };
  const [variants, setVariants] = useState<ResponsiveVariantItem[]>(initialVariants);
  const [schedules, setSchedules] = useState<ResponsiveDaySchedule[]>(initialSchedules);
  const [imagePreview, setImagePreview] = useState<string | null>(initialImageUrl || null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/seller/menu");
    }
  };


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        alert(`Image "${file.name}" (${sizeMB} MB) exceeds the 5MB upload limit. Please select an image under 5MB.`);
        e.target.value = "";
        return;
      }
      setImageFile(file);
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
    }
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleToggleDay = (dayName: string) => {
    setSchedules((prev) =>
      prev.map((s) => (s.day === dayName ? { ...s, isOpen: !s.isOpen } : s))
    );
  };

  const handleTimeChange = (
    dayName: string,
    field: "openTime" | "closeTime",
    val: string
  ) => {
    setSchedules((prev) =>
      prev.map((s) => (s.day === dayName ? { ...s, [field]: val } : s))
    );
  };

  const handleAddVariant = () => {
    const nextId = (Date.now() + Math.random()).toString();
    setVariants((prev) => [...prev, { id: nextId, name: "", price: "0" }]);
  };

  const handleUpdateVariant = (
    id: string,
    field: "name" | "price",
    value: string
  ) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  const handleRemoveVariant = (id: string) => {
    setVariants((prev) => prev.filter((v) => v.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      itemName,
      price,
      category,
      type,
      selectedFoodTypes,
      description,
      stockQty,
      isInStock,
      variants,
      schedules,
      imageFile,
    };

    if (onSave) {
      onSave(data);
    } else {
      router.push("/seller/menu");
    }
  };

  return (
    <div className={styles.screenWrapper}>
      {/* 390px Mobile View Container */}
      <div className={styles.mobileContainer}>
        {/* Top Header */}
        <header className={styles.topBar}>
          <button
            type="button"
            className={styles.backButton}
            onClick={handleBackClick}
            aria-label="Back to Menu"
            title="Back"
          >
            <ChevronLeft size={24} />
          </button>

          <h1 className={styles.headerTitle}>Add item</h1>

          <button
            type="button"
            className={styles.iconButton}
            onClick={() => router.push("/seller/notifications")}
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={22} />
          </button>
        </header>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className={styles.contentArea}>
          {/* 1. Upload Photo Banner */}
          <div
            className={styles.uploadDropzone}
            onClick={handleTriggerUpload}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                handleTriggerUpload();
              }
            }}
            aria-label="Upload Item Photo"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg"
              className={styles.fileInputHidden}
              onChange={handleImageChange}
            />

            {imagePreview ? (
              <div className={styles.previewContainer}>
                <img
                  src={imagePreview}
                  alt="Item Preview"
                  className={styles.previewImage}
                />
                <span className={styles.changePhotoText}>Change photo</span>
              </div>
            ) : (
              <>
                <div className={styles.cameraCircle}>
                  <Camera size={22} strokeWidth={2.2} />
                </div>
                <span className={styles.uploadTitle}>Upload photo</span>
                <span className={styles.uploadSubtitle}>
                  Supports JPG, PNG up to 5MB
                </span>
              </>
            )}
          </div>

          {/* 2. Item name */}
          <div className={styles.formGroup}>
            <label className={styles.fieldLabel} htmlFor="itemNameInput">
              Item name
            </label>
            <input
              id="itemNameInput"
              type="text"
              className={styles.textInput}
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. Butter Chicken"
              required
            />
          </div>

          {/* 3. Price */}
          <div className={styles.formGroup}>
            <label className={styles.fieldLabel} htmlFor="priceInput">
              Price
            </label>
            <div className={styles.priceInputWrapper}>
              <span className={styles.pricePrefix}>₹</span>
              <input
                id="priceInput"
                type="number"
                className={`${styles.textInput} ${styles.priceInput}`}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="450"
                required
              />
            </div>
          </div>

          {/* 4. Category */}
          <div className={styles.formGroup}>
            <label className={styles.fieldLabel} htmlFor="categorySelect">
              Category
            </label>
            <div className={styles.selectWrapper}>
              <select
                id="categorySelect"
                className={styles.selectInput}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Mains">Mains</option>
                <option value="Starters">Starters</option>
                <option value="Desserts">Desserts</option>
                <option value="Drinks">Drinks</option>
                <option value="Breads">Breads</option>
                <option value="Beverages">Beverages</option>
              </select>
              <ChevronDown size={18} className={styles.selectArrow} />
            </div>
          </div>

          {/* 5. Food Type Multi-Select */}
          <div className={styles.formGroup}>
            <label className={styles.fieldLabel}>
              Food Type <span style={{ fontSize: "0.8rem", color: "#64748B", fontWeight: "normal" }}>(Multi-Select)</span>
            </label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
              {["Veg", "Non-Veg", "Vegan", "Jain"].map((ft) => {
                const isSelected = selectedFoodTypes.includes(ft);
                const isNonVeg = ft === "Non-Veg";
                const isVegan = ft === "Vegan";
                const isJain = ft === "Jain";

                let activeBg = "#ECFDF5";
                let activeBorder = "#10B981";
                let activeColor = "#065F46";
                if (isNonVeg) {
                  activeBg = "#FEF2F2";
                  activeBorder = "#EF4444";
                  activeColor = "#991B1B";
                } else if (isVegan) {
                  activeBg = "#F0FDF4";
                  activeBorder = "#22C55E";
                  activeColor = "#15803D";
                } else if (isJain) {
                  activeBg = "#FFFBEB";
                  activeBorder = "#F59E0B";
                  activeColor = "#92400E";
                }

                return (
                  <button
                    key={ft}
                    type="button"
                    onClick={() => toggleFoodType(ft)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 14px",
                      borderRadius: "10px",
                      border: isSelected ? `1.5px solid ${activeBorder}` : "1px solid #E2E8F0",
                      backgroundColor: isSelected ? activeBg : "#FFFFFF",
                      color: isSelected ? activeColor : "#475569",
                      fontWeight: isSelected ? "700" : "500",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "4px",
                        border: isSelected ? `1.5px solid ${activeBorder}` : "1px solid #CBD5E1",
                        backgroundColor: isSelected ? activeBorder : "#FFFFFF",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "11px",
                      }}
                    >
                      {isSelected ? "✓" : ""}
                    </span>
                    <span>{ft}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Description (Optional) */}
          <div className={styles.formGroup}>
            <label className={styles.fieldLabel} htmlFor="descInput">
              Description (Optional)
            </label>
            <textarea
              id="descInput"
              className={styles.textAreaInput}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Rich and creamy tomato-based curry with succulent chicken tandoori pieces cooked in butter and aromatic spices."
            />
          </div>

          {/* 7. Day-wise Operational Hours */}
          <div className={styles.formGroup}>
            <h2 className={styles.sectionTitle}>Day-wise Operational Hours</h2>
            <div className={styles.scheduleList}>
              {schedules.map((schedule) => (
                <div key={schedule.day} className={styles.scheduleRow}>
                  <span className={styles.dayLabel}>{schedule.day}</span>
                  <div className={styles.timeWrapper}>
                    <input
                      type="text"
                      className={styles.timeBox}
                      value={schedule.openTime}
                      onChange={(e) =>
                        handleTimeChange(schedule.day, "openTime", e.target.value)
                      }
                      aria-label={`${schedule.day} open time`}
                    />
                    <span className={styles.toText}>to</span>
                    <input
                      type="text"
                      className={styles.timeBox}
                      value={schedule.closeTime}
                      onChange={(e) =>
                        handleTimeChange(schedule.day, "closeTime", e.target.value)
                      }
                      aria-label={`${schedule.day} close time`}
                    />
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={schedule.isOpen}
                    className={`${styles.toggleSwitch} ${
                      schedule.isOpen ? styles.toggleSwitchActive : ""
                    }`}
                    onClick={() => handleToggleDay(schedule.day)}
                    aria-label={`Toggle hours for ${schedule.day}`}
                  >
                    <span className={styles.toggleThumb} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 8. Variants & Add-ons */}
          <div className={styles.formGroup}>
            <h2 className={styles.sectionTitle}>Variants & Add-ons</h2>
            <div className={styles.variantsList}>
              {variants.map((variant) => (
                <div key={variant.id} className={styles.variantRow}>
                  <input
                    type="text"
                    className={styles.variantNameInput}
                    value={variant.name}
                    placeholder="Variant name"
                    onChange={(e) =>
                      handleUpdateVariant(variant.id, "name", e.target.value)
                    }
                  />
                  <div className={styles.variantPriceWrapper}>
                    <span className={styles.variantCurrency}>₹</span>
                    <input
                      type="number"
                      className={styles.variantPriceInput}
                      value={variant.price}
                      placeholder="0"
                      onChange={(e) =>
                        handleUpdateVariant(variant.id, "price", e.target.value)
                      }
                    />
                  </div>
                  <button
                    type="button"
                    className={styles.deleteVariantBtn}
                    onClick={() => handleRemoveVariant(variant.id)}
                    aria-label={`Delete ${variant.name || "variant"}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              <button
                type="button"
                className={styles.addVariantBtn}
                onClick={handleAddVariant}
              >
                <Plus size={16} strokeWidth={2.4} />
                <span>Add Variant</span>
              </button>
            </div>
          </div>

          {/* 9. In Stock Card */}
          <div className={styles.stockCard}>
            <div className={styles.stockInfo}>
              <span className={styles.stockTitle}>In stock</span>
              <span className={styles.stockSubtitle}>
                Make this item available immediately
              </span>
            </div>

            <div className={styles.stockControls}>
              <input
                type="number"
                className={styles.stockQtyInput}
                value={stockQty}
                onChange={(e) => setStockQty(e.target.value)}
                placeholder="24"
                aria-label="Stock quantity"
              />
              <button
                type="button"
                role="switch"
                aria-checked={isInStock}
                className={`${styles.toggleSwitch} ${
                  isInStock ? styles.toggleSwitchActive : ""
                }`}
                onClick={() => setIsInStock((prev) => !prev)}
                aria-label="Toggle in stock"
              >
                <span className={styles.toggleThumb} />
              </button>
            </div>
          </div>

          {/* 10. Bottom Action: Save item */}
          <button type="submit" className={styles.saveButton}>
            Save item
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResponsiveMenuItems;

