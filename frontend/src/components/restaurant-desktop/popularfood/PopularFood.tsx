"use client";

import React, { useState } from "react";
import Image, { StaticImageData } from "next/image";
import { Star, Plus, Minus } from "lucide-react";
import { useCart } from "@/context/CartContext";
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
}

export interface PopularFoodProps {
  heading?: string;
  categories?: readonly string[];
  defaultActiveCategory?: string;
  items?: FoodCardItem[];
  onCategoryChange?: (category: string) => void;
  onAddItem?: (item: FoodCardItem) => void;
  onDecreaseItem?: (itemId: string) => void;
}

export const PopularFood: React.FC<PopularFoodProps> = ({
  heading = "Popular Dishes & Items",
  categories = CATEGORIES,
  defaultActiveCategory = "Popular",
  items = [],
  onCategoryChange,
  onAddItem,
  onDecreaseItem,
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

  const displayedList = filteredItems.length > 0 ? filteredItems : items;

  return (
    <section
      className={styles.sectionContainer}
      aria-label={heading}
    >
      {/* 1. Section Heading */}
      <h2 className={styles.heading}>{heading}</h2>

      {/* 2. Category Tabs */}
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

      {/* 3. Food Card Grid or Empty State */}
      {displayedList.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 24px", backgroundColor: "#FFFFFF", borderRadius: "18px", border: "1px dashed #E2E8F0" }}>
          <p style={{ margin: 0, fontSize: "1rem", color: "#64748B", fontWeight: "600" }}>
            No food items currently available in this category.
          </p>
        </div>
      ) : (
        <div className={styles.foodGrid} role="region" aria-label="Food Items Grid">
          {displayedList.map((item) => (
            <article key={item.id} className={styles.foodCard}>
              {/* Square Food Image */}
              <div className={styles.imageWrapper}>
                <div style={{ position: "absolute", top: "6px", left: "6px", zIndex: 2 }}>
                  <DietaryTag isVeg={item.isVeg !== false} size="xs" />
                </div>
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="110px"
                  unoptimized={typeof item.image === "string"}
                  className={styles.foodImg}
                />
              </div>

              {/* Food Information */}
              <div className={styles.cardContent}>
                <div>
                  <div className={styles.cardTopRow}>
                    <h3 className={styles.foodTitle} title={item.title}>
                      {item.title}
                    </h3>
                    <span className={styles.ratingBadge}>
                      <Star size={11} fill="#16a34a" color="#16a34a" />
                      <span>{item.rating}</span>
                    </span>
                  </div>

                  <p className={styles.foodDescription} title={item.description}>
                    {item.description}
                  </p>

                  {item.addons && item.addons.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", margin: "4px 0 6px 0" }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: "700", color: "#EA580C", backgroundColor: "#FFF7ED", border: "1px solid #FFEDD5", padding: "2px 6px", borderRadius: "5px" }}>
                        ✨ {item.addons.length} Add-on{item.addons.length > 1 ? "s" : ""} Available
                      </span>
                    </div>
                  )}
                </div>

                {/* Price & Add / Quantity Stepper Button */}
                <div className={styles.cardBottomRow}>
                  <span className={styles.priceText}>{item.price}</span>
                  {(() => {
                    const currentQty = getItemQuantity(item.id);
                    const rawStock = item.maxStock !== undefined ? item.maxStock : item.stockQuantity;
                    const stockLimit = rawStock !== undefined && rawStock !== null && !isNaN(Number(rawStock)) ? Number(rawStock) : -1;
                    const isAtMaxStock = stockLimit !== -1 && currentQty >= stockLimit;
                    const isOutOfStock = stockLimit === 0;

                    if (currentQty === 0) {
                      return (
                        <button
                          type="button"
                          className={styles.addBtn}
                          onClick={() => handleAddClick(item)}
                          aria-label={`Add ${item.title} to order`}
                          disabled={isOutOfStock}
                          style={{
                            opacity: isOutOfStock ? 0.5 : 1,
                            cursor: isOutOfStock ? "not-allowed" : "pointer",
                          }}
                        >
                          {isOutOfStock ? "Out of Stock" : item.addons && item.addons.length > 0 ? "Add +" : "Add +"}
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
          ))}
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

            const addonKey = selectedAddons.length > 0 ? selectedAddons.map(a => a.id).sort().join("_") : "";
            const cartItemId = addonKey ? `${modalItem.id}_${addonKey}` : modalItem.id;

            addToCart({
              id: cartItemId,
              foodItemId: modalItem.foodItemId || modalItem.id,
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
