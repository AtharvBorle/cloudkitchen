"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, SquarePen, Sparkles, Trash2 } from "lucide-react";
import ConsoleSidebar from "../sidebar/Sidebar";
import Topbar from "../nav/Topbar";
import { fetchApi } from "@/lib/fetch-api";
import { useSellerProfile } from "@/hooks/useSellerProfile";
import styles from "./SellerMenu.module.css";

export type MenuCategoryFilter =
  | "All Items"
  | "Veg"
  | "Non-Veg"
  | "Jain"
  | "Vegan"
  | "Desserts"
  | "Beverages";

export function parseFoodTypes(itemTypeStr?: string): Array<"VEG" | "NON-VEG" | "JAIN" | "VEGAN"> {
  if (!itemTypeStr) return ["VEG"];
  const parts = String(itemTypeStr).split(",").map((s) => s.trim().toUpperCase());
  if (parts.includes("NON_VEG") || parts.includes("NON-VEG") || parts.includes("NON VEG")) {
    return ["NON-VEG"];
  }
  const result: Array<"VEG" | "NON-VEG" | "JAIN" | "VEGAN"> = [];
  if (parts.includes("VEG")) result.push("VEG");
  if (parts.includes("VEGAN")) result.push("VEGAN");
  if (parts.includes("JAIN")) result.push("JAIN");
  return result.length > 0 ? result : ["VEG"];
}

export interface DishItem {
  id: string;
  name: string;
  category: string;
  price: string;
  type: "VEG" | "NON-VEG" | "JAIN" | "VEGAN";
  types: Array<"VEG" | "NON-VEG" | "JAIN" | "VEGAN">;
  variantsCount?: number;
  stockQty: number;
  inStock: boolean;
}

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
  ownerName: initialOwnerName,
  partnerRole: initialPartnerRole,
  avatarInitials: initialAvatarInitials,
  storeTimings = "07:00 AM - 11:30 PM",
  operationalPincodes,
  initialIsOpen = true,
  dishes,
  onSearch,
  onNotificationClick,
  onAddNewDish,
  onToggleStore,
}) => {
  const router = useRouter();
  const seller = useSellerProfile();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [selectedCategory, setSelectedCategory] = useState<MenuCategoryFilter>("All Items");
  const [searchQuery, setSearchQuery] = useState("");
  const [dishList, setDishList] = useState<DishItem[]>(dishes || []);
  const [pincodesStr, setPincodesStr] = useState(operationalPincodes || seller.pincode || "Not configured");
  const [loading, setLoading] = useState(true);

  const ownerName = initialOwnerName || seller.ownerName;
  const partnerRole = initialPartnerRole || seller.partnerRole;
  const avatarInitials = initialAvatarInitials || seller.avatarInitials;

  // Fetch live menu items from DB
  useEffect(() => {
    let isMounted = true;
    async function loadMenu() {
      try {
        const res = await fetchApi("/api/seller/menu");
        if (res.ok) {
          const data = await res.json();
          if (data && data.items && Array.isArray(data.items) && isMounted) {
            const mapped: DishItem[] = data.items.map((item: any) => {
              let variantsCount = 0;
              if (item.variants) {
                try {
                  const parsed = typeof item.variants === 'string' ? JSON.parse(item.variants) : item.variants;
                  if (Array.isArray(parsed)) variantsCount = parsed.length;
                } catch {}
              }

              const foodTypes = parseFoodTypes(item.itemType);

              return {
                id: item.id,
                name: item.name,
                category: item.foodCategory?.name || item.foodSubCategory?.name || "Main Course",
                price: `₹${item.price}`,
                type: foodTypes[0] || "VEG",
                types: foodTypes,
                variantsCount,
                stockQty: item.stockQuantity >= 0 ? item.stockQuantity : 25,
                inStock: item.isAvailable,
              };
            });
            setDishList(mapped);

            if (data.servedPincodes && Array.isArray(data.servedPincodes) && data.servedPincodes.length > 0) {
              setPincodesStr(data.servedPincodes.map((sp: any) => sp.pincode).join(", "));
            }
            if (data.seller) {
              if (typeof data.seller.isOnline === "boolean") setIsOpen(data.seller.isOnline);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching seller menu from DB:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadMenu();
    return () => {
      isMounted = false;
    };
  }, []);

  const categories: MenuCategoryFilter[] = [
    "All Items",
    "Veg",
    "Non-Veg",
    "Jain",
    "Vegan",
    "Desserts",
    "Beverages",
  ];

  const handleToggleStore = async () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (onToggleStore) onToggleStore(newState);
    try {
      await fetchApi("/api/seller/profile/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnline: newState }),
      });
    } catch (err) {
      console.error("Failed to update store status:", err);
    }
  };

  const handleToggleDishStock = async (id: string) => {
    const targetDish = dishList.find((d) => d.id === id);
    if (!targetDish) return;
    const nextInStock = !targetDish.inStock;
    const nextQty = nextInStock ? (targetDish.stockQty > 0 ? targetDish.stockQty : 20) : 0;

    setDishList((prev) =>
      prev.map((dish) =>
        dish.id === id ? { ...dish, inStock: nextInStock, stockQty: nextQty } : dish
      )
    );

    try {
      await fetchApi(`/api/seller/menu/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: nextInStock, stockQuantity: nextQty }),
      });
    } catch (err) {
      console.error("Failed to toggle dish stock in DB:", err);
    }
  };

  const handleDeleteDish = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from your menu?`)) return;

    setDishList((prev) => prev.filter((d) => d.id !== id));

    try {
      await fetchApi(`/api/seller/menu/${id}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Failed to delete dish from DB:", err);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  // Filter Dishes by Category and Search
  const filteredDishes = dishList.filter((dish) => {
    // 1. Category Filter
    if (selectedCategory === "Veg" && !dish.types?.includes("VEG")) return false;
    if (selectedCategory === "Non-Veg" && !dish.types?.includes("NON-VEG")) return false;
    if (selectedCategory === "Jain" && !dish.types?.includes("JAIN")) return false;
    if (selectedCategory === "Vegan" && !dish.types?.includes("VEGAN")) return false;
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

  const handleAddClick = () => {
    if (onAddNewDish) {
      onAddNewDish();
    } else {
      router.push("/seller/edit-menu");
    }
  };

  return (
    <div className={styles.menuContainer}>
      {/* 1. Left Sidebar with active Menu tab */}
      <ConsoleSidebar
        activeItemId="menu"
        isMobileOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        ownerName={ownerName}
        partnerRole={partnerRole}
        avatarInitials={avatarInitials}
      />

      {/* 2. Right Content Section */}
      <div className={styles.rightSection}>
        {/* Top Navbar */}
        <Topbar
          title="Owner Operations Console"
          ownerName={ownerName}
          partnerRole={partnerRole}
          avatarInitials={avatarInitials}
          onSearch={(q) => {
            setSearchQuery(q);
            if (onSearch) onSearch(q);
          }}
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
              onClick={handleAddClick}
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

            <div className={styles.opDivider} />

            {/* Store Timings */}
            <div className={styles.opItem}>
              <span className={styles.opLabel}>Store Timings:</span>
              <span className={styles.opValue}>{storeTimings}</span>
            </div>

            <div className={styles.opDivider} />

            {/* Operational Pincodes */}
            <div className={styles.opItem}>
              <span className={styles.opLabel}>Operational Pincodes:</span>
              <span className={styles.opValue}>{pincodesStr}</span>
            </div>
          </div>

          {/* 3. Search Bar + Category Tabs Row */}
          <div className={styles.filtersRow}>
            {/* Search Input */}
            <div className={styles.searchBox}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search dish by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            {/* Category Filter Tabs */}
            <div className={styles.categoryTabs}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`${styles.categoryTab} ${selectedCategory === cat ? styles.categoryTabActive : ""
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
                  {filteredDishes.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "40px 16px", color: "#64748b", fontSize: "14px" }}>
                        {loading ? "Loading menu items..." : "No dishes found. Click '+ Add New Dish' to add dishes to your menu."}
                      </td>
                    </tr>
                  ) : (
                    filteredDishes.map((dish) => (
                    <tr key={dish.id}>
                      {/* Dish Name with Edit & Delete Icon Buttons */}
                      <td>
                        <div className={styles.dishNameCell}>
                          <button
                            type="button"
                            className={styles.editDishBtn}
                            aria-label={`Edit ${dish.name}`}
                            title="Edit dish"
                            onClick={() => router.push(`/seller/edit-menu?id=${dish.id}`)}
                          >
                            <SquarePen size={17} strokeWidth={2.2} />
                          </button>
                          <button
                            type="button"
                            className={styles.editDishBtn}
                            style={{ color: "#EF4444" }}
                            aria-label={`Delete ${dish.name}`}
                            title="Delete dish"
                            onClick={() => handleDeleteDish(dish.id, dish.name)}
                          >
                            <Trash2 size={16} strokeWidth={2.2} />
                          </button>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span className={styles.dishNameText}>{dish.name}</span>
                            {dish.variantsCount && dish.variantsCount > 0 ? (
                              <span style={{ fontSize: "0.72rem", color: "#EA580C", fontWeight: 600 }}>
                                {dish.variantsCount} {dish.variantsCount === 1 ? "variant" : "variants"} available
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className={styles.categoryText}>{dish.category}</td>

                      {/* Price */}
                      <td className={styles.priceText}>{dish.price}</td>

                      {/* Type (VEG / NON-VEG / JAIN / VEGAN badge) */}
                      <td>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
                          {dish.types?.includes("VEG") && (
                            <div className={`${styles.typeBadge} ${styles.typeVeg}`}>
                              <div className={styles.vegSymbol}>
                                <div className={styles.vegDot} />
                              </div>
                              <span>VEG</span>
                            </div>
                          )}
                          {dish.types?.includes("NON-VEG") && (
                            <div className={`${styles.typeBadge} ${styles.typeNonVeg}`}>
                              <div className={styles.nonVegSymbol}>
                                <div className={styles.nonVegDot} />
                              </div>
                              <span>NON-VEG</span>
                            </div>
                          )}
                          {dish.types?.includes("VEGAN") && (
                            <div className={`${styles.typeBadge} ${styles.typeVegan}`}>
                              <div className={styles.veganSymbol}>
                                <div className={styles.veganDot} />
                              </div>
                              <span>VEGAN</span>
                            </div>
                          )}
                          {dish.types?.includes("JAIN") && (
                            <div className={`${styles.typeBadge} ${styles.typeJain}`}>
                              <div className={styles.jainSymbol}>
                                <div className={styles.jainDot} />
                              </div>
                              <span>JAIN</span>
                            </div>
                          )}
                        </div>
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
                  ))
                )}
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
