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
  initialDescription?: string;
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

const DEFAULT_VARIANTS: ResponsiveVariantItem[] = [
  { id: "1", name: "Extra Cheese", price: "40" },
  { id: "2", name: "Paneer with Corn", price: "60" },
  { id: "3", name: "Extra Pizza Slice", price: "80" },
  { id: "4", name: "Mushroom Topping", price: "50" },
];

export const ResponsiveMenuItems: React.FC<ResponsiveMenuItemsProps> = ({
  initialItemName = "Butter Chicken",
  initialPrice = "450",
  initialCategory = "Mains",
  initialType = "Veg",
  initialDescription = "Rich and creamy tomato-based curry with succulent chicken tandoori pieces cooked in butter and aromatic spices.",
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
  const [description, setDescription] = useState(initialDescription);
  const [stockQty, setStockQty] = useState(initialStockQty);
  const [isInStock, setIsInStock] = useState(initialIsInStock);
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

          {/* 5. Type */}
          <div className={styles.formGroup}>
            <label className={styles.fieldLabel} htmlFor="typeSelect">
              Type
            </label>
            <div className={styles.selectWrapper}>
              <select
                id="typeSelect"
                className={styles.selectInput}
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="Veg">Veg</option>
                <option value="Non-Veg">Non-Veg</option>
                <option value="Egg">Egg</option>
                <option value="Vegan">Vegan</option>
              </select>
              <ChevronDown size={18} className={styles.selectArrow} />
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

