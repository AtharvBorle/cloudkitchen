"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, SquarePen, Sparkles, Trash2, Utensils, MapPin, Edit3, X, Check, AlertCircle, Loader2 } from "lucide-react";
import ConsoleSidebar from "../sidebar/Sidebar";
import Topbar from "../nav/Topbar";
import { fetchApi } from "@/lib/fetch-api";
import { useSellerProfile, toggleSellerOnlineStatus } from "@/hooks/useSellerProfile";
import { broadcastShopTimingAlert } from "@/hooks/useSellerNotifications";
import styles from "./SellerMenu.module.css";

export type MenuCategoryFilter = string;

const DishThumbnail: React.FC<{ src?: string | null; alt: string }> = ({ src, alt }) => {
  const [imgError, setImgError] = useState(false);
  if (!src || imgError) {
    return (
      <div className={styles.dishPlaceholderIcon}>
        <Utensils size={18} strokeWidth={2.2} />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={styles.dishThumbnail}
      onError={() => setImgError(true)}
    />
  );
};

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
  imageUrl?: string | null;
  addons?: Array<{ id: string; name: string; price: number }>;
  stockQty: number;
  inStock: boolean;
}

export interface ServedPincodeItem {
  id: string;
  pincode: string;
  name: string;
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
  onToggleStock?: (dishId: string, inStock: boolean) => void;
  onStockQtyChange?: (dishId: string, delta: number) => void;
}

export default function SellerMenu({
  ownerName: initialOwnerName,
  partnerRole: initialPartnerRole,
  avatarInitials: initialAvatarInitials,
  storeTimings = "10:00 AM - 11:00 PM",
  operationalPincodes,
  initialIsOpen = true,
  dishes,
  onSearch,
  onNotificationClick,
  onAddNewDish,
  onToggleStore,
  onToggleStock,
  onStockQtyChange,
}: SellerMenuProps) {
  const router = useRouter();
  const seller = useSellerProfile();
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("seller_is_online");
        if (stored !== null) return stored === "true";
      } catch {}
    }
    return typeof initialIsOpen === "boolean" ? initialIsOpen : true;
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All Items");
  const [searchQuery, setSearchQuery] = useState("");
  const [dishList, setDishList] = useState<DishItem[]>(dishes || []);
  const [servedPincodes, setServedPincodes] = useState<ServedPincodeItem[]>(() => {
    if (operationalPincodes) {
      return operationalPincodes
        .split(",")
        .map((p, idx) => ({
          id: `prop-pin-${idx}`,
          pincode: p.trim(),
          name: `Area ${p.trim()}`,
        }))
        .filter((p) => p.pincode);
    }
    return [
      {
        id: "default-pin-1",
        pincode: "411051",
        name: "Kothrud, Pune",
      },
    ];
  });
  const [isPincodeModalOpen, setIsPincodeModalOpen] = useState(false);
  const [newPincode, setNewPincode] = useState("");
  const [newPlaceName, setNewPlaceName] = useState("");
  const [editingPincodeId, setEditingPincodeId] = useState<string | null>(null);
  const [editPincodeValue, setEditPincodeValue] = useState("");
  const [editPlaceNameValue, setEditPlaceNameValue] = useState("");
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState("");
  const [pincodeSuccess, setPincodeSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  const ownerName = initialOwnerName || seller.ownerName;
  const partnerRole = initialPartnerRole || seller.partnerRole;
  const avatarInitials = initialAvatarInitials || seller.avatarInitials;

  // Fetch live menu items and served pincodes from DB
  useEffect(() => {
    let isMounted = true;
    async function loadMenu() {
      try {
        const res = await fetchApi("/api/seller/menu");
        if (res.ok && isMounted) {
          const json = await res.json();
          const data = json.data || json;
          const rawItems = Array.isArray(data)
            ? data
            : Array.isArray(data?.items)
            ? data.items
            : [];

          const mapped: DishItem[] = rawItems.map((item: any) => {
            let addonsList: Array<{ id: string; name: string; price: number }> = [];
            const rawAddons = item.addons || item.variants;
            if (rawAddons) {
              try {
                const parsed = typeof rawAddons === 'string' ? JSON.parse(rawAddons) : rawAddons;
                if (Array.isArray(parsed)) {
                  addonsList = parsed
                    .filter((a: any) => a && (a.name || '').trim())
                    .map((a: any) => ({
                      id: String(a.id || ''),
                      name: String(a.name || '').trim(),
                      price: Number(a.price) || 0,
                    }));
                }
              } catch {}
            }

            const foodTypes = parseFoodTypes(item.itemType);

            return {
              id: item.id,
              name: item.name,
              category: item.foodCategory?.name || item.foodSubCategory?.name || "General",
              price: `₹${item.price}`,
              imageUrl: item.imageUrl || null,
              type: foodTypes[0] || "VEG",
              types: foodTypes,
              addons: addonsList,
              stockQty: item.stockQuantity !== null && item.stockQuantity !== undefined && item.stockQuantity >= 0 ? item.stockQuantity : 0,
              inStock: item.isAvailable,
            };
          });
          setDishList(mapped);

          const servedPins = data.servedPincodes || (data.data && data.data.servedPincodes);
          if (servedPins && Array.isArray(servedPins)) {
            if (servedPins.length > 0) {
              const list: ServedPincodeItem[] = servedPins.map((sp: any) => ({
                id: String(sp.id || `pin-${sp.pincode}`),
                pincode: String(sp.pincode),
                name: String(sp.name || ""),
              }));
              setServedPincodes(list);
            } else if (seller.pincode) {
              setServedPincodes([
                {
                  id: "primary-pin",
                  pincode: String(seller.pincode),
                  name: seller.city || "Primary Area",
                },
              ]);
            }
          }

          if (data?.seller && typeof data.seller.isOnline === "boolean") {
            setIsOpen(data.seller.isOnline);
            try {
              localStorage.setItem("seller_is_online", String(data.seller.isOnline));
            } catch {}
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

  const handleAddPincode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPincodeError("");
    setPincodeSuccess("");

    const cleanPin = newPincode.trim();
    const cleanName = newPlaceName.trim() || `Area ${cleanPin}`;

    if (!cleanPin) {
      setPincodeError("Please enter a 6-digit pincode.");
      return;
    }

    if (!/^\d{6}$/.test(cleanPin)) {
      setPincodeError("Please enter a valid 6-digit numerical pincode (e.g., 411051).");
      return;
    }

    if (servedPincodes.some((p) => p.pincode === cleanPin)) {
      setPincodeError(`Pincode ${cleanPin} is already added in your operational areas.`);
      return;
    }

    try {
      setPincodeLoading(true);
      const res = await fetchApi("/api/seller/menu/pincodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pincode: cleanPin, name: cleanName }),
      });

      let newId = `pin-${Date.now()}`;
      if (res.ok) {
        const json = await res.json();
        const d = json.data?.pincode || json.data || json;
        if (d && d.id) newId = d.id;
      }

      setServedPincodes((prev) => [...prev, { id: newId, pincode: cleanPin, name: cleanName }]);
      setNewPincode("");
      setNewPlaceName("");
      setPincodeSuccess(`Pincode ${cleanPin} (${cleanName}) added successfully!`);
    } catch (err: any) {
      console.error("Failed to add pincode:", err);
      setServedPincodes((prev) => [...prev, { id: `pin-${Date.now()}`, pincode: cleanPin, name: cleanName }]);
      setNewPincode("");
      setNewPlaceName("");
      setPincodeSuccess(`Pincode ${cleanPin} added.`);
    } finally {
      setPincodeLoading(false);
    }
  };

  const handleDeletePincode = async (pincodeItem: ServedPincodeItem) => {
    setPincodeError("");
    setPincodeSuccess("");
    setServedPincodes((prev) =>
      prev.filter((p) => p.id !== pincodeItem.id && p.pincode !== pincodeItem.pincode)
    );

    try {
      if (
        pincodeItem.id &&
        !pincodeItem.id.startsWith("default-") &&
        !pincodeItem.id.startsWith("primary-") &&
        !pincodeItem.id.startsWith("prop-")
      ) {
        await fetchApi(`/api/seller/menu/pincodes/${pincodeItem.id}`, {
          method: "DELETE",
        });
      }
      setPincodeSuccess(`Pincode ${pincodeItem.pincode} removed successfully.`);
    } catch (err) {
      console.error("Failed to delete pincode:", err);
    }
  };

  const handleStartEdit = (item: ServedPincodeItem) => {
    setEditingPincodeId(item.id);
    setEditPincodeValue(item.pincode);
    setEditPlaceNameValue(item.name || "");
    setPincodeError("");
    setPincodeSuccess("");
  };

  const handleSaveEdit = async (id: string) => {
    const cleanPin = editPincodeValue.trim();
    const cleanName = editPlaceNameValue.trim() || `Area ${cleanPin}`;

    if (!cleanPin || !/^\d{6}$/.test(cleanPin)) {
      setPincodeError("Please enter a valid 6-digit pincode.");
      return;
    }

    if (servedPincodes.some((p) => p.id !== id && p.pincode === cleanPin)) {
      setPincodeError(`Pincode ${cleanPin} is already in the list.`);
      return;
    }

    try {
      setPincodeLoading(true);
      await fetchApi("/api/seller/menu/pincodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pincode: cleanPin, name: cleanName }),
      });

      setServedPincodes((prev) =>
        prev.map((p) => (p.id === id ? { ...p, pincode: cleanPin, name: cleanName } : p))
      );
      setEditingPincodeId(null);
      setPincodeSuccess(`Pincode updated to ${cleanPin} (${cleanName})!`);
    } catch (err) {
      console.error("Failed to update pincode:", err);
      setServedPincodes((prev) =>
        prev.map((p) => (p.id === id ? { ...p, pincode: cleanPin, name: cleanName } : p))
      );
      setEditingPincodeId(null);
    } finally {
      setPincodeLoading(false);
    }
  };

  const defaultPills: string[] = ["All Items", "Veg", "Non-Veg", "Jain", "Vegan"];
  const dynamicCategories = Array.from(
    new Set(
      dishList
        .map((d) => d.category)
        .filter((c): c is string => Boolean(c && c.trim() && !defaultPills.includes(c)))
    )
  );
  const categories: string[] = [
    ...defaultPills,
    ...dynamicCategories,
  ];

  const handleToggleStore = async () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (onToggleStore) onToggleStore(newState);
    try {
      localStorage.setItem("seller_is_online", String(newState));
    } catch {}
    try {
      await toggleSellerOnlineStatus(newState);
      try {
        broadcastShopTimingAlert({ isOpen: newState });
      } catch {}
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
    if (
      selectedCategory !== "All Items" &&
      selectedCategory !== "Veg" &&
      selectedCategory !== "Non-Veg" &&
      selectedCategory !== "Jain" &&
      selectedCategory !== "Vegan"
    ) {
      if (dish.category.toLowerCase() !== selectedCategory.toLowerCase()) return false;
    }

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

            <div className={styles.verticalDivider} />

            {/* Store Timings */}
            <div className={styles.opItem}>
              <span className={styles.opLabel}>Store Timings:</span>
              <span className={styles.opValue}>{storeTimings}</span>
            </div>

            <div className={styles.verticalDivider} />

            {/* Operational Pincodes */}
            <div className={styles.opItem} style={{ flexWrap: "wrap", maxWidth: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <MapPin size={16} color="#EA580C" strokeWidth={2.2} />
                <span className={styles.opLabel}>Operational Pincodes:</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                {servedPincodes.length === 0 ? (
                  <span className={styles.opValue} style={{ color: "#94A3B8" }}>None configured</span>
                ) : (
                  servedPincodes.slice(0, 3).map((p) => (
                    <span
                      key={p.id}
                      style={{
                        backgroundColor: "#FFF7ED",
                        border: "1px solid #FED7AA",
                        color: "#EA580C",
                        fontSize: "12px",
                        fontWeight: 600,
                        padding: "3px 8px",
                        borderRadius: "6px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      title={p.name ? `${p.pincode} - ${p.name}` : p.pincode}
                    >
                      {p.pincode}
                      {p.name && <span style={{ color: "#9A3412", fontWeight: 400, fontSize: "11px" }}>({p.name.split(",")[0]})</span>}
                    </span>
                  ))
                )}
                {servedPincodes.length > 3 && (
                  <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>
                    +{servedPincodes.length - 3} more
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setIsPincodeModalOpen(true)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    background: "linear-gradient(135deg, #FFF7ED, #FFEDD5)",
                    border: "1px solid #FDBA74",
                    color: "#C2410C",
                    fontSize: "12px",
                    fontWeight: 600,
                    padding: "4px 10px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    marginLeft: "4px",
                    transition: "all 0.15s ease",
                  }}
                  title="Edit, Add, Change, or Remove Operational Pincodes"
                >
                  <Edit3 size={13} />
                  <span>Change / Edit</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. Search Bar + Category Tabs Row */}
          <div className={styles.searchFilterRow}>
            {/* Search Input */}
            <div className={styles.searchInputWrapper}>
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
            <div className={styles.categoryPillsGroup}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`${styles.categoryPill} ${
                    selectedCategory === cat ? styles.activeCategoryPill : ""
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
                    <th>DISH</th>
                    <th>CATEGORY</th>
                    <th>PRICE</th>
                    <th>TYPE</th>
                    <th>STOCK QTY</th>
                    <th>IN-STOCK STATUS</th>
                    <th style={{ textAlign: "right" }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDishes.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "48px 16px", color: "#64748b", fontSize: "14px" }}>
                        {loading ? (
                          <span>Loading menu items...</span>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                            <div className={styles.dishPlaceholderIcon} style={{ width: 44, height: 44, borderRadius: "50%" }}>
                              <Utensils size={20} strokeWidth={2.2} />
                            </div>
                            <span style={{ fontWeight: 600, color: "#1E293B", fontSize: "15px" }}>No dishes found</span>
                            <span style={{ color: "#64748B", fontSize: "13px" }}>
                              {searchQuery || selectedCategory !== "All Items"
                                ? "Try adjusting your search query or category filter"
                                : "Click '+ Add New Dish' to publish dishes to your cloud kitchen menu."}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredDishes.map((dish) => (
                    <tr key={dish.id}>
                      {/* Dish Thumbnail & Details */}
                      <td>
                        <div className={styles.dishNameCell}>
                          <div className={styles.dishThumbnailWrapper}>
                            <DishThumbnail src={dish.imageUrl} alt={dish.name} />
                          </div>
                          <div className={styles.dishNameInfo}>
                            <span className={styles.dishNameText}>{dish.name}</span>
                            {dish.addons && dish.addons.length > 0 ? (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "3px" }}>
                                {dish.addons.map((addon, idx) => (
                                  <span
                                    key={idx}
                                    style={{
                                      fontSize: "0.72rem",
                                      fontWeight: 600,
                                      color: "#EA580C",
                                      backgroundColor: "#FFF7ED",
                                      border: "1px solid #FFEDD5",
                                      padding: "1px 6px",
                                      borderRadius: "4px",
                                    }}
                                  >
                                    + {addon.name} (₹{addon.price})
                                  </span>
                                ))}
                              </div>
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

                      {/* Actions: Edit & Delete Buttons at the End */}
                      <td>
                        <div className={styles.dishActionsCell}>
                          <button
                            type="button"
                            className={styles.editDishBtn}
                            aria-label={`Edit ${dish.name}`}
                            title="Edit dish"
                            onClick={() => router.push(`/seller/edit-menu?id=${dish.id}`)}
                          >
                            <SquarePen size={16} strokeWidth={2.2} />
                          </button>
                          <button
                            type="button"
                            className={styles.deleteDishBtn}
                            aria-label={`Delete ${dish.name}`}
                            title="Delete dish"
                            onClick={() => handleDeleteDish(dish.id, dish.name)}
                          >
                            <Trash2 size={16} strokeWidth={2.2} />
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

      {/* Operational Pincodes Management Modal */}
      {isPincodeModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(15, 23, 42, 0.55)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
            boxSizing: "border-box",
          }}
          onClick={() => setIsPincodeModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
              maxWidth: "540px",
              width: "100%",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              border: "1px solid #E2E8F0",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #F1F5F9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#F8FAFC",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    backgroundColor: "#FFF7ED",
                    color: "#EA580C",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MapPin size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#0F172A" }}>
                    Manage Operational Pincodes
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: "12.5px", color: "#64748B" }}>
                    Configure areas where your kitchen accepts delivery orders
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPincodeModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#94A3B8",
                  padding: "6px",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div
              style={{
                padding: "20px 24px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "18px",
              }}
            >
              {/* Add New Pincode Form */}
              <div
                style={{
                  backgroundColor: "#FAFAFA",
                  border: "1px solid #E2E8F0",
                  borderRadius: "12px",
                  padding: "16px",
                }}
              >
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#334155",
                    marginBottom: "8px",
                  }}
                >
                  Add New Delivery Pincode
                </label>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Pincode (e.g. 411051)"
                    value={newPincode}
                    onChange={(e) => setNewPincode(e.target.value.replace(/\D/g, ""))}
                    style={{
                      flex: "1 1 140px",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      fontSize: "13.5px",
                      color: "#0F172A",
                      outline: "none",
                      backgroundColor: "#FFFFFF",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Area Name (e.g. Kothrud, Pune)"
                    value={newPlaceName}
                    onChange={(e) => setNewPlaceName(e.target.value)}
                    style={{
                      flex: "2 1 180px",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      fontSize: "13.5px",
                      color: "#0F172A",
                      outline: "none",
                      backgroundColor: "#FFFFFF",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddPincode()}
                    disabled={pincodeLoading || !newPincode.trim()}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      backgroundColor:
                        pincodeLoading || !newPincode.trim() ? "#CBD5E1" : "#EA580C",
                      color: "#FFFFFF",
                      border: "none",
                      padding: "9px 16px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor:
                        pincodeLoading || !newPincode.trim() ? "not-allowed" : "pointer",
                      transition: "background 0.2s ease",
                    }}
                  >
                    <Plus size={16} strokeWidth={2.4} />
                    <span>Add</span>
                  </button>
                </div>

                {pincodeError && (
                  <p
                    style={{
                      margin: "8px 0 0",
                      fontSize: "12px",
                      color: "#DC2626",
                      fontWeight: 500,
                    }}
                  >
                    {pincodeError}
                  </p>
                )}
                {pincodeSuccess && (
                  <p
                    style={{
                      margin: "8px 0 0",
                      fontSize: "12px",
                      color: "#16A34A",
                      fontWeight: 500,
                    }}
                  >
                    {pincodeSuccess}
                  </p>
                )}
              </div>

              {/* Active Pincodes List */}
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "10px",
                  }}
                >
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#334155" }}>
                    Active Operational Pincodes ({servedPincodes.length})
                  </span>
                  <span style={{ fontSize: "11.5px", color: "#94A3B8" }}>
                    Orders will be accepted from these areas
                  </span>
                </div>

                {servedPincodes.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "28px 16px",
                      backgroundColor: "#F8FAFC",
                      borderRadius: "10px",
                      border: "1px dashed #CBD5E1",
                    }}
                  >
                    <MapPin size={24} color="#94A3B8" style={{ marginBottom: "6px" }} />
                    <p
                      style={{
                        margin: 0,
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#475569",
                      }}
                    >
                      No operational pincodes configured
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#94A3B8" }}>
                      Add your kitchen&apos;s delivery pincodes using the form above.
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      maxHeight: "260px",
                      overflowY: "auto",
                    }}
                  >
                    {servedPincodes.map((item) => {
                      const isEditing = editingPincodeId === item.id;
                      if (isEditing) {
                        return (
                          <div
                            key={item.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              backgroundColor: "#FFF7ED",
                              border: "1px solid #FDBA74",
                              borderRadius: "10px",
                              padding: "8px 12px",
                              flexWrap: "wrap",
                            }}
                          >
                            <input
                              type="text"
                              maxLength={6}
                              value={editPincodeValue}
                              onChange={(e) =>
                                setEditPincodeValue(e.target.value.replace(/\D/g, ""))
                              }
                              style={{
                                width: "100px",
                                padding: "6px 10px",
                                borderRadius: "6px",
                                border: "1px solid #CBD5E1",
                                fontSize: "13px",
                                fontWeight: 600,
                              }}
                            />
                            <input
                              type="text"
                              value={editPlaceNameValue}
                              onChange={(e) => setEditPlaceNameValue(e.target.value)}
                              placeholder="Area Name"
                              style={{
                                flex: 1,
                                minWidth: "120px",
                                padding: "6px 10px",
                                borderRadius: "6px",
                                border: "1px solid #CBD5E1",
                                fontSize: "13px",
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(item.id)}
                              style={{
                                backgroundColor: "#EA580C",
                                color: "#FFFFFF",
                                border: "none",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingPincodeId(null)}
                              style={{
                                backgroundColor: "transparent",
                                color: "#64748B",
                                border: "1px solid #CBD5E1",
                                padding: "6px 10px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                cursor: "pointer",
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={item.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            backgroundColor: "#FFFFFF",
                            border: "1px solid #E2E8F0",
                            borderRadius: "10px",
                            padding: "10px 14px",
                            transition: "border-color 0.15s ease",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div
                              style={{
                                width: "28px",
                                height: "28px",
                                borderRadius: "6px",
                                backgroundColor: "#FFF7ED",
                                color: "#EA580C",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <MapPin size={15} />
                            </div>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span
                                  style={{
                                    fontSize: "14px",
                                    fontWeight: 700,
                                    color: "#0F172A",
                                  }}
                                >
                                  {item.pincode}
                                </span>
                                {item.name && (
                                  <span
                                    style={{
                                      fontSize: "12.5px",
                                      color: "#64748B",
                                      fontWeight: 500,
                                    }}
                                  >
                                    • {item.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(item)}
                              style={{
                                background: "none",
                                border: "1px solid #E2E8F0",
                                padding: "5px 9px",
                                borderRadius: "6px",
                                color: "#475569",
                                fontSize: "12px",
                                fontWeight: 500,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                              title="Edit pincode details"
                            >
                              <Edit3 size={13} />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePincode(item)}
                              style={{
                                background: "none",
                                border: "1px solid #FEE2E2",
                                padding: "5px 9px",
                                borderRadius: "6px",
                                color: "#DC2626",
                                fontSize: "12px",
                                fontWeight: 500,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                              title="Remove pincode"
                            >
                              <Trash2 size={13} />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px solid #F1F5F9",
                display: "flex",
                justifyContent: "flex-end",
                backgroundColor: "#F8FAFC",
              }}
            >
              <button
                type="button"
                onClick={() => setIsPincodeModalOpen(false)}
                style={{
                  backgroundColor: "#0F172A",
                  color: "#FFFFFF",
                  border: "none",
                  padding: "9px 20px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { SellerMenu };
