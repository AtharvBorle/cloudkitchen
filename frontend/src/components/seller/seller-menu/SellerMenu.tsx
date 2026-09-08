"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, SquarePen, Sparkles } from "lucide-react";
import ConsoleSidebar from "../sidebar/Sidebar";
import Topbar from "../nav/Topbar";
import styles from "./SellerMenu.module.css";

export type MenuCategoryFilter =
  | "All Items"
  | "Veg Only"
  | "Non-Veg"
  | "Desserts"
  | "Beverages";

export interface DishItem {
  id: string;
  name: string;
  category: string;
  price: string;
  type: "VEG" | "NON-VEG";
  stockQty: number;
  inStock: boolean;
}

const DEFAULT_DISHES: DishItem[] = [
  {
    id: "1",
    name: "Special Butter Chicken",
    category: "North Indian",
    price: "₹380",
    type: "NON-VEG",
    stockQty: 24,
    inStock: true,
  },
  {
    id: "2",
    name: "Veg Hakka Noodles",
    category: "Chinese",
    price: "₹220",
    type: "VEG",
    stockQty: 18,
    inStock: true,
  },
  {
    id: "3",
    name: "Paneer Butter Masala",
    category: "North Indian",
    price: "₹310",
    type: "VEG",
    stockQty: 32,
    inStock: true,
  },
  {
    id: "4",
    name: "Double Cheese Margherita Pizza",
    category: "Italian",
    price: "₹350",
    type: "VEG",
    stockQty: 0,
    inStock: false,
  },
  {
    id: "5",
    name: "Moong Dal Halwa",
    category: "Desserts",
    price: "₹150",
    type: "VEG",
    stockQty: 4,
    inStock: true,
  },
  {
    id: "6",
    name: "Spicy Chilli Chicken",
    category: "Chinese",
    price: "₹290",
    type: "NON-VEG",
    stockQty: 12,
    inStock: true,
  },
];

export interface SellerMenuProps {
  ownerName?: string;
  partnerRole?: string;
  avatarInitials?: string;
  storeTimings?: string;
  operationalPincodes?: string;
  initialIsOpen?: boolean;
  dishes?: DishItem[];
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
  onAddNewDish?: () => void;
  onToggleStore?: (isOpen: boolean) => void;
}

export const SellerMenu: React.FC<SellerMenuProps> = ({
  ownerName = "John Doe",
  partnerRole = "Neo Cloud Partner",
  avatarInitials = "JD",
  storeTimings = "07:00 AM - 11:30 PM",
  operationalPincodes = "110001, 110022, 110045",
  initialIsOpen = true,
  dishes = DEFAULT_DISHES,
  onSearch,
  onNotificationClick,
  onAddNewDish,
  onToggleStore,
}) => {
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [selectedCategory, setSelectedCategory] = useState<MenuCategoryFilter>("All Items");
  const [searchQuery, setSearchQuery] = useState("");
  const [dishList, setDishList] = useState<DishItem[]>(dishes);

  const categories: MenuCategoryFilter[] = [
    "All Items",
    "Veg Only",
    "Non-Veg",
    "Desserts",
    "Beverages",
  ];

  const handleToggleStore = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (onToggleStore) onToggleStore(newState);
  };

  const handleToggleDishStock = (id: string) => {
    setDishList((prev) =>
      prev.map((dish) =>
        dish.id === id ? { ...dish, inStock: !dish.inStock } : dish
      )
    );
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  // Filter Dishes by Category and Search
  const filteredDishes = dishList.filter((dish) => {
    // 1. Category Filter
    if (selectedCategory === "Veg Only" && dish.type !== "VEG") return false;
    if (selectedCategory === "Non-Veg" && dish.type !== "NON-VEG") return false;
    if (selectedCategory === "Desserts" && dish.category !== "Desserts") return false;
    if (selectedCategory === "Beverages" && dish.category !== "Beverages") return false;

    // 2. Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        dish.name.toLowerCase().includes(q) ||
        dish.category.toLowerCase().includes(q)
      );
    }

    return true;
  });

  return (
    <div className={styles.menuContainer}>
      {/* 1. Left Sidebar with active Menu tab */}
      <ConsoleSidebar
        activeItemId="menu"
        isMobileOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
      />

      {/* 2. Right Content Section */}
      <div className={styles.rightSection}>
        {/* Top Navbar */}
        <Topbar
          title="Owner Operations Console"
          ownerName={ownerName}
          partnerRole={partnerRole}
          avatarInitials={avatarInitials}
          onSearch={onSearch}
          onNotificationClick={onNotificationClick}
          onMenuToggle={() => setIsMobileOpen((prev) => !prev)}
        />

        {/* Main Content Canvas */}
        <main className={styles.mainContent}>
          {/* Header Row: Title & Subtitle + Add New Dish Button */}
          <div className={styles.headerRow}>
            <div className={styles.headerGroup}>
              <h1 className={styles.title}>Menu Inventory</h1>
              <p className={styles.subtitle}>
                Publish dishes, update pricing, toggle real-time availability in rooms.
              </p>
            </div>
            <button
              type="button"
              className={styles.addDishBtn}
              onClick={onAddNewDish}
            >
              <Plus size={18} strokeWidth={2.8} />
              <span>Add New Dish</span>
            </button>
          </div>

          {/* 2. Store Operations Banner Card */}
          <div className={styles.operationsCard}>
            {/* Store Operations Switch */}
            <div className={styles.opItem}>
              <span className={styles.opLabel}>Store Operations:</span>
              <div className={styles.toggleWrapper}>
                <button
                  type="button"
                  onClick={handleToggleStore}
                  className={`${styles.toggleSwitch} ${isOpen ? styles.toggleSwitchActive : ""
                    }`}
                  aria-label="Toggle store status"
                >
                  <span
                    className={`${styles.toggleThumb} ${isOpen ? styles.toggleThumbActive : ""
                      }`}
                  />
                </button>
                <span
                  className={isOpen ? styles.statusTextOrange : styles.statusTextMuted}
                >
                  {isOpen ? "OPEN" : "CLOSED"}
                </span>
              </div>
            </div>

            {/* Vertical Divider */}
            <div className={styles.verticalDivider} />

            {/* Store Timings */}
            <div className={styles.opMetaGroup}>
              <span className={styles.opMetaHeader}>STORE TIMINGS</span>
              <span className={styles.opMetaValue}>{storeTimings}</span>
            </div>

            {/* Vertical Divider */}
            <div className={styles.verticalDivider} />

            {/* Operational Pincodes */}
            <div className={styles.opMetaGroup}>
              <span className={styles.opMetaHeader}>OPERATIONAL PINCODES</span>
              <span className={styles.opMetaValue}>{operationalPincodes}</span>
            </div>
          </div>

          {/* 3. Search and Category Filter Row */}
          <div className={styles.searchFilterRow}>
            {/* Search Input Box */}
            <div className={styles.searchInputWrapper}>
              <Search size={17} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search food items..."
                value={searchQuery}
                onChange={handleSearchChange}
                className={styles.searchInput}
              />
            </div>

            {/* Category Filter Pills */}
            <div className={styles.categoryPillsGroup}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`${styles.categoryPill} ${selectedCategory === cat ? styles.activeCategoryPill : ""
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Menu Inventory Dishes Table Card */}
          <div className={styles.dishTableCard}>
            <div className={styles.tableContainer}>
              <table className={styles.dishTable}>
                <thead>
                  <tr>
                    <th>DISH NAME</th>
                    <th>CATEGORY</th>
                    <th>PRICE</th>
                    <th>TYPE</th>
                    <th>STOCK QTY</th>
                    <th>IN-STOCK STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDishes.map((dish) => (
                    <tr key={dish.id}>
                      {/* Dish Name with Edit Icon Button */}
                      <td>
                        <div className={styles.dishNameCell}>
                          <button
                            type="button"
                            className={styles.editDishBtn}
                            aria-label={`Edit ${dish.name}`}
                            onClick={() => router.push(`/seller/edit-menu?id=${dish.id}`)}
                          >
                            <SquarePen size={17} strokeWidth={2.2} />
                          </button>
                          <span className={styles.dishNameText}>{dish.name}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className={styles.categoryText}>{dish.category}</td>

                      {/* Price */}
                      <td className={styles.priceText}>{dish.price}</td>

                      {/* Type (VEG / NON-VEG badge) */}
                      <td>
                        {dish.type === "VEG" ? (
                          <div className={`${styles.typeBadge} ${styles.typeVeg}`}>
                            <div className={styles.vegSymbol}>
                              <div className={styles.vegDot} />
                            </div>
                            <span>VEG</span>
                          </div>
                        ) : (
                          <div className={`${styles.typeBadge} ${styles.typeNonVeg}`}>
                            <div className={styles.nonVegSymbol}>
                              <div className={styles.nonVegDot} />
                            </div>
                            <span>NON-VEG</span>
                          </div>
                        )}
                      </td>

                      {/* Stock Qty */}
                      <td>
                        <span
                          className={
                            dish.stockQty <= 5 && dish.stockQty > 0
                              ? styles.stockQtyLow
                              : styles.stockQtyText
                          }
                        >
                          {dish.stockQty}
                        </span>
                      </td>

                      {/* In-Stock Status with interactive toggle */}
                      <td>
                        <div className={styles.stockStatusCell}>
                          <span
                            className={
                              dish.inStock ? styles.inStockText : styles.outOfStockText
                            }
                          >
                            {dish.inStock ? "In Stock" : "Out of Stock"}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleDishStock(dish.id)}
                            className={`${styles.miniToggle} ${dish.inStock
                                ? styles.miniToggleActive
                                : styles.miniToggleInactive
                              }`}
                            aria-label={`Toggle stock for ${dish.name}`}
                          >
                            <span
                              className={`${styles.miniThumb} ${dish.inStock ? styles.miniThumbActive : ""
                                }`}
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SellerMenu;
