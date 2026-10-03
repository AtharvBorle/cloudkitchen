"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/navbar";
import { Footer } from "@/components/explore-desktop/footer";
import { useHomeData, DynamicFoodItem, DynamicKitchen } from "@/lib/useHomeData";
import { useLocation } from "@/components/location-provider";
import { useCart, generateCartItemId, AddonItem } from "@/context/CartContext";
import { DietaryTag } from "@/components/common/DietaryTag";
import { AddonCustomizationModal } from "@/components/cart/AddonCustomizationModal";
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
  ChevronRight,
  ChevronLeft,
  ArrowUp,
  Store,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import {
  isKitchenMatchingDiet,
  isDishMatchingDiet,
  isNonVegDish,
  matchesKitchenOrDishSearch,
  matchesDishSearch,
  matchesDishCategory,
  matchesKitchenCategoryFilter,
  isDishMatchingCuisine,
  isKitchenServingCuisine,
  isKitchenHavingOffers,
  isDishHavingOffers,
  getDishOfferBadge,
} from "@/lib/dietary-filter";
import Link from "next/link";

function parseDishAddons(rawAddons: any): AddonItem[] {
  if (!rawAddons) return [];
  try {
    const p = typeof rawAddons === "string" ? JSON.parse(rawAddons) : rawAddons;
    if (Array.isArray(p) && p.length > 0) {
      return p
        .filter((a: any) => a && (a.name || "").trim())
        .map((a: any, idx: number) => ({
          id: String(a.id || `addon_${idx + 1}`),
          name: String(a.name || "").trim(),
          price: Math.max(0, parseFloat(a.price) || 0),
        }));
    }
  } catch {}
  return [];
}

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
  const { addToCart, decreaseQuantity, showToast, cartItems } = useCart();
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
  const categoryScrollRef = React.useRef<HTMLDivElement>(null);

  // Popover & Modal state
  const [openPricePopover, setOpenPricePopover] = useState(false);
  const [openCuisinePopover, setOpenCuisinePopover] = useState(false);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [addonModalDish, setAddonModalDish] = useState<(DynamicFoodItem & { parsedAddons: AddonItem[] }) | null>(null);

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
    availableCuisines.forEach((c) => {
      cuisineCounts[c] = items.filter((f) => isDishMatchingCuisine(c, f)).length;
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
  }, [homeData.foodItems, homeData.allFoodItems, availableCuisines, searchQuery]);

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
        selectedCuisines.some((c) => isDishMatchingCuisine(c, f))
      );
    }

    // Open Only
    if (openOnly) {
      list = list.filter((f) => f.sellerIsOnline !== false && f.isAvailable !== false);
    }

    // Offers only
    if (offersOnly) {
      list = list.filter((f) => isDishHavingOffers(f, homeData.coupons));
    }

    // Sort
    const getDishDeliveryMinutes = (f: DynamicFoodItem): number => {
      if (f.distanceKm != null && !isNaN(f.distanceKm)) {
        return f.distanceKm * 6 + 10;
      }
      if (f.deliveryTime) {
        const m = f.deliveryTime.match(/\d+/);
        if (m) return parseInt(m[0], 10);
      }
      return 40;
    };

    if (sortBy === "rating") {
      list = [...list].sort((a, b) => {
        const rA = Number(a.rating) || 0;
        const rB = Number(b.rating) || 0;
        if (rB !== rA) return rB - rA;
        return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
      });
    } else if (sortBy === "price_asc") {
      list = [...list].sort((a, b) => {
        const pA = Number(a.price) || 0;
        const pB = Number(b.price) || 0;
        if (pA !== pB) return pA - pB;
        return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      });
    } else if (sortBy === "price_desc") {
      list = [...list].sort((a, b) => {
        const pA = Number(a.price) || 0;
        const pB = Number(b.price) || 0;
        if (pB !== pA) return pB - pA;
        return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      });
    } else if (sortBy === "fastest") {
      list = [...list].sort((a, b) => {
        if ((a.sellerIsOnline === false) !== (b.sellerIsOnline === false)) {
          return a.sellerIsOnline === false ? 1 : -1;
        }
        const timeA = getDishDeliveryMinutes(a);
        const timeB = getDishDeliveryMinutes(b);
        if (timeA !== timeB) return timeA - timeB;
        return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
      });
    } else if (sortBy === "popular") {
      list = [...list].sort((a, b) => {
        if ((a.sellerIsOnline === false) !== (b.sellerIsOnline === false)) {
          return a.sellerIsOnline === false ? 1 : -1;
        }
        const rA = Number(a.rating) || 0;
        const rB = Number(b.rating) || 0;
        if (rB !== rA) return rB - rA;
        return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
      });
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
          isKitchenServingCuisine(c, k, sourceFoodItems)
        )
      );
    }

    if (openOnly) {
      list = list.filter((k) => k.isOnline !== false);
    }

    if (offersOnly) {
      list = list.filter((k) =>
        isKitchenHavingOffers(k, homeData.coupons, sourceFoodItems)
      );
    }

    if (selectedPrice && selectedPrice !== "all") {
      list = list.filter((k) => {
        const kId = (k.id || "").toLowerCase().trim();
        const kTracking = (k.trackingId || "").toLowerCase().trim();
        const kName = (k.name || "").toLowerCase().trim();

        const dishes = sourceFoodItems.filter((f) => {
          const fSellerId = (f.sellerId || "").toLowerCase().trim();
          const fTracking = (f.sellerTrackingId || "").toLowerCase().trim();
          const fSellerName = (f.sellerName || "").toLowerCase().trim();
          return (
            (kId && fSellerId && (fSellerId === kId || fTracking === kId)) ||
            (kTracking && (fTracking === kTracking || fSellerId === kTracking)) ||
            (kName && fSellerName && (kName === fSellerName || kName.includes(fSellerName) || fSellerName.includes(kName)))
          );
        });

        const prices = dishes.map((d) => Number(d.price) || 0).filter((pr) => pr > 0);
        if (prices.length === 0) return false;

        if (selectedPrice === "under-150") return prices.some((p) => p <= 150);
        if (selectedPrice === "150-300") return prices.some((p) => p >= 150 && p <= 300);
        if (selectedPrice === "300-plus") return prices.some((p) => p >= 300);
        return true;
      });
    }

    const getKitchenMinPrice = (k: DynamicKitchen): number => {
      const kId = (k.id || "").toLowerCase().trim();
      const kTracking = (k.trackingId || "").toLowerCase().trim();
      const kName = (k.name || "").toLowerCase().trim();

      const kDishes = sourceFoodItems.filter((f) => {
        const fSellerId = (f.sellerId || "").toLowerCase().trim();
        const fTracking = (f.sellerTrackingId || "").toLowerCase().trim();
        const fSellerName = (f.sellerName || "").toLowerCase().trim();
        return (
          (kId && fSellerId && (fSellerId === kId || fTracking === kId)) ||
          (kTracking && (fTracking === kTracking || fSellerId === kTracking)) ||
          (kName && fSellerName && (kName === fSellerName || kName.includes(fSellerName) || fSellerName.includes(kName)))
        );
      });
      const prices = kDishes.map((d) => Number(d.price) || 0).filter((p) => p > 0);
      return prices.length > 0 ? Math.min(...prices) : 999999;
    };

    const getKitchenMaxPrice = (k: DynamicKitchen): number => {
      const kId = (k.id || "").toLowerCase().trim();
      const kTracking = (k.trackingId || "").toLowerCase().trim();
      const kName = (k.name || "").toLowerCase().trim();

      const kDishes = sourceFoodItems.filter((f) => {
        const fSellerId = (f.sellerId || "").toLowerCase().trim();
        const fTracking = (f.sellerTrackingId || "").toLowerCase().trim();
        const fSellerName = (f.sellerName || "").toLowerCase().trim();
        return (
          (kId && fSellerId && (fSellerId === kId || fTracking === kId)) ||
          (kTracking && (fTracking === kTracking || fSellerId === kTracking)) ||
          (kName && fSellerName && (kName === fSellerName || kName.includes(fSellerName) || fSellerName.includes(kName)))
        );
      });
      const prices = kDishes.map((d) => Number(d.price) || 0).filter((p) => p > 0);
      return prices.length > 0 ? Math.max(...prices) : 0;
    };

    const getKitchenDeliveryMinutes = (k: DynamicKitchen): number => {
      if (k.distanceKm != null && !isNaN(k.distanceKm)) {
        return k.distanceKm * 6 + 10;
      }
      if (k.time) {
        const m = k.time.match(/\d+/);
        if (m) return parseInt(m[0], 10);
      }
      return 40;
    };

    if (sortBy === "rating") {
      list = [...list].sort((a, b) => {
        const rA = Number(a.rating) || 0;
        const rB = Number(b.rating) || 0;
        if (rB !== rA) return rB - rA;
        return (Number(b.reviewsCount) || 0) - (Number(a.reviewsCount) || 0);
      });
    } else if (sortBy === "price_asc") {
      list = [...list].sort((a, b) => {
        const pA = getKitchenMinPrice(a);
        const pB = getKitchenMinPrice(b);
        if (pA !== pB) return pA - pB;
        return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      });
    } else if (sortBy === "price_desc") {
      list = [...list].sort((a, b) => {
        const pA = getKitchenMaxPrice(a);
        const pB = getKitchenMaxPrice(b);
        if (pB !== pA) return pB - pA;
        return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      });
    } else if (sortBy === "fastest") {
      list = [...list].sort((a, b) => {
        if ((a.isOnline === false) !== (b.isOnline === false)) {
          return a.isOnline === false ? 1 : -1;
        }
        const timeA = getKitchenDeliveryMinutes(a);
        const timeB = getKitchenDeliveryMinutes(b);
        if (timeA !== timeB) return timeA - timeB;
        return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
      });
    } else if (sortBy === "popular") {
      list = [...list].sort((a, b) => {
        if ((a.isOnline === false) !== (b.isOnline === false)) {
          return a.isOnline === false ? 1 : -1;
        }
        const rA = Number(a.rating) || 0;
        const rB = Number(b.rating) || 0;
        if (rB !== rA) return rB - rA;
        return (Number(b.reviewsCount) || 0) - (Number(a.reviewsCount) || 0);
      });
    }

    return list;
  }, [
    homeData.kitchens,
    homeData.allKitchens,
    homeData.foodItems,
    homeData.allFoodItems,
    homeData.coupons,
    searchQuery,
    selectedCategory,
    selectedDiet,
    selectedCuisines,
    selectedPrice,
    openOnly,
    offersOnly,
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

  const handleAddToCart = (dish: DynamicFoodItem, showAnimation: boolean = true) => {
    if (dish.sellerIsOnline === false) {
      showToast(`Sorry, "${dish.sellerName || "This kitchen"}" is currently closed and not accepting orders.`, "warning");
      return;
    }
    if (dish.isAvailable === false) {
      showToast(`Sorry, "${dish.name}" is currently unavailable.`, "warning");
      return;
    }

    const rawStock = (dish as any).maxStock !== undefined ? (dish as any).maxStock : (dish as any).stockQuantity;
    const stockLimit = rawStock !== undefined && rawStock !== null && !isNaN(Number(rawStock)) ? Number(rawStock) : -1;

    if (stockLimit === 0) {
      showToast(`Sorry, "${dish.name}" is currently out of stock.`, "warning");
      return;
    }

    const matchingInCart = cartItems.filter((ci) => ci.id === dish.id || ci.foodItemId === dish.id);
    const quantityInCart = matchingInCart.reduce((sum, ci) => sum + ci.quantity, 0);
    if (stockLimit !== -1 && quantityInCart >= stockLimit) {
      showToast(`We have only ${stockLimit} left in stock.`, "warning");
      return;
    }

    const parsedAddons = parseDishAddons(dish.addons || (dish as any).variants);
    if (parsedAddons.length > 0) {
      setAddonModalDish({
        ...dish,
        parsedAddons,
      });
      return;
    }

    const ok = addToCart({
      id: dish.id,
      foodItemId: dish.id,
      name: dish.name,
      price: dish.price,
      basePrice: dish.price,
      addonsTotal: 0,
      selectedAddons: [],
      quantity: 1,
      sellerId: dish.sellerId || "k-1",
      sellerName: dish.sellerName || "Verified Cloud Kitchen",
      image: dish.imageUrl || "/images/places/place-biryani.png",
      imageUrl: dish.imageUrl || "/images/places/place-biryani.png",
      stockQuantity: stockLimit,
      maxStock: stockLimit,
      itemType: dish.itemType,
      addons: parsedAddons,
    }, false, () => {
      if (showAnimation) {
        setAddedIds((prev) => ({ ...prev, [dish.id]: true }));
        setTimeout(() => {
          setAddedIds((prev) => ({ ...prev, [dish.id]: false }));
        }, 1000);
      }
    });
  };

  const handleDecreaseFromCart = (dishId: string) => {
    const matching = cartItems.filter((ci) => ci.id === dishId || ci.foodItemId === dishId);
    if (matching.length > 0) {
      const target = matching[matching.length - 1];
      decreaseQuantity(target.id);
    } else {
      decreaseQuantity(dishId);
    }
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
        {/* Breadcrumb */}
        <div style={{ fontSize: "0.85rem", color: "#64748B", fontWeight: "500", marginTop: "-12px", marginBottom: "-14px" }}>
          <span>Food marketplace</span>
          <span style={{ margin: "0 6px" }}>·</span>
          <span>Browse menu</span>
        </div>

        {/* Header Top Row: Title on Left, Search Bar on Right */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.72rem",
                fontWeight: "800",
                color: "#FF6B00",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                marginBottom: "4px",
              }}
            >
              EXPLORE THE MENU
            </div>
            <h1
              style={{
                fontSize: "clamp(1.75rem, 3.2vw, 2.35rem)",
                fontWeight: "800",
                color: "#18181B",
                margin: "0 0 6px 0",
                letterSpacing: "-0.03em",
              }}
            >
              What are you craving?
            </h1>
            <p style={{ margin: 0, fontSize: "0.92rem", color: "#64748B", fontWeight: "500" }}>
              Discover delicious chef-crafted food and cloud kitchens nearby
            </p>
          </div>

          {/* Search Input on Right */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flex: "0 1 420px",
              width: "100%",
              maxWidth: "420px",
              backgroundColor: "#FFFFFF",
              borderRadius: "14px",
              padding: "10px 16px",
              border: "1.5px solid #E2E8F0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
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
                fontSize: "0.9rem",
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
        </div>

        {/* Dynamic Category Chips Carousel */}
        {dynamicCategories.length > 0 && (
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <div
              ref={categoryScrollRef}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                overflowX: "auto",
                scrollbarWidth: "none",
                paddingBottom: "4px",
                width: "100%",
                scrollBehavior: "smooth",
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
                <UtensilsCrossed size={14} color={!selectedCategory ? "#FF6B00" : "#64748B"} />
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

            {/* Scroll Next Arrow */}
            <button
              type="button"
              onClick={() => categoryScrollRef.current?.scrollBy({ left: 220, behavior: "smooth" })}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "34px",
                height: "34px",
                borderRadius: "10px",
                border: "1px solid #E2E8F0",
                backgroundColor: "#FFFFFF",
                color: "#475569",
                cursor: "pointer",
                flexShrink: 0,
                marginLeft: "8px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
              }}
              aria-label="Scroll categories right"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Multi-Dimensional Filter Box */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            padding: "18px 22px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.02)",
            position: "relative",
            zIndex: 40,
          }}
        >
          {/* Row 1: Dietary */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: "0.85rem",
                fontWeight: "600",
                color: "#64748B",
                minWidth: "75px",
              }}
            >
              Dietary
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", flex: 1 }}>
              {[
                { id: "all", label: "All Diet", count: filterCounts.all },
                { id: "veg", label: "🌱 Pure Veg", count: filterCounts.veg },
                { id: "non_veg", label: "🍗 Non-Veg", count: filterCounts.non_veg },
                { id: "vegan", label: "🌿 Vegan", count: filterCounts.vegan },
                { id: "jain", label: "🌾 Jain", count: filterCounts.jain },
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
                      padding: "6px 14px",
                      borderRadius: "10px",
                      border: isSelected ? "1.5px solid #FF6B00" : "1px solid #E2E8F0",
                      backgroundColor: isSelected ? "#FFF3EB" : "#FFFFFF",
                      color: isSelected ? "#FF6B00" : "#475569",
                      fontWeight: isSelected ? "700" : "600",
                      fontSize: "0.84rem",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span>{d.label}</span>
                    {d.count !== undefined && (
                      <span
                        style={{
                          fontSize: "0.74rem",
                          color: isSelected ? "#EA580C" : "#94A3B8",
                          fontWeight: "700",
                        }}
                      >
                        {d.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Horizontal Line separating Dietary & Refine by */}
          <div style={{ height: "1px", backgroundColor: "#F1F5F9", width: "100%" }} />

          {/* Row 2: Refine by */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              flexWrap: "wrap",
              position: "relative",
              zIndex: 45,
            }}
          >
            <span
              style={{
                fontSize: "0.85rem",
                fontWeight: "600",
                color: "#64748B",
                minWidth: "75px",
              }}
            >
              Refine by
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", flex: 1 }}>
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
                      minWidth: "180px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    {[
                      { id: "all", label: "Any Price", count: filterCounts.all },
                      { id: "under-150", label: "Under ₹150", count: filterCounts.under150 },
                      { id: "150-300", label: "₹150 – ₹300", count: filterCounts.price150to300 },
                      { id: "300-plus", label: "₹300+", count: filterCounts.price300plus },
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
                            gap: "12px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span style={{ whiteSpace: "nowrap" }}>{p.label}</span>
                          {p.count > 0 && (
                            <span style={{ fontSize: "11px", color: isSelected ? "#FF6B00" : "#94A3B8", flexShrink: 0 }}>
                              ({p.count})
                            </span>
                          )}
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

              {/* Offers & Deals Toggle */}
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
                  backgroundColor: offersOnly ? "#FFF3EB" : "#FFFFFF",
                  color: offersOnly ? "#FF6B00" : "#475569",
                  fontWeight: offersOnly ? "700" : "600",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    width: "14px",
                    height: "14px",
                    borderRadius: "4px",
                    border: offersOnly ? "1.5px solid #FF6B00" : "1.5px solid #94A3B8",
                    backgroundColor: offersOnly ? "#FF6B00" : "transparent",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {offersOnly && <Check size={10} color="#FFFFFF" />}
                </span>
                <Tag size={13} color={offersOnly ? "#FF6B00" : "#94A3B8"} />
                <span>Offers &amp; Deals</span>
              </button>

              {/* Open Kitchens Toggle */}
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
                <span
                  style={{
                    width: "14px",
                    height: "14px",
                    borderRadius: "4px",
                    border: openOnly ? "1.5px solid #10B981" : "1.5px solid #94A3B8",
                    backgroundColor: openOnly ? "#10B981" : "transparent",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {openOnly && <Check size={10} color="#FFFFFF" />}
                </span>
                <span>Open Kitchens</span>
              </button>

              {/* Clear All Button */}
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "7px 12px",
                    borderRadius: "10px",
                    border: "1px solid #FCA5A5",
                    backgroundColor: "#FEF2F2",
                    color: "#DC2626",
                    fontSize: "0.82rem",
                    fontWeight: "700",
                    cursor: "pointer",
                    marginLeft: "auto",
                  }}
                >
                  <SlidersHorizontal size={13} />
                  <span>Clear All ({activeFiltersCount})</span>
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Header: Category Title + Subtitle + Sort Selector */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            borderBottom: "1px solid #E2E8F0",
            paddingBottom: "14px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
              <h2
                style={{
                  fontSize: "1.35rem",
                  fontWeight: "800",
                  color: "#18181B",
                  margin: 0,
                  letterSpacing: "-0.01em",
                }}
              >
                {selectedCategory || (activeTab === "dishes" ? "All cuisines" : "Cloud Kitchens")}
              </h2>
              <span style={{ fontSize: "0.88rem", color: "#64748B", fontWeight: "500" }}>
                Showing {activeTab === "dishes" ? filteredFoodItems.length : filteredKitchens.length} {activeTab === "dishes" ? (filteredFoodItems.length === 1 ? "dish" : "dishes") : (filteredKitchens.length === 1 ? "kitchen" : "kitchens")}
              </span>
            </div>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "#64748B" }}>
              Dietary labels are shown on each dish. Choose a preference to refine your menu.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
            {/* Sort Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#64748B" }}>Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "10px",
                  border: "1px solid #E2E8F0",
                  backgroundColor: "#FFFFFF",
                  fontSize: "0.85rem",
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

            {/* Back to categories (Always available & dynamic) */}
            <button
              type="button"
              onClick={() => {
                if (categoryScrollRef.current) {
                  categoryScrollRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
                } else if (typeof window !== "undefined") {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              style={{
                background: "none",
                border: "none",
                color: "#C2410C",
                fontWeight: "700",
                fontSize: "0.85rem",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "2px 0",
                marginTop: "2px",
                transition: "color 0.15s ease",
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = "#FF6B00")}
              onMouseOut={(e) => (e.currentTarget.style.color = "#C2410C")}
            >
              <span>Back to categories</span>
              <ArrowUp size={14} color="currentColor" />
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
                  const rawStock = (dish as any).maxStock !== undefined ? (dish as any).maxStock : (dish as any).stockQuantity;
                  const stockLimit = rawStock !== undefined && rawStock !== null && !isNaN(Number(rawStock)) ? Number(rawStock) : -1;
                  const isOutOfStock = stockLimit === 0 || dish.isAvailable === false;
                  const isClosed = isSellerClosed || isOutOfStock;
                  const isAdded = addedIds[dish.id];
                  const matchingInCart = cartItems.filter((ci) => ci.id === dish.id || ci.foodItemId === dish.id);
                  const quantityInCart = matchingInCart.reduce((sum, ci) => sum + ci.quantity, 0);
                  const isMaxStockInCart = !isClosed && stockLimit !== -1 && quantityInCart >= stockLimit;
                  const dishAddons = parseDishAddons(dish.addons || (dish as any).variants);
                  const hasAddons = dishAddons.length > 0;
                  const offerDetails = getDishOfferBadge(dish, homeData.coupons);

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
                        {/* Offer Badge on Top Left (Only displayed when the dish has an active deal/offer/coupon) */}
                        {!isClosed && offerDetails.hasOffer && offerDetails.badgeText && (
                          <div
                            style={{
                              position: "absolute",
                              top: "10px",
                              left: "10px",
                              backgroundColor: "#BC4B24",
                              color: "#FFFFFF",
                              fontSize: "11px",
                              fontWeight: "600",
                              lineHeight: "1.2",
                              letterSpacing: "0.2px",
                              padding: "4px 9px",
                              borderRadius: "6px",
                              boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
                              zIndex: 2,
                            }}
                          >
                            {offerDetails.badgeText}
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
                              {isSellerClosed ? "Closed" : "Out of Stock"}
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
                          gap: "6px",
                          flex: 1,
                        }}
                      >
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

                        {/* Dietary Tag inside Food Menu Description (Shows only the seller-specified category) */}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", margin: "2px 0" }}>
                          {(() => {
                            const rawType = String(dish.itemType || "").toUpperCase();
                            const catName = String(dish.categoryName || (dish as any).category || "").toUpperCase();
                            const nameUpper = String(dish.name || "").toUpperCase();

                            const isExplicitVegan = rawType.includes("VEGAN") || catName.includes("VEGAN") || nameUpper.includes("VEGAN");
                            const isExplicitJain = rawType.includes("JAIN") || catName.includes("JAIN") || nameUpper.includes("JAIN");
                            const isNonVeg = !isExplicitVegan && !isExplicitJain && isNonVegDish(dish);

                            if (isExplicitVegan) {
                              return (
                                <span
                                  style={{
                                    backgroundColor: "#ECFDF5",
                                    color: "#047857",
                                    fontSize: "11px",
                                    fontWeight: "700",
                                    padding: "2px 8px",
                                    borderRadius: "6px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#10B981" }} />
                                  Vegan
                                </span>
                              );
                            }

                            if (isExplicitJain) {
                              return (
                                <span
                                  style={{
                                    backgroundColor: "#ECFDF5",
                                    color: "#047857",
                                    fontSize: "11px",
                                    fontWeight: "700",
                                    padding: "2px 8px",
                                    borderRadius: "6px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#10B981" }} />
                                  Jain
                                </span>
                              );
                            }

                            if (isNonVeg) {
                              return (
                                <span
                                  style={{
                                    backgroundColor: "#FEF2F2",
                                    color: "#B91C1C",
                                    fontSize: "11px",
                                    fontWeight: "700",
                                    padding: "2px 8px",
                                    borderRadius: "6px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#EF4444" }} />
                                  Non-Veg
                                </span>
                              );
                            }

                            return (
                              <span
                                style={{
                                  backgroundColor: "#ECFDF5",
                                  color: "#047857",
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  padding: "2px 8px",
                                  borderRadius: "6px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#10B981" }} />
                                Veg
                              </span>
                            );
                          })()}
                        </div>

                        {/* Rating Stars + Ratings Count & Delivery Time Row */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            fontSize: "0.82rem",
                            marginTop: "2px",
                          }}
                        >
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  size={13}
                                  fill={isClosed ? "#94A3B8" : "#D97706"}
                                  color={isClosed ? "#94A3B8" : "#D97706"}
                                />
                              ))}
                            </div>
                            <span style={{ fontSize: "0.78rem", fontWeight: "700", color: isClosed ? "#94A3B8" : "#18181B" }}>
                              {dish.rating && dish.rating > 0 ? `${Number(dish.rating).toFixed(1)} Ratings` : "5.0 Ratings"}
                            </span>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#475569", fontSize: "0.82rem", fontWeight: "600" }}>
                            <Clock size={14} color="#64748B" />
                            <span>{dish.deliveryTime || "20–30 min"}</span>
                          </div>
                        </div>

                        {/* Add-ons Available Badge */}
                        {hasAddons && !isClosed && (
                          <div style={{ display: "flex", alignItems: "center", gap: "4px", margin: "1px 0" }}>
                            <span
                              style={{
                                fontSize: "0.72rem",
                                fontWeight: "700",
                                color: "#EA580C",
                                backgroundColor: "#FFF7ED",
                                border: "1px solid #FFEDD5",
                                padding: "2px 7px",
                                borderRadius: "6px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <Sparkles size={11} />
                              <span>{dishAddons.length} Add-on{dishAddons.length > 1 ? "s" : ""} Available</span>
                            </span>
                          </div>
                        )}

                        {/* Stock Quantity / Status Text */}
                        {isOutOfStock ? (
                          <div style={{ fontSize: "0.78rem", color: "#DC2626", fontWeight: "700" }}>
                            Out of stock
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
                            <button
                              type="button"
                              onClick={() => handleAddToCart(dish, true)}
                              style={{
                                backgroundColor: "#F1F5F9",
                                color: "#64748B",
                                fontSize: "0.82rem",
                                fontWeight: "700",
                                padding: "6px 14px",
                                borderRadius: "10px",
                                border: "1px solid #CBD5E1",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                              }}
                              title={isSellerClosed ? "Seller is closed" : "Unavailable"}
                            >
                              {isSellerClosed ? "Closed" : isOutOfStock ? "Out of Stock" : "Unavailable"}
                            </button>
                          ) : isAdded ? (
                            <button
                              type="button"
                              style={{
                                backgroundColor: "#10B981",
                                color: "#FFFFFF",
                                fontSize: "0.86rem",
                                fontWeight: "700",
                                padding: "7px 16px",
                                borderRadius: "12px",
                                border: "none",
                                cursor: "default",
                                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)",
                                transition: "all 0.2s ease",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <span>Added!</span>
                              <span>✓</span>
                            </button>
                          ) : quantityInCart > 0 ? (
                            <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                              {isMaxStockInCart && (
                                <span
                                  style={{
                                    position: "absolute",
                                    bottom: "calc(100% + 4px)",
                                    left: "0",
                                    right: "0",
                                    width: "100%",
                                    zIndex: 10,
                                    pointerEvents: "none",
                                    fontSize: "0.58rem",
                                    color: "#EA580C",
                                    backgroundColor: "#FFF7ED",
                                    border: "1px solid #FFEDD5",
                                    borderRadius: "6px",
                                    padding: "2px 3px",
                                    fontWeight: "800",
                                    textAlign: "center",
                                    lineHeight: "1.15",
                                    boxShadow: "0 2px 6px rgba(234, 88, 12, 0.12)",
                                    boxSizing: "border-box",
                                    whiteSpace: "normal",
                                    wordBreak: "break-word",
                                  }}
                                >
                                  We have only {stockLimit} left in stock
                                </span>
                              )}
                              <div
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  backgroundColor: "#FFF7ED",
                                  border: "1.5px solid #FF6B00",
                                  borderRadius: "10px",
                                  overflow: "hidden",
                                  boxShadow: "0 2px 8px rgba(255, 107, 0, 0.15)",
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleDecreaseFromCart(dish.id)}
                                  style={{
                                    padding: "5px 11px",
                                    backgroundColor: "transparent",
                                    border: "none",
                                    cursor: "pointer",
                                    fontWeight: "800",
                                    fontSize: "1rem",
                                    color: "#FF6B00",
                                    transition: "background-color 0.15s ease",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 107, 0, 0.15)")}
                                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                  aria-label="Decrease quantity"
                                >
                                  -
                                </button>
                                <span
                                  style={{
                                    padding: "5px 10px",
                                    fontWeight: "800",
                                    fontSize: "0.88rem",
                                    color: "#FF6B00",
                                    backgroundColor: "#FFFFFF",
                                    borderLeft: "1.5px solid #FF6B00",
                                    borderRight: "1.5px solid #FF6B00",
                                    minWidth: "22px",
                                    textAlign: "center",
                                  }}
                                >
                                  {quantityInCart}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isMaxStockInCart) {
                                      showToast(`We have only ${stockLimit} left in stock.`, "warning");
                                    } else {
                                      handleAddToCart(dish, false);
                                    }
                                  }}
                                  style={{
                                    padding: "5px 11px",
                                    backgroundColor: "transparent",
                                    border: "none",
                                    cursor: isMaxStockInCart ? "not-allowed" : "pointer",
                                    opacity: isMaxStockInCart ? 0.35 : 1,
                                    fontWeight: "800",
                                    fontSize: "1rem",
                                    color: "#FF6B00",
                                    transition: "background-color 0.15s ease",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                  onMouseOver={(e) => {
                                    if (!isMaxStockInCart) e.currentTarget.style.backgroundColor = "rgba(255, 107, 0, 0.15)";
                                  }}
                                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                  aria-label="Increase quantity"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddToCart(dish, true)}
                              style={{
                                backgroundColor: "#FF6B00",
                                color: "#FFFFFF",
                                fontSize: "0.86rem",
                                fontWeight: "700",
                                padding: "8px 18px",
                                borderRadius: "10px",
                                border: "none",
                                cursor: "pointer",
                                boxShadow: "0 3px 10px rgba(255, 107, 0, 0.25)",
                                transition: "all 0.2s ease",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                              }}
                            >
                              <span>{hasAddons ? "Add Item" : "Add to cart"}</span>
                              <span style={{ fontSize: "0.9rem", fontWeight: "700" }}>+</span>
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
                      style={{ textDecoration: "none", height: "100%", display: "flex", flexDirection: "column" }}
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
                          height: "100%",
                          flex: 1,
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
                            flexShrink: 0,
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
                            flex: 1,
                            justifyContent: "space-between",
                          }}
                        >
                          <div>
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
                                <Star size={14} fill={isClosed ? "#94A3B8" : (kitchen.rating && kitchen.rating > 0 ? "#F59E0B" : "#94A3B8")} color={isClosed ? "#94A3B8" : (kitchen.rating && kitchen.rating > 0 ? "#F59E0B" : "#94A3B8")} />
                                <span style={{ fontWeight: "800", fontSize: "0.85rem", color: isClosed ? "#94A3B8" : "#18181B" }}>
                                  {kitchen.rating && kitchen.rating > 0 ? Number(kitchen.rating).toFixed(1) : "New"}
                                </span>
                              </div>
                            </div>

                            <span style={{ fontSize: "0.85rem", color: "#64748B", fontWeight: "600", display: "block", marginTop: "4px" }}>
                              {kitchen.category} • {kitchen.time || "20-30 min"}
                            </span>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: "10px", borderTop: "1px solid #F1F5F9" }}>
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

      {/* Add-on Customization Modal */}
      {addonModalDish && (
        <AddonCustomizationModal
          isOpen={!!addonModalDish}
          onClose={() => setAddonModalDish(null)}
          item={{
            id: addonModalDish.id,
            name: addonModalDish.name,
            price: addonModalDish.price,
            basePrice: addonModalDish.price,
            description: addonModalDish.description,
            imageUrl: addonModalDish.imageUrl || "/images/places/place-biryani.png",
            itemType: addonModalDish.itemType,
            isVeg: addonModalDish.itemType === "VEG" || !addonModalDish.name?.toLowerCase().includes("chicken"),
            addons: addonModalDish.parsedAddons || [],
          }}
          onAddToCart={(selectedAddons, quantity) => {
            const base = addonModalDish.price;
            const addonsTotal = selectedAddons.reduce((sum, a) => sum + (a.price || 0), 0);
            const unitPrice = base + addonsTotal;
            const rawStock = (addonModalDish as any).maxStock !== undefined ? (addonModalDish as any).maxStock : (addonModalDish as any).stockQuantity;
            const stockLimit = rawStock !== undefined && rawStock !== null && !isNaN(Number(rawStock)) ? Number(rawStock) : -1;
            const itemImg = addonModalDish.imageUrl || "/images/places/place-biryani.png";
            const baseFoodId = addonModalDish.id;
            const cartItemId = generateCartItemId(baseFoodId, selectedAddons);
            const savedDishId = addonModalDish.id;
            setAddonModalDish(null);

            addToCart({
              id: cartItemId,
              foodItemId: baseFoodId,
              name: addonModalDish.name,
              price: unitPrice,
              basePrice: base,
              addonsTotal: addonsTotal,
              selectedAddons: selectedAddons,
              quantity: quantity || 1,
              sellerId: addonModalDish.sellerId || "k-1",
              sellerName: addonModalDish.sellerName || "Verified Cloud Kitchen",
              image: itemImg,
              imageUrl: itemImg,
              stockQuantity: stockLimit,
              maxStock: stockLimit,
              itemType: addonModalDish.itemType,
              addons: addonModalDish.parsedAddons,
            }, false, () => {
              setAddedIds((prev) => ({ ...prev, [savedDishId]: true }));
              setTimeout(() => {
                setAddedIds((prev) => ({ ...prev, [savedDishId]: false }));
              }, 1000);
            });
          }}
        />
      )}

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
