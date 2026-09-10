"use client";

import React, { useState } from "react";
import Image, { StaticImageData } from "next/image";
import { Star, Plus, Minus } from "lucide-react";
import { useCart } from "@/context/CartContext";
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
  title: string;
  description: string;
  rating: string;
  price: string;
  image: StaticImageData | string;
  category?: string;
  isVeg?: boolean;
}

const DEFAULT_FOOD_ITEMS: FoodCardItem[] = [
  {
    id: "item-1",
    title: "Margherita Pizza",
    description: "Fresh mozzarella, classic tomato sauce, fresh basil, and extra virgin olive oil.",
    rating: "4.8",
    price: "₹289",
    image: img1,
  },
  {
    id: "item-2",
    title: "Margherita Pizza",
    description: "Fresh mozzarella, classic tomato sauce, fresh basil, and extra virgin olive oil.",
    rating: "4.8",
    price: "₹289",
    image: img2,
  },
  {
    id: "item-3",
    title: "Margherita Pizza",
    description: "Fresh mozzarella, classic tomato sauce, fresh basil, and extra virgin olive oil.",
    rating: "4.8",
    price: "₹289",
    image: img2,
  },
  {
    id: "item-4",
    title: "Margherita Pizza",
    description: "Fresh mozzarella, classic tomato sauce, fresh basil, and extra virgin olive oil.",
    rating: "4.8",
    price: "₹289",
    image: img3,
  },
  {
    id: "item-5",
    title: "Margherita Pizza",
    description: "Fresh mozzarella, classic tomato sauce, fresh basil, and extra virgin olive oil.",
    rating: "4.8",
    price: "₹289",
    image: img4,
  },
  {
    id: "item-6",
    title: "Margherita Pizza",
    description: "Fresh mozzarella, classic tomato sauce, fresh basil, and extra virgin olive oil.",
    rating: "4.8",
    price: "₹289",
    image: img4,
  },
  {
    id: "item-7",
    title: "Margherita Pizza",
    description: "Fresh mozzarella, classic tomato sauce, fresh basil, and extra virgin olive oil.",
    rating: "4.8",
    price: "₹289",
    image: img5,
  },
  {
    id: "item-8",
    title: "Margherita Pizza",
    description: "Fresh mozzarella, classic tomato sauce, fresh basil, and extra virgin olive oil.",
    rating: "4.8",
    price: "₹289",
    image: img5,
  },
  {
    id: "item-9",
    title: "Margherita Pizza",
    description: "Fresh mozzarella, classic tomato sauce, fresh basil, and extra virgin olive oil.",
    rating: "4.8",
    price: "₹289",
    image: img6,
  },
];

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
  heading = "Popular Pizzas & Sides",
  categories = CATEGORIES,
  defaultActiveCategory = "Pizza",
  items = DEFAULT_FOOD_ITEMS,
  onCategoryChange,
  onAddItem,
  onDecreaseItem,
}) => {
  const { cartItems, addToCart, decreaseQuantity } = useCart();
  const [activeCategory, setActiveCategory] = useState<string>(
    defaultActiveCategory
  );

  const getItemQuantity = (itemId: string) => {
    const found = cartItems.find((ci) => ci.id === itemId);
    return found ? found.quantity : 0;
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
    } else {
      addToCart({
        id: item.id,
        name: item.title,
        price: parseFloat(item.price.replace(/[^0-9.]/g, "")) || 199,
        quantity: 1,
        sellerId: "seller",
        sellerName: "Kitchen",
      });
    }
  };

  const handleDecreaseClick = (itemId: string) => {
    if (onDecreaseItem) {
      onDecreaseItem(itemId);
    } else {
      decreaseQuantity(itemId);
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

      {/* 3. 3-Column x 3-Row Food Card Grid */}
      <div className={styles.foodGrid} role="region" aria-label="Food Items Grid">
        {displayedList.map((item) => (
          <article key={item.id} className={styles.foodCard}>
            {/* Square Food Image */}
            <div className={styles.imageWrapper}>
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
              </div>

              {/* Price & Add / Quantity Stepper Button */}
              <div className={styles.cardBottomRow}>
                <span className={styles.priceText}>{item.price}</span>
                {getItemQuantity(item.id) === 0 ? (
                  <button
                    type="button"
                    className={styles.addBtn}
                    onClick={() => handleAddClick(item)}
                    aria-label={`Add ${item.title} to order`}
                  >
                    Add +
                  </button>
                ) : (
                  <div className={styles.stepperContainer} role="group" aria-label={`Quantity controls for ${item.title}`}>
                    <button
                      type="button"
                      className={styles.stepperBtn}
                      onClick={() => handleDecreaseClick(item.id)}
                      aria-label="Decrease quantity"
                    >
                      <Minus size={13} strokeWidth={2.5} />
                    </button>
                    <span className={styles.stepperCount}>{getItemQuantity(item.id)}</span>
                    <button
                      type="button"
                      className={styles.stepperBtn}
                      onClick={() => handleAddClick(item)}
                      aria-label="Increase quantity"
                    >
                      <Plus size={13} strokeWidth={2.5} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default PopularFood;
