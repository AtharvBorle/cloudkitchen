"use client";

import React, { useState } from "react";
import styles from "./OrdersHeader.module.css";

export const ORDER_CATEGORIES = [
  "All",
  "Food",
  "Mess",
  "Bakery",
  "Home Meals",
  "Rooms",
] as const;

export interface OrdersHeaderProps {
  title?: string;
  categories?: readonly string[];
  defaultCategory?: string;
  onCategoryChange?: (category: string) => void;
}

export const OrdersHeader: React.FC<OrdersHeaderProps> = ({
  title = "My Orders",
  categories = ORDER_CATEGORIES,
  defaultCategory = "All",
  onCategoryChange,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>(defaultCategory);

  const handleCategoryClick = (cat: string) => {
    setActiveCategory(cat);
    if (onCategoryChange) {
      onCategoryChange(cat);
    }
  };

  return (
    <div className={styles.headerContainer}>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.filtersRow} role="tablist" aria-label="Order Categories">
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`${styles.filterBtn} ${
                isActive ? styles.activeFilterBtn : ""
              }`}
              onClick={() => handleCategoryClick(cat)}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default OrdersHeader;
