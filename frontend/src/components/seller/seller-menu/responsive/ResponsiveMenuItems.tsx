"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Camera, ChevronDown, Trash2, Plus, Bell, Eye, RefreshCw, X, Utensils, User, Users } from "lucide-react";
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
  initialSubCategory?: string;
  categories?: Array<{ id: string; name: string; subCategories?: Array<{ id: string; name: string }> }>;
  initialType?: string;
  initialSelectedFoodTypes?: string[];
  initialDescription?: string;
  stockQty?: number | string;
  initialStockQty?: number | string;
  initialIsInStock?: boolean;
  initialVariants?: ResponsiveVariantItem[];
  initialSchedules?: ResponsiveDaySchedule[];
  initialImageUrl?: string;
  initialImages?: string | string[];
  onBack?: () => void;
  onSave?: (data: {
    itemName: string;
    price: string;
    category: string;
    subCategory?: string;
    type: string;
    selectedFoodTypes?: string[];
    description: string;
    serves?: number | null;
    stockQty: number | string;
    isInStock: boolean;
    variants: ResponsiveVariantItem[];
    schedules: ResponsiveDaySchedule[];
    imageFile?: File | null;
    imageFiles?: File[];
    existingImages?: string[];
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
  initialCategory = "",
  initialSubCategory = "",
  categories = [],
  initialType = "Veg",
  initialSelectedFoodTypes,
  initialDescription = "",
  initialStockQty = "",
  initialIsInStock = true,
  initialVariants = DEFAULT_VARIANTS,
  initialSchedules = DEFAULT_SCHEDULES,
  initialImageUrl,
  initialImages,
  onBack,
  onSave,
}) => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [itemName, setItemName] = useState(initialItemName);
  const [price, setPrice] = useState(initialPrice);
  const [category, setCategory] = useState(() => initialCategory || (categories.length > 0 ? categories[0].name : ""));
  const [subCategory, setSubCategory] = useState(initialSubCategory);
  const [type, setType] = useState(initialType);
  const [selectedFoodTypes, setSelectedFoodTypes] = useState<string[]>(() => {
    if (initialSelectedFoodTypes && initialSelectedFoodTypes.length > 0) {
      return initialSelectedFoodTypes;
    }
    if (initialType) return [initialType];
    return ["Veg"];
  });

  const selectedCategoryObj = categories.find((c) => c.name.toLowerCase() === category.toLowerCase());
  const availableSubCategories = selectedCategoryObj?.subCategories || [];

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
  const [selectedServes, setSelectedServes] = useState<number | null>(() => {
    if (initialDescription) {
      const match = initialDescription.match(/^\(Serves\s*([1-4])\)/i) || initialDescription.match(/^\[Serves:\s*([1-4])\]/i);
      if (match) return Number(match[1]) || null;
    }
    return null;
  });
  const [description, setDescription] = useState(() => {
    if (!initialDescription) return "";
    return initialDescription.replace(/^\(Serves\s*[1-4]\)\s*/i, '').replace(/^\[Serves:\s*[1-4]\]\s*/i, '').trim();
  });
  const [variants, setVariants] = useState<ResponsiveVariantItem[]>(initialVariants);
  const [schedules, setSchedules] = useState<ResponsiveDaySchedule[]>(initialSchedules);
  interface ResponsiveDishPhoto {
    id: string;
    url: string;
    file?: File | null;
    isExisting?: boolean;
    name?: string;
  }
  const [photos, setPhotos] = useState<ResponsiveDishPhoto[]>(() => {
    const list: ResponsiveDishPhoto[] = [];
    if (initialImages) {
      try {
        const parsed = typeof initialImages === "string" ? JSON.parse(initialImages) : initialImages;
        if (Array.isArray(parsed)) {
          parsed.slice(0, 4).forEach((u, i) => {
            if (u && typeof u === "string") {
              list.push({ id: `init-${i}`, url: u, isExisting: true, name: `Photo ${i + 1}` });
            }
          });
        }
      } catch {}
    }
    if (list.length === 0 && initialImageUrl) {
      list.push({ id: "init-0", url: initialImageUrl, isExisting: true, name: "Cover Photo" });
    }
    return list;
  });
  const [previewPhotoIndex, setPreviewPhotoIndex] = useState<number>(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/seller/menu");
    }
  };


  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length >= 4) {
      alert("Maximum 4 photos allowed for food items. Please remove a photo first to upload a new one.");
      e.target.value = "";
      return;
    }

    const availableSlots = 4 - photos.length;
    const fileList = Array.from(files);
    const filesToProcess = fileList.slice(0, availableSlots);
    if (fileList.length > availableSlots) {
      alert(`You can only upload up to 4 photos. Only the first ${availableSlots} photo(s) have been added.`);
    }

    const newPhotos: ResponsiveDishPhoto[] = [];
    for (const file of filesToProcess) {
      if (file.size > 5 * 1024 * 1024) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        alert(`Image "${file.name}" (${sizeMB} MB) exceeds the 5MB upload limit. Please select an image under 5MB.`);
        continue;
      }
      newPhotos.push({
        id: `new-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        url: URL.createObjectURL(file),
        file,
        isExisting: false,
        name: file.name,
      });
    }

    if (newPhotos.length > 0) {
      setPhotos((prev) => [...prev, ...newPhotos].slice(0, 4));
    }
    e.target.value = "";
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target && target.url.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(target.url);
        } catch {}
      }
      const updated = prev.filter((p) => p.id !== id);
      if (previewPhotoIndex >= updated.length) {
        setPreviewPhotoIndex(Math.max(0, updated.length - 1));
      }
      return updated;
    });
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
    setVariants((prev) => [...prev, { id: nextId, name: "", price: "" }]);
  };

  const handleUpdateVariant = (
    id: string,
    field: "name" | "price",
    value: string
  ) => {
    let cleanVal = value;
    if (field === "price") {
      cleanVal = cleanVal.replace(/-/g, "");
    }
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: cleanVal } : v))
    );
  };

  const handleRemoveVariant = (id: string) => {
    setVariants((prev) => prev.filter((v) => v.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!itemName || !itemName.trim()) {
      alert("Item name is required.");
      return;
    }

    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      alert("Please enter a valid price greater than ₹0 (no negative numbers).");
      return;
    }

    // Validate all Add-ons: name and price are mandatory, price must be non-negative
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      const trimmedName = (v.name || "").trim();
      if (!trimmedName) {
        alert(`Add-on #${i + 1} name is required. Please provide a name or remove the add-on.`);
        return;
      }
      if (v.price === "" || v.price === undefined || v.price === null || isNaN(Number(v.price)) || Number(v.price) < 0) {
        alert(`Price for add-on "${trimmedName}" is mandatory and must be ₹0 or greater (negative numbers are not allowed).`);
        return;
      }
    }

    if (!category || !category.trim()) {
      alert("Please select a category.");
      return;
    }

    if (!selectedFoodTypes || selectedFoodTypes.length === 0) {
      alert("Please select at least one food type (Veg, Non-Veg, Vegan, or Jain).");
      return;
    }

    if (!description || !description.trim()) {
      alert("Description is required.");
      return;
    }

    if (photos.length === 0) {
      alert("Dish image is mandatory. Please upload at least one photo (up to 4 photos).");
      return;
    }

    const parsedStock =
      initialStockQty !== undefined && initialStockQty !== null && initialStockQty !== ""
        ? parseInt(String(initialStockQty), 10)
        : NaN;
    const cleanStock = !isNaN(parsedStock) && parsedStock >= 0
      ? parsedStock
      : (initialIsInStock !== false ? 99 : 0);

    const data = {
      itemName,
      price,
      category,
      subCategory,
      type,
      selectedFoodTypes,
      description: (() => {
        const clean = description.replace(/^\(Serves\s*[1-4]\)\s*/i, '').replace(/^\[Serves:\s*[1-4]\]\s*/i, '').trim();
        return selectedServes ? `(Serves ${selectedServes}) ${clean}` : clean;
      })(),
      serves: selectedServes,
      stockQty: cleanStock,
      isInStock: initialIsInStock !== undefined ? initialIsInStock : cleanStock > 0,
      variants,
      schedules,
      imageFile: photos.find(p => p.file)?.file || null,
      imageFiles: photos.filter(p => p.file).map(p => p.file as File),
      existingImages: photos.filter(p => p.isExisting && p.url && !p.url.startsWith("blob:")).map(p => p.url),
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

          <h1 className={styles.headerTitle}>{initialItemName ? "Edit item" : "Add item"}</h1>

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
          {/* 1. Upload Photo Banner (Up to 4 Photos) */}
          <div style={{ marginBottom: "16px" }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg"
              multiple
              className={styles.fileInputHidden}
              onChange={handlePhotoUpload}
            />

            {photos.length === 0 ? (
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
                <div className={styles.cameraCircle}>
                  <Camera size={22} strokeWidth={2.2} />
                </div>
                <span className={styles.uploadTitle}>
                  Upload photos <span style={{ color: "#EF4444" }}>*</span>
                </span>
                <span className={styles.uploadSubtitle}>
                  Supports JPG, PNG up to 5MB (Max 4 photos)
                </span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                    gap: "10px",
                    width: "100%",
                  }}
                >
                  {photos.map((photo, idx) => (
                    <div
                      key={photo.id}
                      style={{
                        position: "relative",
                        width: "100%",
                        paddingTop: "100%",
                        borderRadius: "10px",
                        border: idx === 0 ? "2px solid #F97316" : "1.5px solid #E2E8F0",
                        backgroundColor: "#F8FAFC",
                        overflow: "hidden",
                        boxShadow: "0 2px 5px rgba(0,0,0,0.06)",
                      }}
                    >
                      <img
                        src={photo.url}
                        alt=""
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />

                      {/* Primary / Cover Badge */}
                      {idx === 0 ? (
                        <div
                          style={{
                            position: "absolute",
                            top: "5px",
                            left: "5px",
                            backgroundColor: "#FF5500",
                            color: "#FFFFFF",
                            fontSize: "9px",
                            fontWeight: 700,
                            padding: "2px 5px",
                            borderRadius: "5px",
                            zIndex: 2,
                          }}
                        >
                          ★ Cover
                        </div>
                      ) : (
                        <div
                          style={{
                            position: "absolute",
                            top: "5px",
                            left: "5px",
                            backgroundColor: "rgba(15, 23, 42, 0.72)",
                            backdropFilter: "blur(4px)",
                            color: "#FFFFFF",
                            fontSize: "9px",
                            fontWeight: 600,
                            padding: "2px 5px",
                            borderRadius: "5px",
                            zIndex: 2,
                          }}
                        >
                          #{idx + 1}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div
                        style={{
                          position: "absolute",
                          top: "5px",
                          right: "5px",
                          display: "flex",
                          gap: "3px",
                          zIndex: 3,
                        }}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setPreviewPhotoIndex(idx);
                            setIsPreviewOpen(true);
                          }}
                          style={{
                            width: "22px",
                            height: "22px",
                            borderRadius: "5px",
                            backgroundColor: "rgba(15, 23, 42, 0.75)",
                            color: "#FFFFFF",
                            border: "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          <Eye size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRemovePhoto(photo.id);
                          }}
                          style={{
                            width: "22px",
                            height: "22px",
                            borderRadius: "5px",
                            backgroundColor: "rgba(239, 68, 68, 0.88)",
                            color: "#FFFFFF",
                            border: "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          <X size={11} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add more button */}
                  {photos.length < 4 && (
                    <div
                      onClick={handleTriggerUpload}
                      style={{
                        position: "relative",
                        width: "100%",
                        paddingTop: "100%",
                        borderRadius: "10px",
                        border: "1.5px dashed #CBD5E1",
                        backgroundColor: "#F8FAFC",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px",
                        }}
                      >
                        <div
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            backgroundColor: "#FFEDD5",
                            color: "#F97316",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Plus size={16} strokeWidth={2.4} />
                        </div>
                        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#334155" }}>
                          Add Photo
                        </span>
                        <span style={{ fontSize: "0.65rem", color: "#94A3B8" }}>
                          {photos.length}/4
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <p style={{ margin: 0, fontSize: "0.72rem", color: "#64748B" }}>
                  💡 Upload up to 4 food photos. First photo is used as the cover.
                </p>
              </div>
            )}
          </div>
          {/* 2. Item name */}
          <div className={styles.formGroup}>
            <label className={styles.fieldLabel} htmlFor="itemNameInput">
              Item name <span style={{ color: "#EF4444" }}>*</span>
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
              Price <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <div className={styles.priceInputWrapper}>
              <span className={styles.pricePrefix}>₹</span>
              <input
                id="priceInput"
                type="number"
                min="0"
                step="any"
                className={`${styles.textInput} ${styles.priceInput}`}
                value={price}
                onChange={(e) => {
                  const clean = e.target.value.replace(/-/g, "");
                  setPrice(clean);
                }}
                onKeyDown={(e) => {
                  if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
                    e.preventDefault();
                  }
                }}
                placeholder="450"
                required
              />
            </div>
          </div>

          {/* 4. Category */}
          <div className={styles.formGroup}>
            <label className={styles.fieldLabel} htmlFor="categorySelect">
              Category <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <div className={styles.selectWrapper}>
              <select
                id="categorySelect"
                className={styles.selectInput}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.length === 0 ? (
                  <option value="">No categories available</option>
                ) : (
                  <>
                    {!category && <option value="">Select a category</option>}
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </>
                )}
              </select>
              <ChevronDown size={18} className={styles.selectArrow} />
            </div>
          </div>

          {/* Sub-Category (if available for selected Category) */}
          {availableSubCategories && availableSubCategories.length > 0 && (
            <div className={styles.formGroup}>
              <label className={styles.fieldLabel} htmlFor="subCategorySelect">
                Sub-Category <span style={{ fontSize: "0.8rem", color: "#64748B", fontWeight: "normal" }}>(Optional)</span>
              </label>
              <div className={styles.selectWrapper}>
                <select
                  id="subCategorySelect"
                  className={styles.selectInput}
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                >
                  <option value="">Select a sub-category (optional)</option>
                  {availableSubCategories.map((sc) => (
                    <option key={sc.id} value={sc.name}>
                      {sc.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} className={styles.selectArrow} />
              </div>
            </div>
          )}

          {/* 5. Food Type Multi-Select */}
          <div className={styles.formGroup}>
            <label className={styles.fieldLabel}>
              Food Type <span style={{ color: "#EF4444" }}>*</span>{" "}
              <span style={{ fontSize: "0.8rem", color: "#64748B", fontWeight: "normal" }}>(Multi-Select)</span>
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

          {/* 6. Description */}
          <div className={styles.formGroup}>
            <label className={styles.fieldLabel} htmlFor="descInput">
              Description <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <textarea
              id="descInput"
              className={styles.textAreaInput}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Rich and creamy tomato-based curry with succulent chicken tandoori pieces cooked in butter and aromatic spices."
              required
            />
          </div>

          {/* Serves (Portion Size: 1, 2, 3, 4 - Optional) */}
          <div className={styles.formGroup}>
            <label className={styles.fieldLabel}>
              Serves (Portion Size) <span style={{ fontSize: "0.82rem", color: "#64748B", fontWeight: "normal" }}>(Optional)</span>
            </label>
            <div className={styles.servesGrid}>
              {[
                { value: 1, label: "Serves 1", icon: <User size={15} strokeWidth={2.4} /> },
                { value: 2, label: "Serves 2", icon: <Users size={15} strokeWidth={2.4} /> },
                { value: 3, label: "Serves 3", icon: <Users size={15} strokeWidth={2.4} /> },
                { value: 4, label: "Serves 4", icon: <Users size={15} strokeWidth={2.4} /> },
              ].map((item) => {
                const isSelected = selectedServes === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setSelectedServes(selectedServes === item.value ? null : item.value)}
                    className={`${styles.servesBtn} ${isSelected ? styles.servesBtnActive : ""}`}
                  >
                    <span className={styles.servesIcon}>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 7. Dish Add-Ons */}
          <div className={styles.formGroup}>
            <h2 className={styles.sectionTitle}>
              Dish Add-Ons <span style={{ fontSize: "0.85rem", fontWeight: "normal", color: "#64748B" }}>(Optional add-ons with extra price)</span>
            </h2>
            <div className={styles.variantsList}>
              {variants.map((variant) => (
                <div key={variant.id} className={styles.variantRow}>
                  <input
                    type="text"
                    className={styles.variantNameInput}
                    value={variant.name}
                    placeholder="Add-on name (e.g. Dahi, Extra Butter) *"
                    required
                    onChange={(e) =>
                      handleUpdateVariant(variant.id, "name", e.target.value)
                    }
                  />
                  <div className={styles.variantPriceWrapper}>
                    <span className={styles.variantPricePrefix}>
                      <span className={styles.variantPlus}>+</span>
                      <span className={styles.variantCurrency}>₹</span>
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className={styles.variantPriceInput}
                      value={variant.price}
                      placeholder="Price *"
                      required
                      onChange={(e) =>
                        handleUpdateVariant(variant.id, "price", e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
                          e.preventDefault();
                        }
                      }}
                      aria-label="Add-on price"
                    />
                  </div>
                  <button
                    type="button"
                    className={styles.deleteVariantBtn}
                    onClick={() => handleRemoveVariant(variant.id)}
                    aria-label={`Delete ${variant.name || "add-on"}`}
                    title="Remove add-on"
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
                <span>Add Add-on</span>
              </button>
            </div>
          </div>

          {/* Bottom Action: Save / Update item */}
          <button type="submit" className={styles.saveButton}>
            {initialItemName ? "Update item" : "Save item"}
          </button>
        </form>
      </div>
      {/* Multi-Photo Dish Image Preview Modal */}
      {isPreviewOpen && photos.length > 0 && photos[previewPhotoIndex] && (
        <div
          className={styles.previewModalOverlay}
          onClick={() => setIsPreviewOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={styles.previewModalCard}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.previewModalHeader}>
              <div className={styles.previewModalHeaderLeft}>
                <div className={styles.previewIconSquircle}>
                  <Utensils size={18} className={styles.previewHeaderIcon} />
                </div>
                <div className={styles.previewHeaderTextGroup}>
                  <h3 className={styles.previewModalTitle}>
                    {itemName ? `${itemName} (${previewPhotoIndex + 1}/${photos.length})` : `Photo ${previewPhotoIndex + 1}/${photos.length}`}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsPreviewOpen(false)}
                title="Close preview"
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.previewModalBody}>
              <div className={styles.imageContainer}>
                <img
                  src={photos[previewPhotoIndex].url}
                  alt={itemName || "Dish Photo"}
                  className={styles.previewModalImg}
                />
              </div>

              {photos.length > 1 && (
                <div
                  style={{
                    display: "flex",
                    gap: "6px",
                    marginTop: "10px",
                    justifyContent: "center",
                  }}
                >
                  {photos.map((p, pIdx) => (
                    <div
                      key={p.id}
                      onClick={() => setPreviewPhotoIndex(pIdx)}
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "6px",
                        border: pIdx === previewPhotoIndex ? "2px solid #F97316" : "1.5px solid #CBD5E1",
                        overflow: "hidden",
                        cursor: "pointer",
                        opacity: pIdx === previewPhotoIndex ? 1 : 0.6,
                      }}
                    >
                      <img
                        src={p.url}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.previewModalFooter}>
              <button
                type="button"
                className={styles.modalCloseFooterBtn}
                onClick={() => setIsPreviewOpen(false)}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResponsiveMenuItems;

