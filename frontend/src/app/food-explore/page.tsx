"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/navbar";
import { Footer } from "@/components/explore-desktop/footer";
import { useHomeData, DynamicFoodItem, DynamicKitchen } from "@/lib/useHomeData";
import { useLocation } from "@/components/location-provider";
import { useCart } from "@/context/CartContext";
import { DietaryTag } from "@/components/common/DietaryTag";
import {
  Search,
  SlidersHorizontal,
  Star,
  Clock,
  MapPin,
  Tag,
  Zap,
  Leaf,
  UtensilsCrossed,
  X,
  Check,
  ChevronDown,
  Store,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import {
  isKitchenMatchingDiet,
  isDishMatchingDiet,
  matchesKitchenOrDishSearch,
  matchesDishSearch,
  matchesDishCategory,
  matchesKitchenCategoryFilter,
} from "@/lib/dietary-filter";
import Link from "next/link";

function FoodExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category") || "";
  const queryParam = searchParams.get("query") || searchParams.get("search") || "";
  const dietaryParam = (searchParams.get("dietary") as any) || "all";
  const priceParam = (searchParams.get("price") as any) || "all";
  const offersParam = searchParams.get("offers") === "true";
  const sortParam = searchParams.get("sort") || "popular";

  const { defaultAddress, openLocationModal } = useLocation();
  const { addToCart, cartItems } = useCart();
  const homeData = useHomeData();

  // Local Filter States
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [selectedDiet, setSelectedDiet] = useState<"all" | "veg" | "non_veg" | "vegan" | "jain">(
    ["all", "veg", "non_veg", "vegan", "jain"].includes(dietaryParam) ? dietaryParam : "all"
  );
  const [selectedPrice, setSelectedPrice] = useState<"all" | "under-150" | "150-300" | "300-plus">(
    ["all", "under-150", "150-300", "300-plus"].includes(priceParam) ? priceParam : "all"
  );
  const [offersOnly, setOffersOnly] = useState(offersParam);
  const [sortBy, setSortBy] = useState(sortParam);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [openOnly, setOpenOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<"dishes" | "kitchens">("dishes");

  // Popover state
  const [openPricePopover, setOpenPricePopover] = useState(false);
  const [openCuisinePopover, setOpenCuisinePopover] = useState(false);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  // Sync state if URL changes
  React.useEffect(() => {
    if (categoryParam) setSelectedCategory(categoryParam);
    if (queryParam) setSearchQuery(queryParam);
    if (dietaryParam) setSelectedDiet(dietaryParam);
    if (priceParam) setSelectedPrice(priceParam);
    if (offersParam) setOffersOnly(offersParam);
    if (sortParam) setSortBy(sortParam);
  }, [categoryParam, queryParam, dietaryParam, priceParam, offersParam, sortParam]);

  // Extract available cuisines from live items & categories
  const availableCuisines = useMemo(() => {
    const set = new Set<string>();
    homeData.categories.forEach((c) => {
      if (c.id !== "food" && c.id !== "rooms" && c.name) {
        set.add(c.name);
      }
    });
    homeData.allFoodItems.forEach((f) => {
      if (f.categoryName) set.add(f.categoryName);
    });
    return Array.from(set);
  }, [homeData.categories, homeData.allFoodItems]);

  // Dynamic filter counts
  const filterCounts = useMemo(() => {
    const items = searchQuery ? homeData.allFoodItems : homeData.foodItems;
    if (!items || items.length === 0) return { all: 0, veg: 0, non_veg: 0, vegan: 0, jain: 0, under150: 0, price150to300: 0, price300plus: 0, cuisineCounts: {} };

    const cuisineCounts: Record<string, number> = {};
    items.forEach((item) => {
      if (item.categoryName) {
        cuisineCounts[item.categoryName] = (cuisineCounts[item.categoryName] || 0) + 1;
      }
    });

    return {
      all: items.length,
      veg: items.filter((f) => isDishMatchingDiet(f, "veg")).length,
      non_veg: items.filter((f) => isDishMatchingDiet(f, "non_veg")).length,
      vegan: items.filter((f) => isDishMatchingDiet(f, "vegan")).length,
      jain: items.filter((f) => isDishMatchingDiet(f, "jain")).length,
      under150: items.filter((f) => f.price <= 150).length,
      price150to300: items.filter((f) => f.price > 150 && f.price <= 300).length,
      price300plus: items.filter((f) => f.price > 300).length,
      cuisineCounts,
    };
  }, [homeData.foodItems, homeData.allFoodItems, searchQuery]);

  // Filter and sort food items
  const filteredFoodItems = useMemo(() => {
    const sourceItems = searchQuery ? homeData.allFoodItems : homeData.foodItems;
    if (!sourceItems || sourceItems.length === 0) return [];

    let list = sourceItems;

    // Search query
    if (searchQuery.trim()) {
      list = list.filter((f) => matchesDishSearch(searchQuery, f));
    }

    // Category
    if (selectedCategory && selectedCategory !== "all" && selectedCategory !== "food") {
      list = list.filter((f) => matchesDishCategory(selectedCategory, f));
    }

    // Dietary
    if (selectedDiet && selectedDiet !== "all") {
      list = list.filter((f) => isDishMatchingDiet(f, selectedDiet));
    }

    // Price Tier
    if (selectedPrice === "under-150") {
      list = list.filter((f) => f.price <= 150);
    } else if (selectedPrice === "150-300") {
      list = list.filter((f) => f.price > 150 && f.price <= 300);
    } else if (selectedPrice === "300-plus") {
      list = list.filter((f) => f.price > 300);
    }

    // Cuisines
    if (selectedCuisines.length > 0) {
      list = list.filter((f) =>
        selectedCuisines.some((c) => matchesDishCategory(c, f))
      );
    }

    // Open Only
    if (openOnly) {
      list = list.filter((f) => f.sellerIsOnline !== false && f.isAvailable !== false);
    }

    // Offers only
    if (offersOnly) {
      list = list.filter((f) => {
        return homeData.coupons.some(
          (cp: any) => !cp.appliesToSellerId || cp.appliesToSellerId === f.sellerId
        );
      });
    }

    // Sort
    if (sortBy === "rating") {
      list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === "price_asc") {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sortBy === "price_desc") {
      list = [...list].sort((a, b) => b.price - a.price);
    } else if (sortBy === "fastest") {
      list = [...list].sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    }

    return list;
  }, [
    homeData.foodItems,
    homeData.allFoodItems,
    homeData.coupons,
    searchQuery,
    selectedCategory,
    selectedDiet,
    selectedPrice,
    selectedCuisines,
    openOnly,
    offersOnly,
    sortBy,
  ]);

  // Filter and sort kitchens
  const filteredKitchens = useMemo(() => {
    const sourceKitchens = searchQuery ? homeData.allKitchens : homeData.kitchens;
    const sourceFoodItems = searchQuery ? homeData.allFoodItems : homeData.foodItems;
    if (!sourceKitchens || sourceKitchens.length === 0) return [];

    let list = sourceKitchens;

    if (searchQuery.trim()) {
      list = list.filter((k) =>
        matchesKitchenOrDishSearch(searchQuery, k, sourceFoodItems)
      );
    }

    if (selectedCategory && selectedCategory !== "all" && selectedCategory !== "food") {
      list = list.filter(
        (k) =>
          matchesKitchenCategoryFilter(selectedCategory, k, sourceFoodItems) ||
          matchesDishCategory(selectedCategory, { name: k.category, categoryName: k.category })
      );
    }

    if (selectedDiet && selectedDiet !== "all") {
      list = list.filter((k) =>
        isKitchenMatchingDiet(k, selectedDiet, sourceFoodItems)
      );
    }

    if (selectedCuisines.length > 0) {
      list = list.filter((k) =>
        selectedCuisines.some((c) =>
          k.category?.toLowerCase().includes(c.toLowerCase())
        )
      );
    }

    if (openOnly) {
      list = list.filter((k) => k.isOnline !== false);
    }

    if (sortBy === "rating") {
      list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === "fastest") {
      list = [...list].sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    }

    return list;
  }, [
    homeData.kitchens,
    homeData.allKitchens,
    homeData.foodItems,
    homeData.allFoodItems,
    searchQuery,
    selectedCategory,
    selectedDiet,
    selectedCuisines,
    openOnly,
    sortBy,
  ]);

  // Dynamic list of categories with live dish counts and emojis
  const dynamicCategories = useMemo(() => {
    const map = new Map<string, { id: string; name: string; emoji: string; count: number }>();

    const EMOJI_MAP: Record<string, string> = {
      burger: "🍔",
      cake: "🍰",
      meal: "🍱",
      mess: "🍲",
      thali: "🍱",
      biryani: "🍚",
      pizza: "🍕",
      shake: "🥤",
      dalrice: "🍛",
      "dal rice": "🍛",
      dosa: "🥞",
      idli: "🥟",
      pohe: "🥣",
      poha: "🥣",
      sabudana: "🥣",
      shira: "🍮",
      sheera: "🍮",
      upma: "🥣",
      healthy: "🥗",
      dessert: "🍨",
      desserts: "🍨",
      drinks: "🧃",
      drink: "🧃",
      beverages: "🧃",
      beverage: "🧃",
      snacks: "🍟",
      snack: "🍟",
      chinese: "🍜",
      roll: "🌯",
      sandwich: "🥪",
      pastry: "🧁",
      pastries: "🧁",
    };

    if (homeData.categories && Array.isArray(homeData.categories)) {
      homeData.categories
        .filter((c) => c.id !== "food" && c.id !== "rooms" && c.name)
        .forEach((c) => {
          const rawName = c.name.trim();
          const lower = rawName.toLowerCase();
          map.set(lower, {
            id: c.id || lower,
            name: rawName,
            emoji: c.emoji && c.emoji !== "🍽️" && c.emoji !== "🍲" ? c.emoji : (EMOJI_MAP[lower] || "🍲"),
            count: 0,
          });
        });
    }

    const sourceItems = homeData.allFoodItems?.length > 0 ? homeData.allFoodItems : homeData.foodItems;
    sourceItems.forEach((f) => {
      if (f.categoryName && f.categoryName.trim()) {
        const rawName = f.categoryName.trim();
        const lower = rawName.toLowerCase();
        if (lower !== "food" && lower !== "rooms" && !map.has(lower)) {
          map.set(lower, {
            id: lower,
            name: rawName.charAt(0).toUpperCase() + rawName.slice(1),
            emoji: EMOJI_MAP[lower] || "🍲",
            count: 0,
          });
        }
      }
    });

    return Array.from(map.values()).map((cat) => ({
      ...cat,
      count: sourceItems.filter((f) => {
        const matchesCategory = matchesDishCategory(cat.name, f);
        const matchesDiet = selectedDiet === "all" ? true : isDishMatchingDiet(f, selectedDiet);
        return matchesCategory && matchesDiet;
      }).length,
    }));
  }, [homeData.categories, homeData.foodItems, homeData.allFoodItems, selectedDiet]);

  const activeFiltersCount =
    (selectedDiet !== "all" ? 1 : 0) +
    (selectedPrice !== "all" ? 1 : 0) +
    (selectedCategory && selectedCategory !== "all" && selectedCategory !== "food" ? 1 : 0) +
    (selectedCuisines.length > 0 ? 1 : 0) +
    (offersOnly ? 1 : 0) +
    (openOnly ? 1 : 0) +
    (sortBy !== "popular" ? 1 : 0) +
    (searchQuery ? 1 : 0);

  const handleClearAll = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedDiet("all");
    setSelectedPrice("all");
    setSelectedCuisines([]);
    setOffersOnly(false);
    setOpenOnly(false);
    setSortBy("popular");
  };

  const handleAddToCart = (dish: DynamicFoodItem) => {
    if (dish.sellerIsOnline === false || dish.isAvailable === false) {
      alert("This item is currently unavailable.");
      return;
    }

    const rawStock = dish.maxStock !== undefined ? dish.maxStock : dish.stockQuantity;
    const stockLimit = rawStock !== undefined && rawStock !== null && !isNaN(Number(rawStock)) ? Number(rawStock) : -1;

    if (stockLimit === 0) {
      alert(`Sorry, "${dish.name}" is currently out of stock.`);
      return;
    }

    const currentInCart = cartItems.find((ci) => ci.id === dish.id || ci.foodItemId === dish.id);
    if (currentInCart && stockLimit !== -1 && currentInCart.quantity >= stockLimit) {
      alert(`Cannot add more. Only ${stockLimit} item(s) available in stock for "${dish.name}".`);
      return;
    }

    addToCart({
      id: dish.id,
      foodItemId: dish.id,
      name: dish.name,
      price: dish.price,
      quantity: 1,
      sellerId: dish.sellerId || "k-1",
      sellerName: dish.sellerName || "Verified Cloud Kitchen",
      image: dish.imageUrl || "/images/places/place-biryani.png",
      imageUrl: dish.imageUrl || "/images/places/place-biryani.png",
      stockQuantity: stockLimit,
      maxStock: stockLimit,
      itemType: dish.itemType,
    });

    setAddedIds((prev) => ({ ...prev, [dish.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [dish.id]: false }));
    }, 1800);
  };

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "linear-gradient(180deg, #FFF6ED 0%, #FFFFFF 30%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* 1. Navbar */}
      <Navbar
        hideSearch={false}
        selectedDiet={
          selectedDiet === "non_veg"
            ? "non-veg"
            : selectedDiet === "vegan"
            ? "vegan"
            : selectedDiet === "jain"
            ? "jain"
            : selectedDiet === "veg"
            ? "veg"
            : "all"
        }
        onDietChange={(diet) => {
          setSelectedDiet(
            diet === "non-veg" || diet === "non_veg"
              ? "non_veg"
              : diet === "vegan"
              ? "vegan"
              : diet === "jain"
              ? "jain"
              : diet === "veg"
              ? "veg"
              : "all"
          );
        }}
      />

      {/* Main Container */}
      <main
        style={{
          width: "1440px",
          maxWidth: "100%",
          padding: "32px 60px 80px 60px",
          display: "flex",
          flexDirection: "column",
          gap: "28px",
          boxSizing: "border-box",
        }}
        className="food-explore-container"
      >
        {/* Header Title + Location Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "clamp(1.5rem, 3vw, 2.1rem)",
                fontWeight: "800",
                color: "#18181B",
                margin: "0 0 6px 0",
                letterSpacing: "-0.02em",
              }}
            >
              Explore Food &amp; Cloud Kitchens
            </h1>
            <p style={{ margin: 0, fontSize: "0.95rem", color: "#64748B", fontWeight: "500" }}>
              {defaultAddress?.pincode ? (
                <>
                  Delivering near <strong style={{ color: "#FF6B00" }}>{defaultAddress.city || "Pune"} ({defaultAddress.pincode})</strong> within 5 km coverage radius
                </>
              ) : (
                "Discover delicious chef-crafted food and cloud kitchens nearby"
              )}
            </p>
          </div>

          {/* Quick Tab Switcher: Dishes vs Kitchens */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "#FFFFFF",
              borderRadius: "14px",
              padding: "4px",
              border: "1.5px solid #E2E8F0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab("dishes")}
              style={{
                padding: "8px 18px",
                borderRadius: "10px",
                border: "none",
                backgroundColor: activeTab === "dishes" ? "#FF6B00" : "transparent",
                color: activeTab === "dishes" ? "#FFFFFF" : "#64748B",
                fontWeight: "700",
                fontSize: "0.9rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              Dishes ({filteredFoodItems.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("kitchens")}
              style={{
                padding: "8px 18px",
                borderRadius: "10px",
                border: "none",
                backgroundColor: activeTab === "kitchens" ? "#FF6B00" : "transparent",
                color: activeTab === "kitchens" ? "#FFFFFF" : "#64748B",
                fontWeight: "700",
                fontSize: "0.9rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              Cloud Kitchens ({filteredKitchens.length})
            </button>
          </div>
        </div>

        {/* Dynamic Category Chips */}
        {dynamicCategories.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              overflowX: "auto",
              scrollbarWidth: "none",
              paddingBottom: "4px",
            }}
            className="hide-scrollbar"
          >
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("");
                if (typeof window !== "undefined") {
                  const params = new URLSearchParams(window.location.search);
                  params.delete("category");
                  const newUrl = params.toString() ? `/food-explore?${params.toString()}` : "/food-explore";
                  router.replace(newUrl, { scroll: false });
                }
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: "12px",
                border: !selectedCategory ? "1.5px solid #FF6B00" : "1px solid #E2E8F0",
                backgroundColor: !selectedCategory ? "#FFF3EB" : "#FFFFFF",
                color: !selectedCategory ? "#FF6B00" : "#475569",
                fontWeight: "700",
                fontSize: "0.88rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
                transition: "all 0.2s ease",
              }}
            >
              <span>🍽️</span>
              <span>All Cuisines</span>
            </button>
            {dynamicCategories.map((cat) => {
              const isSelected = selectedCategory.toLowerCase().trim() === cat.name.toLowerCase().trim();
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    const newCat = isSelected ? "" : cat.name;
                    setSelectedCategory(newCat);
                    if (typeof window !== "undefined") {
                      const params = new URLSearchParams(window.location.search);
                      if (newCat) {
                        params.set("category", newCat);
                      } else {
                        params.delete("category");
                      }
                      const newUrl = params.toString() ? `/food-explore?${params.toString()}` : "/food-explore";
                      router.replace(newUrl, { scroll: false });
                    }
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    borderRadius: "12px",
                    border: isSelected ? "1.5px solid #FF6B00" : "1px solid #E2E8F0",
                    backgroundColor: isSelected ? "#FFF3EB" : "#FFFFFF",
                    color: isSelected ? "#FF6B00" : "#475569",
                    fontWeight: isSelected ? "700" : "600",
                    fontSize: "0.88rem",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    transition: "all 0.2s ease",
                  }}
                >
                  <span>{cat.emoji || "🍲"}</span>
                  <span>{cat.name}</span>
                  {cat.count > 0 && (
                    <span
                      style={{
                        fontSize: "0.72rem",
                        padding: "1px 6px",
                        borderRadius: "8px",
                        backgroundColor: isSelected ? "#FFEDD5" : "#F1F5F9",
                        color: isSelected ? "#EA580C" : "#64748B",
                        fontWeight: "700",
                      }}
                    >
                      {cat.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Multi-Dimensional Filter Bar */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            backgroundColor: "#FFFFFF",
            borderRadius: "20px",
            padding: "16px 20px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 4px 18px rgba(0, 0, 0, 0.03)",
            position: "relative",
            zIndex: 40,
          }}
        >
          {/* Top Filter Row: Search + Clear */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            {/* Search Input */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flex: "1 1 300px",
                backgroundColor: "#F8FAFC",
                borderRadius: "14px",
                padding: "10px 16px",
                border: "1px solid #E2E8F0",
              }}
            >
              <Search size={18} color="#94A3B8" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dishes, biryani, cakes, burgers, cloud kitchens..."
                style={{
                  border: "none",
                  outline: "none",
                  backgroundColor: "transparent",
                  width: "100%",
                  fontSize: "0.92rem",
                  color: "#18181B",
                  fontWeight: "500",
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "2px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <X size={16} color="#94A3B8" />
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#64748B" }}>Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: "9px 14px",
                  borderRadius: "12px",
                  border: "1px solid #E2E8F0",
                  backgroundColor: "#FFFFFF",
                  fontSize: "0.88rem",
                  fontWeight: "700",
                  color: "#18181B",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value="popular">Most Popular</option>
                <option value="rating">Rating: High to Low ⭐</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="fastest">Fastest Delivery ⚡</option>
              </select>
            </div>

            {/* Clear All Button */}
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "12px",
                  border: "1.5px solid #FF6B00",
                  backgroundColor: "#FFF3EB",
                  color: "#FF6B00",
                  fontSize: "0.85rem",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                <SlidersHorizontal size={14} />
                <span>Clear All ({activeFiltersCount})</span>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Bottom Filter Row: Dietary, Price, Cuisines, Toggles */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
              position: "relative",
              zIndex: 45,
            }}
          >
            {/* Dietary Filter Pills */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              {[
                { id: "all", label: "All Diet", count: filterCounts.all },
                { id: "veg", label: "Pure Veg 🥦", count: filterCounts.veg },
                { id: "non_veg", label: "Non-Veg 🍗", count: filterCounts.non_veg },
                { id: "vegan", label: "Vegan 🌱", count: filterCounts.vegan },
                { id: "jain", label: "Jain 🌿", count: filterCounts.jain },
              ].map((d) => {
                const isSelected = selectedDiet === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedDiet(d.id as any)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 12px",
                      borderRadius: "10px",
                      border: isSelected ? "1.5px solid #10B981" : "1px solid #E2E8F0",
                      backgroundColor: isSelected ? "#ECFDF5" : "#FFFFFF",
                      color: isSelected ? "#047857" : "#475569",
                      fontWeight: isSelected ? "700" : "600",
                      fontSize: "0.82rem",
                      cursor: "pointer",
                    }}
                  >
                    <span>{d.label}</span>
                    {d.count > 0 && (
                      <span style={{ fontSize: "11px", opacity: 0.8 }}>({d.count})</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Price Range Dropdown */}
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setOpenPricePopover(!openPricePopover)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 14px",
                  borderRadius: "10px",
                  border: selectedPrice !== "all" ? "1.5px solid #FF6B00" : "1px solid #E2E8F0",
                  backgroundColor: selectedPrice !== "all" ? "#FFF3EB" : "#FFFFFF",
                  color: selectedPrice !== "all" ? "#FF6B00" : "#475569",
                  fontWeight: selectedPrice !== "all" ? "700" : "600",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                <span>
                  {selectedPrice === "under-150"
                    ? "Under ₹150"
                    : selectedPrice === "150-300"
                    ? "₹150 – ₹300"
                    : selectedPrice === "300-plus"
                    ? "₹300+"
                    : "Price Range"}
                </span>
                <ChevronDown size={13} />
              </button>

              {openPricePopover && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    left: 0,
                    backgroundColor: "#FFFFFF",
                    borderRadius: "14px",
                    padding: "8px",
                    boxShadow: "0 16px 36px rgba(0,0,0,0.16)",
                    border: "1px solid #E2E8F0",
                    zIndex: 1000,
                    minWidth: "190px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  {[
                    { id: "all", label: "Any Price", count: filterCounts.all },
                    { id: "under-150", label: "Under ₹150 (Budget)", count: filterCounts.under150 },
                    { id: "150-300", label: "₹150 – ₹300 (Standard)", count: filterCounts.price150to300 },
                    { id: "300-plus", label: "₹300+ (Premium)", count: filterCounts.price300plus },
                  ].map((p) => {
                    const isSelected = selectedPrice === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPrice(p.id as any);
                          setOpenPricePopover(false);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 10px",
                          borderRadius: "8px",
                          border: "none",
                          backgroundColor: isSelected ? "#FFF3EB" : "transparent",
                          color: isSelected ? "#FF6B00" : "#334155",
                          fontWeight: isSelected ? "700" : "500",
                          fontSize: "13px",
                          cursor: "pointer",
                        }}
                      >
                        <span>{p.label}</span>
                        {p.count > 0 && <span style={{ fontSize: "11px", color: "#94A3B8" }}>({p.count})</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cuisines Dropdown */}
            {availableCuisines.length > 0 && (
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setOpenCuisinePopover(!openCuisinePopover)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "7px 14px",
                    borderRadius: "10px",
                    border: selectedCuisines.length > 0 ? "1.5px solid #FF6B00" : "1px solid #E2E8F0",
                    backgroundColor: selectedCuisines.length > 0 ? "#FFF3EB" : "#FFFFFF",
                    color: selectedCuisines.length > 0 ? "#FF6B00" : "#475569",
                    fontWeight: selectedCuisines.length > 0 ? "700" : "600",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  <UtensilsCrossed size={14} />
                  <span>
                    {selectedCuisines.length > 0 ? `Cuisines (${selectedCuisines.length})` : "Cuisines"}
                  </span>
                  <ChevronDown size={13} />
                </button>

                {openCuisinePopover && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 6px)",
                      left: 0,
                      backgroundColor: "#FFFFFF",
                      borderRadius: "14px",
                      padding: "8px",
                      boxShadow: "0 16px 36px rgba(0,0,0,0.16)",
                      border: "1px solid #E2E8F0",
                      zIndex: 1000,
                      minWidth: "220px",
                      maxHeight: "260px",
                      overflowY: "auto",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    {availableCuisines.map((c) => {
                      const isSelected = selectedCuisines.includes(c);
                      const count = filterCounts.cuisineCounts[c];
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setSelectedCuisines((prev) =>
                              prev.includes(c) ? prev.filter((item) => item !== c) : [...prev, c]
                            );
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "7px 10px",
                            borderRadius: "8px",
                            border: "none",
                            backgroundColor: isSelected ? "#FFF3EB" : "transparent",
                            color: isSelected ? "#FF6B00" : "#334155",
                            fontWeight: isSelected ? "700" : "500",
                            fontSize: "13px",
                            cursor: "pointer",
                          }}
                        >
                          <span>{c}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            {count !== undefined && <span style={{ fontSize: "11px", color: "#94A3B8" }}>({count})</span>}
                            {isSelected && <Check size={14} color="#FF6B00" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Quick Toggle: Offers Only */}
            <button
              type="button"
              onClick={() => setOffersOnly(!offersOnly)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 14px",
                borderRadius: "10px",
                border: offersOnly ? "1.5px solid #FF6B00" : "1px solid #E2E8F0",
                backgroundColor: offersOnly ? "#FF6B00" : "#FFFFFF",
                color: offersOnly ? "#FFFFFF" : "#475569",
                fontWeight: offersOnly ? "700" : "600",
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              <Tag size={14} color={offersOnly ? "#FFFFFF" : "#FF6B00"} />
              <span>Offers &amp; Deals</span>
            </button>

            {/* Quick Toggle: Open Kitchens Only */}
            <button
              type="button"
              onClick={() => setOpenOnly(!openOnly)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 14px",
                borderRadius: "10px",
                border: openOnly ? "1.5px solid #10B981" : "1px solid #E2E8F0",
                backgroundColor: openOnly ? "#ECFDF5" : "#FFFFFF",
                color: openOnly ? "#047857" : "#475569",
                fontWeight: openOnly ? "700" : "600",
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: openOnly ? "#10B981" : "#94A3B8" }} />
              <span>Open Kitchens</span>
            </button>
          </div>
        </div>

        {/* 2. Results Content: Dishes Grid or Kitchens Grid */}
        {activeTab === "dishes" ? (
          <div>
            {homeData.isLoading ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                  gap: "20px",
                  width: "100%",
                }}
                className="food-explore-grid"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div
                    key={i}
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: "20px",
                      height: "320px",
                      border: "1px solid #F1F5F9",
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    <div style={{ width: "100%", height: "170px", backgroundColor: "#F1F5F9", borderRadius: "14px" }} />
                    <div style={{ width: "70%", height: "20px", backgroundColor: "#F1F5F9", borderRadius: "6px" }} />
                    <div style={{ width: "45%", height: "16px", backgroundColor: "#F1F5F9", borderRadius: "4px" }} />
                    <div style={{ width: "90%", height: "36px", backgroundColor: "#F1F5F9", borderRadius: "10px", marginTop: "auto" }} />
                  </div>
                ))}
              </div>
            ) : filteredFoodItems.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                  gap: "20px",
                  width: "100%",
                }}
                className="food-explore-grid"
              >
                {filteredFoodItems.map((dish) => {
                  const isSellerClosed = dish.sellerIsOnline === false;
                  const isOutOfStock = dish.stockQuantity === 0 || dish.maxStock === 0;
                  const isItemUnavailable = dish.isAvailable === false || isOutOfStock;
                  const isClosed = isSellerClosed || isItemUnavailable;
                  const isAdded = addedIds[dish.id];
                  const currentInCart = cartItems.find((ci) => ci.id === dish.id || ci.foodItemId === dish.id);
                  const isMaxStockInCart = !isClosed && dish.stockQuantity !== undefined && dish.stockQuantity > 0 && (currentInCart ? currentInCart.quantity >= dish.stockQuantity : false);

                  // Check if dish has an applicable coupon
                  const matchedCoupon = homeData.coupons.find(
                    (cp: any) => !cp.appliesToSellerId || cp.appliesToSellerId === dish.sellerId
                  );

                  return (
                    <div
                      key={dish.id}
                      style={{
                        backgroundColor: isClosed ? "#F8FAFC" : "#FFFFFF",
                        borderRadius: "20px",
                        overflow: "hidden",
                        border: isClosed ? "1.5px solid #E2E8F0" : "1px solid #F1F5F9",
                        boxShadow: isClosed ? "0 2px 8px rgba(0, 0, 0, 0.02)" : "0 4px 16px rgba(0, 0, 0, 0.04)",
                        display: "flex",
                        flexDirection: "column",
                        transition: "all 0.25s ease",
                        opacity: isClosed ? 0.75 : 1,
                      }}
                      className="food-explore-card"
                    >
                      {/* Image Box */}
                      <div
                        style={{
                          width: "100%",
                          height: "170px",
                          position: "relative",
                          overflow: "hidden",
                          backgroundColor: "#F1F5F9",
                        }}
                      >
                        {/* Dietary Tag */}
                        <div style={{ position: "absolute", top: "10px", left: "10px", zIndex: 2 }}>
                          <DietaryTag
                            itemType={
                              dish.itemType ||
                              (dish.name.toLowerCase().includes("chicken") ||
                              dish.name.toLowerCase().includes("biryani")
                                ? "NON_VEG"
                                : "VEG")
                            }
                            size="sm"
                          />
                        </div>

                        {/* Offer Badge if coupon exists */}
                        {matchedCoupon && !isClosed && (
                          <div
                            style={{
                              position: "absolute",
                              top: "10px",
                              right: "10px",
                              backgroundColor: "#FF5500",
                              color: "#FFFFFF",
                              fontSize: "10.5px",
                              fontWeight: "800",
                              padding: "3px 8px",
                              borderRadius: "8px",
                              boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                              zIndex: 2,
                            }}
                          >
                            {matchedCoupon.discountPercentage
                              ? `${matchedCoupon.discountPercentage}% OFF`
                              : `₹${matchedCoupon.discountAmount} OFF`}
                          </div>
                        )}

                        {/* Image */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={dish.imageUrl || "/images/places/place-biryani.png"}
                          alt={dish.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            filter: isClosed ? "grayscale(80%)" : "none",
                            transition: "transform 0.3s ease",
                          }}
                          className="food-card-img"
                        />

                        {/* Out of Stock / Closed Cross Band Overlay */}
                        {isClosed && (
                          <div
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              backgroundColor: "rgba(15, 23, 42, 0.45)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              zIndex: 3,
                            }}
                          >
                            <span
                              style={{
                                backgroundColor: isOutOfStock ? "#DC2626" : "#0F172A",
                                color: "#FFFFFF",
                                fontSize: "11px",
                                fontWeight: "800",
                                letterSpacing: "0.8px",
                                padding: "5px 12px",
                                borderRadius: "12px",
                                textTransform: "uppercase",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                                border: "1px solid rgba(255,255,255,0.25)",
                              }}
                            >
                              {isOutOfStock ? "Out of Stock" : isSellerClosed ? "Closed" : "Unavailable"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card Info */}
                      <div
                        style={{
                          padding: "14px 16px 16px 16px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                          flex: 1,
                        }}
                      >
                        {/* Rating + Time Row */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            fontSize: "0.82rem",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <Star size={14} fill={isClosed ? "#94A3B8" : "#F59E0B"} color={isClosed ? "#94A3B8" : "#F59E0B"} />
                            <span style={{ fontWeight: "800", color: isClosed ? "#94A3B8" : "#18181B" }}>
                              {dish.rating || 5.0}
                            </span>
                          </div>
                          <span style={{ color: "#64748B", fontWeight: "600" }}>
                            {dish.deliveryTime || "20-30 min"}
                          </span>
                        </div>

                        {/* Title & Kitchen Name */}
                        <div>
                          <h3
                            style={{
                              fontSize: "1.05rem",
                              fontWeight: "800",
                              color: isClosed ? "#64748B" : "#18181B",
                              margin: "0 0 2px 0",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {dish.name}
                          </h3>
                          <Link
                            href={dish.sellerTrackingId ? `/shop/${dish.sellerTrackingId}` : "#"}
                            style={{
                              fontSize: "0.82rem",
                              color: "#64748B",
                              fontWeight: "600",
                              textDecoration: "none",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <span>by {dish.sellerName || "Verified Cloud Kitchen"}</span>
                          </Link>
                        </div>

                        {/* Stock Quantity / Status Text */}
                        {isOutOfStock ? (
                          <div style={{ fontSize: "0.78rem", color: "#DC2626", fontWeight: "700" }}>
                            Out of stock
                          </div>
                        ) : isMaxStockInCart ? (
                          <div style={{ fontSize: "0.76rem", color: "#D97706", fontWeight: "700" }}>
                            Max in cart ({dish.stockQuantity})
                          </div>
                        ) : dish.stockQuantity !== undefined && dish.stockQuantity > 0 && dish.stockQuantity <= 5 ? (
                          <div style={{ fontSize: "0.76rem", color: "#EA580C", fontWeight: "700" }}>
                            Only {dish.stockQuantity} left in stock
                          </div>
                        ) : null}

                        {/* Distance Badge */}
                        {dish.distanceText && (
                          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", color: "#FF6B00", fontWeight: "700" }}>
                            <MapPin size={13} />
                            <span>{dish.distanceText} away</span>
                          </div>
                        )}

                        {/* Price & Action Button Row */}
                        <div
                          style={{
                            marginTop: "auto",
                            paddingTop: "10px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            borderTop: "1px solid #F1F5F9",
                          }}
                        >
                          <div>
                            <span style={{ fontSize: "1.15rem", fontWeight: "800", color: isClosed ? "#64748B" : "#18181B" }}>
                              ₹{dish.price}
                            </span>
                          </div>

                          {isClosed ? (
                            <span
                              style={{
                                backgroundColor: "#F1F5F9",
                                color: "#94A3B8",
                                fontSize: "0.82rem",
                                fontWeight: "700",
                                padding: "6px 14px",
                                borderRadius: "10px",
                                border: "1px solid #E2E8F0",
                                cursor: "not-allowed",
                              }}
                            >
                              {isOutOfStock ? "Out of Stock" : isSellerClosed ? "Closed" : "Unavailable"}
                            </span>
                          ) : isMaxStockInCart ? (
                            <span
                              style={{
                                backgroundColor: "#FFFBEB",
                                color: "#D97706",
                                fontSize: "0.8rem",
                                fontWeight: "700",
                                padding: "6px 12px",
                                borderRadius: "10px",
                                border: "1px solid #FDE68A",
                              }}
                            >
                              Max In Cart
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddToCart(dish)}
                              style={{
                                backgroundColor: isAdded ? "#10B981" : "#FF6B00",
                                color: "#FFFFFF",
                                fontSize: "0.86rem",
                                fontWeight: "700",
                                padding: "7px 16px",
                                borderRadius: "12px",
                                border: "none",
                                cursor: "pointer",
                                boxShadow: isAdded
                                  ? "0 4px 12px rgba(16, 185, 129, 0.25)"
                                  : "0 4px 12px rgba(255, 107, 0, 0.25)",
                                transition: "all 0.2s ease",
                              }}
                            >
                              {isAdded ? "Added! ✓" : "Add to Cart"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  width: "100%",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "20px",
                  padding: "48px 24px",
                  textAlign: "center",
                  border: "1px solid #E2E8F0",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "14px",
                }}
              >
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    backgroundColor: "#FFF3EB",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FF6B00",
                  }}
                >
                  <UtensilsCrossed size={32} />
                </div>
                <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "800", color: "#18181B" }}>
                  No Dishes Found Matching Your Criteria
                </h3>
                <p style={{ margin: 0, color: "#64748B", fontSize: "0.92rem", maxWidth: "420px" }}>
                  Try relaxing your dietary, price, or cuisine filters to see more delicious meals from our cloud kitchens.
                </p>
                <button
                  type="button"
                  onClick={handleClearAll}
                  style={{
                    backgroundColor: "#FF6B00",
                    color: "#FFFFFF",
                    padding: "10px 22px",
                    borderRadius: "12px",
                    fontWeight: "700",
                    fontSize: "0.92rem",
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(255, 107, 0, 0.25)",
                  }}
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Cloud Kitchens Grid */
          <div>
            {homeData.isLoading ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: "24px",
                  width: "100%",
                }}
                className="kitchens-explore-grid"
              >
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: "20px",
                      height: "300px",
                      border: "1px solid #F1F5F9",
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    <div style={{ width: "100%", height: "170px", backgroundColor: "#F1F5F9", borderRadius: "14px" }} />
                    <div style={{ width: "65%", height: "22px", backgroundColor: "#F1F5F9", borderRadius: "6px" }} />
                    <div style={{ width: "40%", height: "16px", backgroundColor: "#F1F5F9", borderRadius: "4px" }} />
                  </div>
                ))}
              </div>
            ) : filteredKitchens.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: "24px",
                  width: "100%",
                }}
                className="kitchens-explore-grid"
              >
                {filteredKitchens.map((kitchen) => {
                  const isClosed = kitchen.isOnline === false;
                  return (
                    <Link
                      key={kitchen.id}
                      href={`/shop/${kitchen.trackingId || kitchen.id}`}
                      style={{ textDecoration: "none" }}
                    >
                      <div
                        style={{
                          backgroundColor: isClosed ? "#F8FAFC" : "#FFFFFF",
                          borderRadius: "20px",
                          overflow: "hidden",
                          border: isClosed ? "1px solid #E2E8F0" : "1px solid #F1F5F9",
                          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
                          display: "flex",
                          flexDirection: "column",
                          transition: "all 0.25s ease",
                          cursor: "pointer",
                          opacity: isClosed ? 0.85 : 1,
                        }}
                        className="kitchen-explore-card"
                      >
                        {/* Kitchen Banner Image */}
                        <div
                          style={{
                            width: "100%",
                            height: "170px",
                            position: "relative",
                            overflow: "hidden",
                            backgroundColor: "#F1F5F9",
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={kitchen.imageUrl || "/images/places/place-pizza.png"}
                            alt={kitchen.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              filter: isClosed ? "grayscale(100%)" : "none",
                            }}
                          />
                          {/* Status Badge */}
                          <div
                            style={{
                              position: "absolute",
                              top: "10px",
                              right: "10px",
                              backgroundColor: isClosed ? "#0F172A" : "#10B981",
                              color: "#FFFFFF",
                              fontSize: "11px",
                              fontWeight: "800",
                              padding: "4px 10px",
                              borderRadius: "8px",
                              letterSpacing: "0.5px",
                            }}
                          >
                            {isClosed ? "CLOSED" : "OPEN NOW"}
                          </div>
                        </div>

                        {/* Kitchen Details */}
                        <div
                          style={{
                            padding: "16px 18px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <h3
                              style={{
                                fontSize: "1.1rem",
                                fontWeight: "800",
                                color: isClosed ? "#64748B" : "#18181B",
                                margin: 0,
                              }}
                            >
                              {kitchen.name}
                            </h3>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <Star size={14} fill={isClosed ? "#94A3B8" : "#F59E0B"} color={isClosed ? "#94A3B8" : "#F59E0B"} />
                              <span style={{ fontWeight: "800", fontSize: "0.85rem", color: isClosed ? "#94A3B8" : "#18181B" }}>
                                {kitchen.rating || 5.0}
                              </span>
                            </div>
                          </div>

                          <span style={{ fontSize: "0.85rem", color: "#64748B", fontWeight: "600" }}>
                            {kitchen.category} • {kitchen.time || "20-30 min"}
                          </span>

                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px" }}>
                            <span style={{ fontSize: "0.82rem", color: "#94A3B8" }}>
                              📍 {kitchen.locality || kitchen.city || "Pune"} {kitchen.distanceText ? `(${kitchen.distanceText})` : ""}
                            </span>
                            <span style={{ fontSize: "0.85rem", color: "#FF6B00", fontWeight: "700" }}>
                              View Menu →
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  width: "100%",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "20px",
                  padding: "48px 24px",
                  textAlign: "center",
                  border: "1px solid #E2E8F0",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "14px",
                }}
              >
                <Store size={40} color="#FF6B00" />
                <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "800", color: "#18181B" }}>
                  No Cloud Kitchens Found
                </h3>
                <p style={{ margin: 0, color: "#64748B", fontSize: "0.92rem" }}>
                  Try changing your location or clearing filters to see more kitchens.
                </p>
                <button
                  type="button"
                  onClick={handleClearAll}
                  style={{
                    backgroundColor: "#FF6B00",
                    color: "#FFFFFF",
                    padding: "10px 22px",
                    borderRadius: "12px",
                    fontWeight: "700",
                    fontSize: "0.92rem",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />

      <style jsx>{`
        .food-explore-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 14px 30px rgba(0, 0, 0, 0.08) !important;
        }
        .food-explore-card:hover .food-card-img {
          transform: scale(1.05);
        }
        .kitchen-explore-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 14px 30px rgba(0, 0, 0, 0.08) !important;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        @media (max-width: 1200px) {
          .food-explore-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 900px) {
          .food-explore-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .kitchens-explore-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .food-explore-container {
            padding: 20px 16px 60px 16px !important;
          }
        }
        @media (max-width: 600px) {
          .food-explore-grid {
            grid-template-columns: 1fr !important;
          }
          .kitchens-explore-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function FoodExplorePage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: "16px", fontWeight: "700", color: "#FF6B00" }}>Loading delicious dishes...</div>
        </div>
      }
    >
      <FoodExploreContent />
    </Suspense>
  );
}
