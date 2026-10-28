"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Menu as MenuIcon, Plus, Search, Minus, UtensilsCrossed, Bell, SquarePen, Package } from "lucide-react";
import ResponsiveNavMenu from "../../nav/ResponsiveNavMenu";
import PaginationControls from "../../common/PaginationControls";
import ResponsiveAddonsManager from "./ResponsiveAddonsManager";
import styles from "./ResponsiveMenu.module.css";

export type MenuCategory = string;

export interface ResponsiveDishItem {
  id: string;
  name: string;
  price: string;
  category: string;
  types?: Array<"VEG" | "NON-VEG" | "JAIN" | "VEGAN">;
  addons?: Array<{ id: string; name: string; price: number }>;
  stockQty: number;
  isAvailable: boolean;
  imageUrl: string;
}

export interface ResponsiveMenuProps {
  ownerName?: string;
  dishes?: ResponsiveDishItem[];
  initialTab?: "dishes" | "addons";
  onAddItem?: () => void;
  onEditDish?: (dishId: string) => void;
  onStockChange?: (dishId: string, newStock: number) => void;
  onToggleAvailability?: (dishId: string, isAvailable: boolean) => void;
  onSyncDevices?: () => void;
}

import { useSellerProfile, isGenericFallbackName } from "@/hooks/useSellerProfile";
import { useSellerNotifications } from "@/hooks/useSellerNotifications";

const EMPTY_DISHES: ResponsiveDishItem[] = [];

export const ResponsiveMenu: React.FC<ResponsiveMenuProps> = ({
  ownerName,
  dishes = EMPTY_DISHES,
  initialTab,
  onAddItem,
  onEditDish,
  onStockChange,
  onToggleAvailability,
  onSyncDevices,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"dishes" | "addons">(() => {
    if (initialTab) return initialTab;
    const tabParam = searchParams?.get("tab");
    return tabParam === "addons" ? "addons" : "dishes";
  });
  const [isAddAddonModalOpen, setIsAddAddonModalOpen] = useState(false);
  const seller = useSellerProfile();
  const { unreadCount } = useSellerNotifications();
  const effectiveOwnerName =
    ownerName && !isGenericFallbackName(ownerName)
      ? ownerName
      : (!isGenericFallbackName(seller.ownerName) ? seller.ownerName : "");
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [dishList, setDishList] = useState<ResponsiveDishItem[]>(dishes);

  const handleTabChange = (tab: "dishes" | "addons") => {
    setActiveTab(tab);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState({}, "", url.toString());
    } catch {}
  };

  const dynamicCategories = Array.from(
    new Set(
      dishList
        .map((d) => d.category)
        .filter((c): c is string => Boolean(c && c.trim() && c !== "All"))
    )
  );
  const categories = ["All", ...dynamicCategories];

  useEffect(() => {
    if (dishes && dishes !== EMPTY_DISHES) {
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

  const handleEditDish = (dishId: string) => {
    if (onEditDish) {
      onEditDish(dishId);
    } else {
      router.push(`/seller/edit-menu?id=${dishId}`);
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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | "All">(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  const paginatedDishes = React.useMemo(() => {
    if (pageSize === "All") return filteredDishes;
    const start = (currentPage - 1) * pageSize;
    return filteredDishes.slice(start, start + pageSize);
  }, [filteredDishes, currentPage, pageSize]);

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
              {unreadCount > 0 && <span className={styles.notificationDot} />}
            </button>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => {
                if (activeTab === "addons") {
                  setIsAddAddonModalOpen(true);
                } else {
                  handleAddItem();
                }
              }}
              aria-label={activeTab === "addons" ? "Add New Add-on" : "Add New Dish"}
              title={activeTab === "addons" ? "Add Add-on" : "Add Dish"}
            >
              <Plus size={24} />
            </button>
          </div>
        </header>

        {/* Main Tab Navigation Bar */}
        <div className={styles.tabBar} role="tablist" aria-label="Menu Sections">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "dishes"}
            className={`${styles.tabBtn} ${activeTab === "dishes" ? styles.tabBtnActive : ""}`}
            onClick={() => handleTabChange("dishes")}
          >
            <UtensilsCrossed size={15} />
            <span>Dishes ({dishList.length})</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "addons"}
            className={`${styles.tabBtn} ${activeTab === "addons" ? styles.tabBtnActive : ""}`}
            onClick={() => handleTabChange("addons")}
          >
            <Package size={15} />
            <span>Add-on Inventory</span>
          </button>
        </div>

        {activeTab === "addons" ? (
          <main className={styles.contentArea} style={{ padding: "12px 0 32px 0" }}>
            <ResponsiveAddonsManager
              isCreateModalOpen={isAddAddonModalOpen}
              onCloseCreateModal={() => setIsAddAddonModalOpen(false)}
            />
          </main>
        ) : (
          <>
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
                {categories.map((cat) => {
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
                  {paginatedDishes.map((dish) => (
                    <article key={dish.id} className={styles.itemCard}>
                      {/* Card Header: Thumbnail + Name & Type & Price + Edit Button */}
                      <div className={styles.cardHeader}>
                        <div className={styles.cardMainInfo}>
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
                            <div className={styles.titleRow}>
                              <h2 className={styles.dishName}>{dish.name}</h2>
                              {dish.types && dish.types.length > 0 && (
                                <div className={styles.typeBadgesGroup}>
                                  {dish.types.includes("VEG") && (
                                    <span className={styles.badgeVeg}>VEG</span>
                                  )}
                                  {dish.types.includes("NON-VEG") && (
                                    <span className={styles.badgeNonVeg}>NON-VEG</span>
                                  )}
                                  {dish.types.includes("VEGAN") && (
                                    <span className={styles.badgeVegan}>VEGAN</span>
                                  )}
                                  {dish.types.includes("JAIN") && (
                                    <span className={styles.badgeJain}>JAIN</span>
                                  )}
                                </div>
                              )}
                            </div>
                            <p className={styles.dishPrice}>{dish.price}</p>
                          </div>
                        </div>

                        {/* Edit Dish Button (Identical to Web Desktop) */}
                        <button
                          type="button"
                          className={styles.editDishBtn}
                          onClick={() => handleEditDish(dish.id)}
                          aria-label={`Edit ${dish.name}`}
                          title="Edit dish"
                        >
                          <SquarePen size={16} strokeWidth={2.2} />
                        </button>
                      </div>

                      {/* Optional Add-ons Chips Row */}
                      {dish.addons && dish.addons.length > 0 && (
                        <div className={styles.addonsRow}>
                          {dish.addons.map((a, idx) => (
                            <span key={idx} className={styles.addonBadge}>
                              +{a.name} (₹{a.price})
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Card Footer: Stock Status, Quantity Stepper & On/Off Availability Switch */}
                      <div className={styles.cardFooter}>
                        <div className={styles.stockStatusIndicator}>
                          <span
                            className={`${styles.statusDot} ${
                              dish.isAvailable ? styles.statusDotActive : styles.statusDotInactive
                            }`}
                          />
                          <span
                            className={`${styles.statusLabel} ${
                              dish.isAvailable ? styles.statusLabelActive : styles.statusLabelInactive
                            }`}
                          >
                            {dish.isAvailable ? "In Stock" : "Out of Stock"}
                          </span>
                        </div>

                        <div className={styles.controlsGroup}>
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
                      </div>
                    </article>
                  ))}

                  <div style={{ marginTop: "16px" }}>
                    <PaginationControls
                      currentPage={currentPage}
                      totalItems={filteredDishes.length}
                      pageSize={pageSize}
                      onPageChange={(p) => setCurrentPage(p)}
                      onPageSizeChange={(s) => {
                        setPageSize(s);
                        setCurrentPage(1);
                      }}
                      itemLabel="dishes"
                    />
                  </div>
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p className={styles.emptyText}>No items found in this category.</p>
                </div>
              )}
            </main>
          </>
        )}
      </div>
    </div>
  );
};

export default ResponsiveMenu;
