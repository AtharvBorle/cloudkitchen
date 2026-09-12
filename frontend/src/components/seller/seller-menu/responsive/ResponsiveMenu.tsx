"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Menu as MenuIcon, Plus, Search, Minus, UtensilsCrossed, Bell } from "lucide-react";
import ResponsiveNavMenu from "../../nav/ResponsiveNavMenu";
import styles from "./ResponsiveMenu.module.css";

export type MenuCategory = "All" | "Starters" | "Mains" | "Desserts" | "Drinks";

export interface ResponsiveDishItem {
  id: string;
  name: string;
  price: string;
  category: "Starters" | "Mains" | "Desserts" | "Drinks";
  stockQty: number;
  isAvailable: boolean;
  imageUrl: string;
}

export interface ResponsiveMenuProps {
  ownerName?: string;
  dishes?: ResponsiveDishItem[];
  onAddItem?: () => void;
  onStockChange?: (dishId: string, newStock: number) => void;
  onToggleAvailability?: (dishId: string, isAvailable: boolean) => void;
  onSyncDevices?: () => void;
}

const DEFAULT_DISHES: ResponsiveDishItem[] = [
  {
    id: "1",
    name: "Butter Chicken",
    price: "₹450",
    category: "Mains",
    stockQty: 24,
    isAvailable: true,
    imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "2",
    name: "Dal Makhani",
    price: "₹280",
    category: "Mains",
    stockQty: 24,
    isAvailable: true,
    imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "3",
    name: "Garlic Naan",
    price: "₹45",
    category: "Mains",
    stockQty: 24,
    isAvailable: true,
    imageUrl: "https://images.unsplash.com/photo-1626074353765-517a681e40be?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "4",
    name: "Tandoori Paneer Tikka",
    price: "₹320",
    category: "Starters",
    stockQty: 24,
    isAvailable: true,
    imageUrl: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "5",
    name: "Veg Biryani",
    price: "₹350",
    category: "Mains",
    stockQty: 0,
    isAvailable: false,
    imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "6",
    name: "Mango Lassi",
    price: "₹120",
    category: "Drinks",
    stockQty: 24,
    isAvailable: true,
    imageUrl: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=150&auto=format&fit=crop&q=80",
  },
];

import { useSellerProfile } from "@/hooks/useSellerProfile";

const CATEGORIES: MenuCategory[] = ["All", "Starters", "Mains", "Desserts", "Drinks"];

export const ResponsiveMenu: React.FC<ResponsiveMenuProps> = ({
  ownerName,
  dishes = [],
  onAddItem,
  onStockChange,
  onToggleAvailability,
  onSyncDevices,
}) => {
  const router = useRouter();
  const seller = useSellerProfile();
  const effectiveOwnerName = ownerName && ownerName !== "Rahul Sharma" && ownerName !== "John Doe" ? ownerName : seller.ownerName;
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [dishList, setDishList] = useState<ResponsiveDishItem[]>(dishes);

  useEffect(() => {
    if (dishes) {
      setDishList(dishes);
    }
  }, [dishes]);

  const handleAddItem = () => {
    if (onAddItem) {
      onAddItem();
    } else {
      router.push("/seller/menu/item");
    }
  };

  const handleStockIncrement = (dishId: string) => {
    setDishList((prev) =>
      prev.map((d) => {
        if (d.id === dishId) {
          const updated = d.stockQty + 1;
          if (onStockChange) onStockChange(dishId, updated);
          return { ...d, stockQty: updated };
        }
        return d;
      })
    );
  };

  const handleStockDecrement = (dishId: string) => {
    setDishList((prev) =>
      prev.map((d) => {
        if (d.id === dishId && d.stockQty > 0) {
          const updated = d.stockQty - 1;
          if (onStockChange) onStockChange(dishId, updated);
          return { ...d, stockQty: updated };
        }
        return d;
      })
    );
  };

  const handleToggle = (dishId: string) => {
    setDishList((prev) =>
      prev.map((d) => {
        if (d.id === dishId) {
          const nextState = !d.isAvailable;
          if (onToggleAvailability) onToggleAvailability(dishId, nextState);
          return { ...d, isAvailable: nextState };
        }
        return d;
      })
    );
  };

  const filteredDishes = dishList.filter((dish) => {
    const matchesCategory =
      selectedCategory === "All" || dish.category === selectedCategory;
    const matchesSearch =
      dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dish.price.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className={styles.screenWrapper}>
      {/* Drawer Navigation Menu */}
      <ResponsiveNavMenu
        isOpen={isNavMenuOpen}
        onClose={() => setIsNavMenuOpen(false)}
        activeItemId="menu"
        ownerName={effectiveOwnerName}
        onSyncDevices={onSyncDevices}
      />

      {/* 390px Mobile View Container matching specifications */}
      <div className={styles.mobileContainer}>
        {/* Top Header Bar with Hamburger and Plus Icon */}
        <header className={styles.topBar}>
          <div className={styles.headerLeftGroup}>
            <button
              type="button"
              className={styles.iconButton}
              onClick={(e) => {
                e.stopPropagation();
                setIsNavMenuOpen(true);
              }}
              aria-label="Open Navigation Menu"
              title="Menu"
            >
              <MenuIcon size={24} />
            </button>
            <Link href="/seller/dashboard" className={styles.headerLogoLink} title="Neo Cloud Bites">
              <div className={styles.headerLogoWrapper}>
                <Image
                  src="/images/logo-nav.png"
                  alt="Neo Cloud Bites"
                  width={30}
                  height={30}
                  className={styles.headerLogoImg}
                  priority
                />
              </div>
            </Link>
          </div>

          <h1 className={styles.pageTitle}>Menu</h1>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => router.push("/seller/notifications")}
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={22} />
              <span className={styles.notificationDot} />
            </button>
            <button
              type="button"
              className={styles.iconButton}
              onClick={handleAddItem}
              aria-label="Add New Dish"
              title="Add Dish"
            >
              <Plus size={24} />
            </button>
          </div>
        </header>

        {/* Top Controls: Search Input & Category Pills */}
        <div className={styles.controlsSection}>
          {/* Search Bar */}
          <div className={styles.searchContainer}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Category Filter Pills */}
          <div className={styles.categoryPillsRow} role="tablist" aria-label="Menu Categories">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`${styles.categoryPill} ${
                    isActive ? styles.categoryPillActive : ""
                  }`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Menu Items List */}
        <main className={styles.contentArea}>
          {filteredDishes.length > 0 ? (
            <div className={styles.itemsList}>
              {filteredDishes.map((dish) => (
                <article key={dish.id} className={styles.itemCard}>
                  {/* Left: Thumbnail & Details */}
                  <div className={styles.itemLeft}>
                    <div className={styles.imageWrapper}>
                      <img
                        src={dish.imageUrl}
                        alt={dish.name}
                        className={styles.dishImage}
                        onError={(e) => {
                          // Fallback on image load error
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                    <div className={styles.itemDetails}>
                      <h2 className={styles.dishName}>{dish.name}</h2>
                      <p className={styles.dishPrice}>{dish.price}</p>
                    </div>
                  </div>

                  {/* Right: Quantity Stepper & Availability Toggle */}
                  <div className={styles.itemRight}>
                    {dish.isAvailable && (
                      <div className={styles.stepperContainer}>
                        <button
                          type="button"
                          className={styles.stepperBtn}
                          onClick={() => handleStockDecrement(dish.id)}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span className={styles.stepperValue}>{dish.stockQty}</span>
                        <button
                          type="button"
                          className={styles.stepperBtn}
                          onClick={() => handleStockIncrement(dish.id)}
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    )}

                    {/* On/Off Toggle Switch */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={dish.isAvailable}
                      className={`${styles.toggleSwitch} ${
                        dish.isAvailable ? styles.toggleSwitchActive : ""
                      }`}
                      onClick={() => handleToggle(dish.id)}
                      aria-label={`Toggle availability for ${dish.name}`}
                    >
                      <span className={styles.toggleThumb} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>No items found in this category.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ResponsiveMenu;
