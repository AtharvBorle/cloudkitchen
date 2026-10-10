"use client";

import React, { useState } from "react";
import Image, { StaticImageData } from "next/image";
import { Star, Plus, Minus, Utensils } from "lucide-react";
import { useCart, generateCartItemId } from "@/context/CartContext";
import { DietaryTag } from "@/components/common/DietaryTag";
import { AddonCustomizationModal } from "@/components/cart/AddonCustomizationModal";
import styles from "./PopularFood.module.css";

import img1 from "./pizza-margherita-classic.jpg";
import img2 from "./pizza-gourmet-table.jpg";
import img3 from "./pizza-slice-popart.jpg";
import img4 from "./pizza-bbq-paneer.jpg";
import img5 from "./pizza-rustic-slices.jpg";
import img6 from "./pizza-spinach-ricotta.jpg";

export const CATEGORIES = [
  "Popular",
  "Pizza",
  "Sides",
  "Drinks",
  "Desserts",
] as const;

export type CategoryType = (typeof CATEGORIES)[number];

export interface FoodCardItem {
  id: string;
  foodItemId?: string;
  title: string;
  description: string;
  rating: string;
  price: string;
  image: StaticImageData | string;
  category?: string;
  isVeg?: boolean;
  addons?: Array<{ id: string; name: string; price: number }>;
  stockQuantity?: number;
  maxStock?: number;
  itemType?: string;
  sellerId?: string;
  sellerName?: string;
  isAvailable?: boolean;
}

export interface PopularFoodProps {
  heading?: string;
  categories?: readonly string[];
  defaultActiveCategory?: string;
  items?: FoodCardItem[];
  isOnline?: boolean;
  isLoading?: boolean;
  onCategoryChange?: (category: string) => void;
  onAddItem?: (item: FoodCardItem) => void;
  onDecreaseItem?: (itemId: string) => void;
  onResetFilters?: () => void;
}

export const PopularFood: React.FC<PopularFoodProps> = ({
  heading = "Popular Dishes & Items",
  categories = CATEGORIES,
  defaultActiveCategory = "Popular",
  items = [],
  isOnline = true,
  isLoading = false,
  onCategoryChange,
  onAddItem,
  onDecreaseItem,
  onResetFilters,
}) => {
  const { cartItems, addToCart, decreaseQuantity } = useCart();
  const [activeCategory, setActiveCategory] = useState<string>(
    defaultActiveCategory
  );
  const [modalItem, setModalItem] = useState<FoodCardItem | null>(null);

  const getItemQuantity = (itemId: string) => {
    const matching = cartItems.filter((ci) => ci.id === itemId || ci.foodItemId === itemId);
    return matching.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleTabClick = (category: string) => {
    setActiveCategory(category);
    if (onCategoryChange) {
      onCategoryChange(category);
    }
  };

  const handleAddClick = (item: FoodCardItem) => {
    if (onAddItem) {
      onAddItem(item);
      return;
    }

    if (item.addons && item.addons.length > 0) {
      setModalItem(item);
      return;
    }

    const itemImg = typeof item.image === "string" ? item.image : (item.image as any)?.src || "";
    const rawStock = item.maxStock !== undefined ? item.maxStock : item.stockQuantity;
    const stockLimit = rawStock !== undefined && rawStock !== null && !isNaN(Number(rawStock)) ? Number(rawStock) : -1;

    addToCart({
      id: item.id,
      foodItemId: item.foodItemId || item.id,
      name: item.title,
      price: parseFloat(item.price.replace(/[^0-9.]/g, "")) || 199,
      basePrice: parseFloat(item.price.replace(/[^0-9.]/g, "")) || 199,
      addonsTotal: 0,
      selectedAddons: [],
      quantity: 1,
      sellerId: item.sellerId || "seller",
      sellerName: item.sellerName || "Kitchen",
      image: itemImg,
      imageUrl: itemImg,
      stockQuantity: stockLimit,
      maxStock: stockLimit,
      itemType: item.itemType,
      categoryId: (item as any).categoryId,
      foodCategoryId: (item as any).foodCategoryId,
      category: (item as any).category,
      foodCategory: (item as any).foodCategory,
      categoryName: (item as any).categoryName || (item as any).category?.name || (item as any).foodCategory?.name,
      addons: item.addons,
    });
  };

  const handleDecreaseClick = (itemId: string) => {
    if (onDecreaseItem) {
      onDecreaseItem(itemId);
    } else {
      const found = cartItems.find((ci) => ci.id === itemId || ci.foodItemId === itemId);
      if (found) {
        decreaseQuantity(found.id);
      } else {
        decreaseQuantity(itemId);
      }
    }
  };

  const filteredItems =
    activeCategory === "Popular" || activeCategory === "All"
      ? items
      : items.filter(
          (it) => it.category?.toLowerCase() === activeCategory.toLowerCase()
        );

  const displayedList = filteredItems;

  return (
    <section
      className={styles.sectionContainer}
      aria-label={heading}
    >
      {/* 1. Section Heading */}
      <h2 className={styles.heading}>{heading}</h2>

      {/* 2. Category Tabs */}
      {items.length > 0 && categories.length > 0 && (
        <div className={styles.tabsRow} role="tablist" aria-label="Food Categories">
          {categories.map((category) => {
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`${styles.tabBtn} ${
                  isActive ? styles.tabBtnActive : ""
                }`}
                onClick={() => handleTabClick(category)}
              >
                {category}
              </button>
            );
          })}
        </div>
      )}

      {/* 3. Food Card Grid or Empty State */}
      {isLoading ? (
        <div className={styles.foodGrid} role="region" aria-label="Loading Dishes">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={`dish-skeleton-${i}`} className={styles.foodCard} style={{ pointerEvents: "none" }}>
              <div
                className={styles.skeletonPulse}
                style={{ width: "100px", height: "100px", borderRadius: "10px", flexShrink: 0 }}
              />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: 0 }}>
                <div>
                  <div className={styles.skeletonPulse} style={{ width: "70%", height: "18px", borderRadius: "6px", marginBottom: "8px" }} />
                  <div className={styles.skeletonPulse} style={{ width: "90%", height: "12px", borderRadius: "4px", marginBottom: "6px" }} />
                  <div className={styles.skeletonPulse} style={{ width: "50%", height: "12px", borderRadius: "4px" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
                  <div className={styles.skeletonPulse} style={{ width: "55px", height: "18px", borderRadius: "4px" }} />
                  <div className={styles.skeletonPulse} style={{ width: "75px", height: "32px", borderRadius: "8px" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : displayedList.length === 0 ? (
        <div style={{ textAlign: "center", padding: "56px 24px", backgroundColor: "#FFFFFF", borderRadius: "18px", border: "1px dashed #E2E8F0", margin: "16px 0" }}>
          <Utensils size={40} color="#94A3B8" style={{ margin: "0 auto 12px", display: "block" }} />
          <h3 style={{ margin: "0 0 6px", fontSize: "1.15rem", color: "#1E293B", fontWeight: "700" }}>
            No dishes available.
          </h3>
          <p style={{ margin: "0 0 16px", fontSize: "0.92rem", color: "#64748B" }}>
            {items.length === 0
              ? "No dishes found matching your current filter preferences."
              : "No food items currently available in this category."}
          </p>
          {items.length === 0 && onResetFilters ? (
            <button
              type="button"
              onClick={onResetFilters}
              style={{
                backgroundColor: "#FE5000",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "10px",
                padding: "8px 20px",
                fontWeight: "700",
                fontSize: "0.88rem",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(254, 80, 0, 0.2)",
              }}
            >
              Show All Dishes
            </button>
          ) : activeCategory !== "All" && activeCategory !== "Popular" ? (
            <button
              type="button"
              onClick={() => handleTabClick("All")}
              style={{
                backgroundColor: "#FE5000",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "10px",
                padding: "8px 20px",
                fontWeight: "700",
                fontSize: "0.88rem",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(254, 80, 0, 0.2)",
              }}
            >
              View All Categories
            </button>
          ) : null}
        </div>
      ) : (
        <div className={styles.foodGrid} role="region" aria-label="Food Items Grid">
          {displayedList.map((item) => {
            const rawStock = item.maxStock !== undefined ? item.maxStock : item.stockQuantity;
            const stockLimit = rawStock !== undefined && rawStock !== null && !isNaN(Number(rawStock)) ? Number(rawStock) : -1;
            const isOutOfStock = stockLimit === 0;
            const isItemDisabled = item.isAvailable === false || isOutOfStock;
            const isGrey = !isOnline || isItemDisabled;

            return (
            <article
              key={item.id}
              className={styles.foodCard}
              style={{
                backgroundColor: isGrey ? "#F8FAFC" : undefined,
                opacity: isGrey ? 0.85 : 1,
                borderColor: isGrey ? "#E2E8F0" : undefined,
              }}
            >
              {/* Square Food Image */}
              <div className={styles.imageWrapper}>
                <div style={{ position: "absolute", top: "6px", left: "6px", zIndex: 2 }}>
                  <DietaryTag isVeg={item.isVeg !== false} itemType={(item as any).itemType} size="xs" />
                </div>
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="110px"
                  unoptimized={typeof item.image === "string"}
                  className={styles.foodImg}
                  style={{
                    filter: isGrey ? "grayscale(100%)" : "none",
                  }}
                />
                {isGrey && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: "rgba(15, 23, 42, 0.4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 3,
                    }}
                  >
                    <span
                      style={{
                        backgroundColor: "#0F172A",
                        color: "#FFFFFF",
                        fontSize: "9px",
                        fontWeight: "800",
                        letterSpacing: "0.6px",
                        padding: "3px 8px",
                        borderRadius: "10px",
                        textTransform: "uppercase",
                      }}
                    >
                      {!isOnline ? "CLOSED" : isOutOfStock ? "OUT OF STOCK" : "UNAVAILABLE"}
                    </span>
                  </div>
                )}
              </div>

              {/* Food Information */}
              <div className={styles.cardContent}>
                <div>
                  <div className={styles.cardTopRow}>
                    <h3 className={styles.foodTitle} title={item.title} style={{ color: isGrey ? "#64748B" : undefined }}>
                      {item.title}
                    </h3>
                    {(() => {
                      const isNew = !item.rating || item.rating === "New" || item.rating === "0" || item.rating === "0.0";
                      const itemRatingNum = parseFloat(String(item.rating || "0")) || 0;
                      const hasRating = !isNew && itemRatingNum > 0;
                      const displayRating = hasRating ? itemRatingNum.toFixed(1) : "New";

                      return (
                        <span
                          className={styles.ratingBadge}
                          style={{
                            backgroundColor: isGrey ? "#F1F5F9" : (hasRating ? "#DCFCE7" : "#F1F5F9"),
                            color: isGrey ? "#94A3B8" : (hasRating ? "#15803D" : "#64748B"),
                            borderColor: isGrey ? "#E2E8F0" : (hasRating ? "#BBF7D0" : "#E2E8F0"),
                          }}
                        >
                          <Star
                            size={11}
                            fill={isGrey ? "#94A3B8" : (hasRating ? "#16a34a" : "#94A3B8")}
                            color={isGrey ? "#94A3B8" : (hasRating ? "#16a34a" : "#94A3B8")}
                          />
                          <span>{displayRating}</span>
                        </span>
                      );
                    })()}
                  </div>

                  <p className={styles.foodDescription} title={item.description}>
                    {item.description}
                  </p>

                  {item.addons && item.addons.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", margin: "4px 0 6px 0" }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: "700", color: isGrey ? "#94A3B8" : "#EA580C", backgroundColor: isGrey ? "#F1F5F9" : "#FFF7ED", border: `1px solid ${isGrey ? "#E2E8F0" : "#FFEDD5"}`, padding: "2px 6px", borderRadius: "5px" }}>
                        ✨ {item.addons.length} Add-on{item.addons.length > 1 ? "s" : ""} Available
                      </span>
                    </div>
                  )}
                </div>

                {/* Price & Add / Quantity Stepper Button */}
                <div className={styles.cardBottomRow}>
                  <span className={styles.priceText} style={{ color: isGrey ? "#94A3B8" : undefined }}>{item.price}</span>
                  {!isOnline ? (
                    <button
                      type="button"
                      className={styles.addBtn}
                      disabled
                      style={{
                        backgroundColor: "#F1F5F9",
                        color: "#94A3B8",
                        border: "1px solid #E2E8F0",
                        cursor: "not-allowed",
                        fontWeight: "700",
                        opacity: 0.8,
                      }}
                    >
                      Closed
                    </button>
                  ) : item.isAvailable === false ? (
                    <button
                      type="button"
                      className={styles.addBtn}
                      disabled
                      style={{
                        backgroundColor: "#F1F5F9",
                        color: "#94A3B8",
                        border: "1px solid #E2E8F0",
                        cursor: "not-allowed",
                        fontWeight: "700",
                        opacity: 0.8,
                      }}
                    >
                      Out of Stock
                    </button>
                  ) : (() => {
                    const currentQty = getItemQuantity(item.id);
                    const isAtMaxStock = stockLimit !== -1 && currentQty >= stockLimit;

                    if (currentQty === 0) {
                      return (
                        <button
                          type="button"
                          className={styles.addBtn}
                          onClick={() => handleAddClick(item)}
                          aria-label={`Add ${item.title} to order`}
                          disabled={isOutOfStock}
                          style={{
                            backgroundColor: isOutOfStock ? "#F1F5F9" : undefined,
                            color: isOutOfStock ? "#94A3B8" : undefined,
                            border: isOutOfStock ? "1px solid #E2E8F0" : undefined,
                            opacity: isOutOfStock ? 0.8 : 1,
                            cursor: isOutOfStock ? "not-allowed" : "pointer",
                            fontWeight: isOutOfStock ? "700" : undefined,
                          }}
                        >
                          {isOutOfStock ? "Out of Stock" : "Add +"}
                        </button>
                      );
                    }

                    return (
                      <div className={styles.stepperContainer} role="group" aria-label={`Quantity controls for ${item.title}`}>
                        <button
                          type="button"
                          className={styles.stepperBtn}
                          onClick={() => handleDecreaseClick(item.id)}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={13} strokeWidth={2.5} />
                        </button>
                        <span className={styles.stepperCount}>{currentQty}</span>
                        <button
                          type="button"
                          className={styles.stepperBtn}
                          onClick={() => handleAddClick(item)}
                          aria-label="Increase quantity"
                          disabled={isAtMaxStock}
                          style={{
                            opacity: isAtMaxStock ? 0.35 : 1,
                            cursor: isAtMaxStock ? "not-allowed" : "pointer",
                          }}
                        >
                          <Plus size={13} strokeWidth={2.5} />
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </article>
            );
          })}
        </div>
      )}

      {modalItem && (
        <AddonCustomizationModal
          isOpen={!!modalItem}
          onClose={() => setModalItem(null)}
          item={{
            id: modalItem.id,
            name: modalItem.title,
            price: parseFloat(modalItem.price.replace(/[^0-9.]/g, "")) || 0,
            description: modalItem.description,
            imageUrl: typeof modalItem.image === "string" ? modalItem.image : (modalItem.image as any)?.src || "",
            itemType: modalItem.itemType,
            isVeg: modalItem.isVeg,
            addons: modalItem.addons || [],
          }}
          onAddToCart={(selectedAddons, quantity) => {
            const base = parseFloat(modalItem.price.replace(/[^0-9.]/g, "")) || 0;
            const addonsTotal = selectedAddons.reduce((sum, a) => sum + (a.price || 0), 0);
            const unitPrice = base + addonsTotal;
            const rawStock = modalItem.maxStock !== undefined ? modalItem.maxStock : modalItem.stockQuantity;
            const stockLimit = rawStock !== undefined && rawStock !== null && !isNaN(Number(rawStock)) ? Number(rawStock) : -1;
            const itemImg = typeof modalItem.image === "string" ? modalItem.image : (modalItem.image as any)?.src || "";

            const baseFoodId = modalItem.foodItemId || modalItem.id;
            const cartItemId = generateCartItemId(baseFoodId, selectedAddons);

            addToCart({
              id: cartItemId,
              foodItemId: baseFoodId,
              name: modalItem.title,
              price: unitPrice,
              basePrice: base,
              addonsTotal: addonsTotal,
              selectedAddons: selectedAddons,
              quantity: quantity || 1,
              sellerId: modalItem.sellerId || "seller",
              sellerName: modalItem.sellerName || "Kitchen",
              image: itemImg,
              imageUrl: itemImg,
              stockQuantity: stockLimit,
              maxStock: stockLimit,
              itemType: modalItem.itemType,
              categoryId: (modalItem as any).categoryId,
              foodCategoryId: (modalItem as any).foodCategoryId,
              category: (modalItem as any).category,
              foodCategory: (modalItem as any).foodCategory,
              categoryName: (modalItem as any).categoryName || (modalItem as any).category?.name || (modalItem as any).foodCategory?.name,
              addons: modalItem.addons,
            });
            setModalItem(null);
          }}
        />
      )}
    </section>
  );
};

export default PopularFood;
