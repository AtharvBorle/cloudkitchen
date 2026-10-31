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
  Utensils,
  Croissant,
  Coffee,
  Egg,
  EggFried,
  Soup,
  IceCream,
  IceCream2,
  IceCreamBowl,
  Pizza,
  Sandwich,
  Flame,
  Heart,
  X,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ArrowUp,
  ArrowDown,
  Store,
  Home,
  Sparkles,
  ShoppingBag,
  CookingPot,
  ChefHat,
  Salad,
  Cookie,
  CupSoda,
  CakeSlice,
  Popcorn,
  Drumstick,
  Apple,
  Wheat,
  RotateCcw,
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
  resolveDishDietaryTypes,
} from "@/lib/dietary-filter";
import Link from "next/link";
import filterStyles from "./FoodExploreFilter.module.css";

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
          stockQuantity: a.stockQuantity !== undefined && a.stockQuantity !== null && !isNaN(Number(a.stockQuantity)) ? Number(a.stockQuantity) : 0,
          lowStockThreshold: a.lowStockThreshold !== undefined && !isNaN(Number(a.lowStockThreshold)) ? Number(a.lowStockThreshold) : 5,
          isActive: a.isActive !== false,
          description: a.description || "",
          imageUrl: a.imageUrl || null,
        }));
    }
  } catch {}
  return [];
}

const CrossedKnifeSpoonIcon = ({ size = 26, color = "#FFFFFF" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color}>
    <path
      d="M5.5 3.5C7.2 4.2 8.5 6.2 8.5 8.5L7.2 9.8L3.2 5.8C3.8 4.5 4.6 3.8 5.5 3.5Z"
      strokeWidth="0.5"
    />
    <path d="M7.8 9.2L18.5 19.9" strokeWidth="2.6" strokeLinecap="round" />
    <ellipse
      cx="17.2"
      cy="6.8"
      rx="3.4"
      ry="4.5"
      transform="rotate(45 17.2 6.8)"
      strokeWidth="0.5"
    />
    <path d="M14.8 9.2L4.1 19.9" strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);

const PoheIcon = ({ size = 24, color = "#5C4033" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 13h18c-.8 4.2-4.5 7.5-9 7.5S3.8 17.2 3 13Z" />
    <path d="M4 13c1.2-3 4-5 8-5s6.8 2 8 5" />
    <circle cx="8" cy="11.5" r="0.8" fill={color} />
    <circle cx="12" cy="10.5" r="0.8" fill={color} />
    <circle cx="16" cy="11.5" r="0.8" fill={color} />
    <path d="M9 5c0 1.2-.8 2-1.5 2" />
    <path d="M12 4c0 1.2-.8 2-1.5 2" />
    <path d="M15 5c0 1.2-.8 2-1.5 2" />
  </svg>
);

const SabudanaIcon = ({ size = 24, color = "#5C4033" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 13.5h18c-.8 4-4.5 7-9 7s-8.2-3-9-7Z" />
    <circle cx="6.5" cy="11" r="1.6" />
    <circle cx="10.2" cy="9.2" r="1.6" />
    <circle cx="13.8" cy="9.2" r="1.6" />
    <circle cx="17.5" cy="11" r="1.6" />
    <circle cx="8.5" cy="12.5" r="1.4" />
    <circle cx="12" cy="12" r="1.4" />
    <circle cx="15.5" cy="12.5" r="1.4" />
    <path d="M10 4.5c0 1.2-.8 2-1.2 2.2" />
    <path d="M14 4c0 1.2-.8 2-1.2 2.2" />
  </svg>
);

const NoodleBowlIcon = ({ size = 22, color = "#5C4033" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 5l11-2" />
    <path d="M7 8l11-2" />
    <path d="M9 8v4" />
    <path d="M12 7.5v4.5" />
    <path d="M5.5 12h13c0 4-2.8 6.5-6.5 6.5s-6.5-2.5-6.5-6.5Z" />
    <path d="M8.5 18.5h7" />
  </svg>
);

const SORT_OPTIONS = [
  { value: "", label: "Relevance", icon: Sparkles },
  { value: "popular", label: "Most Popular", icon: Flame },
  { value: "rating", label: "Top Rated", icon: Star },
  { value: "price_asc", label: "Price: Low to High", icon: ArrowDown },
  { value: "price_desc", label: "Price: High to Low", icon: ArrowUp },
  { value: "fastest", label: "Fastest Delivery", icon: Zap },
];

const FALLBACK_CATEGORY_ICONS = [
  CookingPot,
  ChefHat,
  Salad,
  Soup,
  Flame,
  Coffee,
  CupSoda,
  UtensilsCrossed,
  Apple,
  Sandwich,
  Cookie,
  Croissant,
  Drumstick,
  Wheat,
  Utensils,
];

function getCategoryIcon(name: string, isSelected: boolean) {
  const lower = name.toLowerCase().trim();
  const color = isSelected ? "#FFFFFF" : "#5C4033";
  const size = 24;

  if (lower === "all" || lower === "all cuisines") {
    return <CrossedKnifeSpoonIcon size={size} color={color} />;
  }

  // 1. Bakery, Cakes, Pastries, Breads
  if (lower.includes("baker") || lower.includes("cake") || lower.includes("pastr") || lower.includes("bread") || lower.includes("bun") || lower.includes("muffin")) {
    return <CakeSlice size={size} color={color} strokeWidth={1.8} />;
  }

  // 2. Cafe, Coffee, Tea, Chai, Brew
  if (lower.includes("cafe") || lower.includes("coffee") || lower.includes("tea") || lower.includes("chai") || lower.includes("brew") || lower.includes("cappuccino")) {
    return <Coffee size={size} color={color} strokeWidth={1.8} />;
  }

  // 3. Cold Drinks, Beverages, Shakes, Juices, Soda, Smoothies
  if (lower.includes("drink") || lower.includes("beverag") || lower.includes("shake") || lower.includes("juice") || lower.includes("soda") || lower.includes("smoothie") || lower.includes("lassi") || lower.includes("mojito")) {
    return <CupSoda size={size} color={color} strokeWidth={1.8} />;
  }

  // 4a. Pohe / Poha (Flattened rice with onions, peanuts, mustard seeds)
  if (lower.includes("pohe") || lower.includes("poha")) {
    return <PoheIcon size={size} color={color} />;
  }

  // 4b. Sabudana (Tapioca pearls sago khichdi / vada)
  if (lower.includes("sabudana") || lower.includes("sago")) {
    return <SabudanaIcon size={size} color={color} />;
  }

  // 4c. Shira / Sheera / Halwa / Kesari (Sweet semolina halwa / dessert)
  if (lower.includes("shira") || lower.includes("sheera") || lower.includes("halwa") || lower.includes("kesari")) {
    return <IceCreamBowl size={size} color={color} strokeWidth={1.8} />;
  }

  // 4d. Upma (Savory semolina breakfast porridge with vegetables)
  if (lower.includes("upma") || lower.includes("sanjha") || lower.includes("rava")) {
    return <Soup size={size} color={color} strokeWidth={1.8} />;
  }

  // 4e. General Breakfast, Morning, Egg, Omelet
  if (lower.includes("breakfast") || lower.includes("morning") || lower.includes("egg") || lower.includes("omelet")) {
    return <EggFried size={size} color={color} strokeWidth={1.8} />;
  }

  // 5. South Indian, Dosa, Idli, Uttapam, Vada, Sambhar
  if (lower.includes("south") || lower.includes("dosa") || lower.includes("idli") || lower.includes("uttapam") || lower.includes("vada") || lower.includes("sambhar") || lower.includes("sambar") || lower.includes("appam")) {
    return <ChefHat size={size} color={color} strokeWidth={1.8} />;
  }

  // 6. Homely Food, Home Style, Home Cooked, Mess, Bhojanalay
  if (lower.includes("homely") || lower.includes("home") || lower.includes("gharguti") || lower.includes("mess") || lower.includes("bhojanalay")) {
    return <CookingPot size={size} color={color} strokeWidth={1.8} />;
  }

  // 7. Lunch, Dinner, Complete Meals, Thali, Executive Meal
  if (lower.includes("lunch") || lower.includes("dinner") || lower.includes("thali") || lower.includes("meal")) {
    return <UtensilsCrossed size={size} color={color} strokeWidth={1.8} />;
  }

  // 8. Biryani, Rice, Pulao, Dalrice, Khichdi, Fried Rice
  if (lower.includes("biryani") || lower.includes("rice") || lower.includes("pulao") || lower.includes("dalrice") || lower.includes("khichdi") || lower.includes("chawal")) {
    return <Flame size={size} color={color} strokeWidth={1.8} />;
  }

  // 9. Chinese, Asian, Noodles, Soup, Ramen, Manchurian, Momos
  if (lower.includes("chinese") || lower.includes("noodle") || lower.includes("soup") || lower.includes("asian") || lower.includes("ramen") || lower.includes("momo") || lower.includes("manchurian") || lower.includes("chowmein")) {
    return <NoodleBowlIcon size={size} color={color} />;
  }

  // 10. Pizza, Italian, Pasta, Garlic Bread
  if (lower.includes("pizza") || lower.includes("italian") || lower.includes("pasta") || lower.includes("lasagna")) {
    return <Pizza size={size} color={color} strokeWidth={1.8} />;
  }

  // 11. Burger, Sandwiches, Rolls, Wraps, Frankies
  if (lower.includes("burger") || lower.includes("sandwich") || lower.includes("roll") || lower.includes("wrap") || lower.includes("frankie") || lower.includes("sub")) {
    return <Sandwich size={size} color={color} strokeWidth={1.8} />;
  }

  // 12. Snacks, Street Food, Chaat, Samosa, Kachori, Fast Food, Starters
  if (lower.includes("snack") || lower.includes("street") || lower.includes("chaat") || lower.includes("fast") || lower.includes("starter") || lower.includes("appetizer") || lower.includes("samosa") || lower.includes("pakora") || lower.includes("bhajiya")) {
    return <Popcorn size={size} color={color} strokeWidth={1.8} />;
  }

  // 13. Desserts, Sweets, Ice Cream, Mithai, Halwa, Kulfi
  if (lower.includes("dessert") || lower.includes("ice") || lower.includes("sweet") || lower.includes("mithai") || lower.includes("halwa") || lower.includes("kulfi") || lower.includes("gulab") || lower.includes("jamun") || lower.includes("rasgulla") || lower.includes("cookie")) {
    return <IceCream size={size} color={color} strokeWidth={1.8} />;
  }

  // 14. Salad, Diet, Healthy, Vegan, Organic, Fruits
  if (lower.includes("salad") || lower.includes("healthy") || lower.includes("diet") || lower.includes("vegan") || lower.includes("fruit") || lower.includes("green") || lower.includes("raw") || lower.includes("sprout")) {
    return <Salad size={size} color={color} strokeWidth={1.8} />;
  }

  // 15. Non-Veg, Chicken, Mutton, Fish, Seafood, Meat, Kebab, Tandoor
  if (lower.includes("chicken") || lower.includes("mutton") || lower.includes("fish") || lower.includes("prawn") || lower.includes("seafood") || lower.includes("meat") || lower.includes("kebab") || lower.includes("tikka") || lower.includes("tandoor") || lower.includes("non-veg") || lower.includes("non veg")) {
    return <Drumstick size={size} color={color} strokeWidth={1.8} />;
  }

  // 16. North Indian, Punjabi, Mughlai, Maharashtrian, Gujarati, Curry, Gravy
  if (lower.includes("punjabi") || lower.includes("north") || lower.includes("mughlai") || lower.includes("marathi") || lower.includes("maharashtrian") || lower.includes("gujarati") || lower.includes("curry") || lower.includes("gravy") || lower.includes("dal")) {
    return <CookingPot size={size} color={color} strokeWidth={1.8} />;
  }

  // 17. Deterministic Fallback: Never display identical icons for different categories
  const hash = Math.abs(lower.split("").reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) | 0, 0));
  const FallbackIcon = FALLBACK_CATEGORY_ICONS[hash % FALLBACK_CATEGORY_ICONS.length];
  return <FallbackIcon size={size} color={color} strokeWidth={1.8} />;
}

function FoodExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category") || "";
  const queryParam = searchParams.get("query") || searchParams.get("search") || "";
  const dietaryParam = (searchParams.get("dietary") as any);
  const priceParam = (searchParams.get("price") as any) || "all";
  const offersParam = searchParams.get("offers") === "true";
  const sortParam = searchParams.get("sort") || "";

  const { defaultAddress, openLocationModal } = useLocation();
  const { addToCart, decreaseQuantity, showToast, cartItems } = useCart();
  const homeData = useHomeData();

  // Local Filter States
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [selectedDiet, setSelectedDiet] = useState<"all" | "veg" | "non_veg" | "vegan" | "jain">(() => {
    if (dietaryParam && ["all", "veg", "non_veg", "vegan", "jain"].includes(dietaryParam)) {
      return dietaryParam;
    }
    return "veg";
  });

  // Client-side hydration sync for diet preference from localStorage / events
  React.useEffect(() => {
    if (!dietaryParam) {
      try {
        const stored = localStorage.getItem("cloudkitchen_diet_preference");
        if (stored && ["all", "veg", "non_veg", "vegan", "jain"].includes(stored)) {
          setSelectedDiet(stored as any);
        }
      } catch {}
    }
    const handleDietChange = (e: any) => {
      const detail = e.detail;
      if (detail && ["all", "veg", "non_veg", "vegan", "jain"].includes(detail)) {
        setSelectedDiet(detail);
      }
    };
    window.addEventListener("cloudkitchen_diet_preference_changed", handleDietChange);
    return () => {
      window.removeEventListener("cloudkitchen_diet_preference_changed", handleDietChange);
    };
  }, [dietaryParam]);
  const [selectedPrice, setSelectedPrice] = useState<"all" | "under-150" | "150-300" | "300-plus">(
    ["all", "under-150", "150-300", "300-plus"].includes(priceParam) ? priceParam : "all"
  );
  const [offersOnly, setOffersOnly] = useState(offersParam);
  const [sortBy, setSortBy] = useState(sortParam);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [openOnly, setOpenOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<"dishes" | "kitchens">("dishes");
  const categoryScrollRef = React.useRef<HTMLDivElement>(null);
  const [mobileSortOpen, setMobileSortOpen] = useState(false);
  const mobileSortRef = React.useRef<HTMLDivElement>(null);
  const [isDesktopSortOpen, setIsDesktopSortOpen] = useState(false);
  const desktopSortRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleDesktopSortClickOutside = (e: MouseEvent | TouchEvent) => {
      if (desktopSortRef.current && !desktopSortRef.current.contains(e.target as Node)) {
        setIsDesktopSortOpen(false);
      }
    };
    if (isDesktopSortOpen) {
      document.addEventListener("mousedown", handleDesktopSortClickOutside);
      document.addEventListener("touchstart", handleDesktopSortClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleDesktopSortClickOutside);
      document.removeEventListener("touchstart", handleDesktopSortClickOutside);
    };
  }, [isDesktopSortOpen]);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (mobileSortRef.current && !mobileSortRef.current.contains(e.target as Node)) {
        setMobileSortOpen(false);
      }
    };
    if (mobileSortOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [mobileSortOpen]);


  // Popover & Modal state
  const [openPricePopover, setOpenPricePopover] = useState(false);
  const [openCuisinePopover, setOpenCuisinePopover] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const pricePopoverRef = React.useRef<HTMLDivElement>(null);
  const cuisinePopoverRef = React.useRef<HTMLDivElement>(null);
  const searchContainerRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [addonModalDish, setAddonModalDish] = useState<(DynamicFoodItem & { parsedAddons: AddonItem[] }) | null>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [activeFilterPopover, setActiveFilterPopover] = useState<"dietary" | "price" | "delivery" | "rating" | "more" | null>(null);
  const filterCardRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleFilterClickOutside = (e: MouseEvent | TouchEvent) => {
      if (activeFilterPopover && filterCardRef.current && !filterCardRef.current.contains(e.target as Node)) {
        setActiveFilterPopover(null);
      }
    };
    const handleFilterKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveFilterPopover(null);
      }
    };
    if (activeFilterPopover) {
      document.addEventListener("mousedown", handleFilterClickOutside);
      document.addEventListener("touchstart", handleFilterClickOutside);
      document.addEventListener("keydown", handleFilterKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleFilterClickOutside);
      document.removeEventListener("touchstart", handleFilterClickOutside);
      document.removeEventListener("keydown", handleFilterKeyDown);
    };
  }, [activeFilterPopover]);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("cloudkitchen_favorites");
      if (stored) setFavorites(JSON.parse(stored));
    } catch {}
  }, []);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setFavorites((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem("cloudkitchen_favorites", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Outside click to close price, cuisine, and search popovers
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pricePopoverRef.current && !pricePopoverRef.current.contains(e.target as Node)) {
        setOpenPricePopover(false);
      }
      if (cuisinePopoverRef.current && !cuisinePopoverRef.current.contains(e.target as Node)) {
        setOpenCuisinePopover(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    if (openPricePopover || openCuisinePopover || isSearchFocused) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openPricePopover, openCuisinePopover, isSearchFocused]);

  // Sync state if URL changes
  React.useEffect(() => {
    if (categoryParam) setSelectedCategory(categoryParam);
    if (queryParam) setSearchQuery(queryParam);
    if (dietaryParam) setSelectedDiet(dietaryParam);
    if (priceParam) setSelectedPrice(priceParam);
    setOffersOnly(offersParam);
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
    homeData.foodItems.forEach((f) => {
      if (f.categoryName) set.add(f.categoryName);
    });
    return Array.from(set);
  }, [homeData.categories, homeData.foodItems]);

  // Dynamic filter counts
  const filterCounts = useMemo(() => {
    const items = homeData.foodItems;
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
  }, [homeData.foodItems, availableCuisines]);

  // Filter and sort food items
  const filteredFoodItems = useMemo(() => {
    const sourceItems = homeData.foodItems;
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

    // Open Only (Hides items from closed kitchens and out-of-stock items)
    if (openOnly) {
      list = list.filter((f) => {
        const rawStock = (f as any).maxStock !== undefined ? (f as any).maxStock : (f as any).stockQuantity;
        const stockLimit = rawStock !== undefined && rawStock !== null && !isNaN(Number(rawStock)) ? Number(rawStock) : -1;
        const isOutOfStock = stockLimit === 0 || f.isAvailable === false;
        const isSellerClosed = f.sellerIsOnline === false;
        const matchedKitchen = homeData.kitchens.find(
          (k) => k.id === f.sellerId || (f.sellerTrackingId && k.trackingId === f.sellerTrackingId)
        );
        const isKitchenClosed = matchedKitchen && matchedKitchen.isOnline === false;
        return !isSellerClosed && !isOutOfStock && !isKitchenClosed;
      });
    }

    // Offers only
    if (offersOnly) {
      list = list.filter((f) => isDishHavingOffers(f, homeData.coupons, sourceItems));
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
        if ((a.sellerIsOnline === false) !== (b.sellerIsOnline === false)) {
          return a.sellerIsOnline === false ? 1 : -1;
        }
        const rA = Number(a.rating) || 0;
        const rB = Number(b.rating) || 0;
        if (rB !== rA) return rB - rA;
        const countA = Number(a.totalRatings || a.reviewsCount) || 0;
        const countB = Number(b.totalRatings || b.reviewsCount) || 0;
        if (countB !== countA) return countB - countA;
        const salesA = Number((a as any).totalSales ?? (a as any).orderCount) || 0;
        const salesB = Number((b as any).totalSales ?? (b as any).orderCount) || 0;
        if (salesB !== salesA) return salesB - salesA;
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
        const salesA = Number((a as any).totalSales ?? (a as any).orderCount) || 0;
        const salesB = Number((b as any).totalSales ?? (b as any).orderCount) || 0;
        if (salesB !== salesA) return salesB - salesA;
        const ratingA = Number(a.rating) || 0;
        const ratingB = Number(b.rating) || 0;
        if (ratingB !== ratingA) return ratingB - ratingA;
        const countA = Number(a.totalRatings || a.reviewsCount) || 0;
        const countB = Number(b.totalRatings || b.reviewsCount) || 0;
        if (countB !== countA) return countB - countA;
        return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
      });
    }

    return list;
  }, [
    homeData.foodItems,
    homeData.kitchens,
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
    const sourceKitchens = homeData.kitchens;
    const sourceFoodItems = homeData.foodItems;
    if (!sourceKitchens || sourceKitchens.length === 0) return [];

    let list = sourceKitchens.filter((k) => {
      const kId = (k.id || "").toLowerCase().trim();
      const kTracking = (k.trackingId || "").toLowerCase().trim();
      const kName = (k.name || "").toLowerCase().trim();

      const kDishes = sourceFoodItems.filter((f) => {
        const fSellerId = (f.sellerId || "").toLowerCase().trim();
        const fTracking = (f.sellerTrackingId || "").toLowerCase().trim();
        const fSellerName = (f.sellerName || "").toLowerCase().trim();
        return (
          (kId && (fSellerId === kId || fTracking === kId)) ||
          (kTracking && (fTracking === kTracking || fSellerId === kTracking)) ||
          (kName && fSellerName && (kName === fSellerName || kName.includes(fSellerName) || fSellerName.includes(kName)))
        );
      });
      return kDishes.length > 0;
    });

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

  // Dishes Pagination (6 items per page as requested)
  const DISHES_PER_PAGE = 6;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 whenever any filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    selectedCategory,
    selectedDiet,
    selectedPrice,
    selectedCuisines,
    openOnly,
    offersOnly,
    sortBy,
    activeTab,
  ]);

  const totalPages = Math.ceil(filteredFoodItems.length / DISHES_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safeCurrentPage - 1) * DISHES_PER_PAGE;
  const endIndex = Math.min(startIndex + DISHES_PER_PAGE, filteredFoodItems.length);
  const paginatedFoodItems = useMemo(() => {
    return filteredFoodItems.slice(startIndex, endIndex);
  }, [filteredFoodItems, startIndex, endIndex]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (typeof window !== "undefined") {
      const el = document.getElementById("food-explore-results-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) {
      const pages: (number | string)[] = [];
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    if (safeCurrentPage <= 3) {
      return [1, 2, 3, 4, "...", totalPages];
    }
    if (safeCurrentPage >= totalPages - 2) {
      return [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, "...", safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, "...", totalPages];
  }, [safeCurrentPage, totalPages]);

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

    const sourceItems = homeData.foodItems;
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
  }, [homeData.categories, homeData.foodItems, selectedDiet]);

  // Mobile Explore Categories (exact 8 cuisines as Image 2)
  const mobileCategories = useMemo(() => {
    const coreNames = ["Bakery", "Drinks", "Breakfast", "Chinese", "Desserts", "Pizza", "Burger", "Biryani"];
    const list: Array<{ id: string; name: string; count: number }> = [];

    coreNames.forEach((name) => {
      const existing = dynamicCategories.find((c) => c.name.toLowerCase().trim() === name.toLowerCase().trim());
      const count = existing ? existing.count : homeData.foodItems.filter((f) => matchesDishCategory(name, f)).length;
      list.push({
        id: name.toLowerCase(),
        name,
        count,
      });
    });

    dynamicCategories.forEach((c) => {
      if (!coreNames.some((cn) => cn.toLowerCase() === c.name.toLowerCase())) {
        list.push(c);
      }
    });

    return list;
  }, [dynamicCategories, homeData.foodItems]);

  // Interactive live search suggestions for autocomplete popover
  const searchSuggestions = useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();
    if (!q) return { dishes: [], kitchens: [] };

    const matchingDishes = homeData.foodItems
      .filter((f) => matchesDishSearch(q, f))
      .slice(0, 5);

    const matchingKitchens = homeData.kitchens
      .filter((k) => matchesKitchenOrDishSearch(q, k, homeData.foodItems))
      .slice(0, 3);

    return { dishes: matchingDishes, kitchens: matchingKitchens };
  }, [searchQuery, homeData.foodItems, homeData.kitchens]);

  const popularCravings = useMemo(() => [
    "Biryani",
    "Thali",
    "Pizza",
    "Burger",
    "Poha",
    "Dosa",
    "Khichdi",
    "Cake",
  ], []);

  const activeFiltersCount =
    (selectedDiet !== "all" ? 1 : 0) +
    (selectedPrice !== "all" ? 1 : 0) +
    (selectedCategory && selectedCategory !== "all" && selectedCategory !== "food" ? 1 : 0) +
    (selectedCuisines.length > 0 ? 1 : 0) +
    (offersOnly ? 1 : 0) +
    (openOnly ? 1 : 0) +
    (sortBy ? 1 : 0) +
    (searchQuery ? 1 : 0);

  const handleClearAll = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedDiet("all");
    setSelectedPrice("all");
    setSelectedCuisines([]);
    setOffersOnly(false);
    setOpenOnly(false);
    setSortBy("");
    if (typeof window !== "undefined") {
      router.replace("/food-explore", { scroll: false });
    }
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
      categoryId: (dish as any).categoryId,
      foodCategoryId: (dish as any).foodCategoryId,
      category: (dish as any).category,
      foodCategory: (dish as any).foodCategory,
      categoryName: (dish as any).categoryName || (dish as any).category?.name || (dish as any).foodCategory?.name,
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
      className="food-explore-page-wrapper"
      style={{
        width: "100%",
        minHeight: "100vh",
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
        <div className="food-explore-desktop-hero">

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "20px",
              paddingBottom: "4px",
            }}
          >
            {/* Breadcrumb on Left: Home · Explore food */}
            <div
              style={{
                fontSize: "0.88rem",
                color: "#64748B",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span
                onClick={() => router.push("/")}
                style={{ cursor: "pointer", color: "#64748B", transition: "color 0.15s ease" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#0F172A")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#64748B")}
              >
                Home
              </span>
              <span style={{ color: "#94A3B8" }}>·</span>
              <span style={{ color: "#FF5500", fontWeight: "600" }}>Explore food</span>
            </div>

            {/* Search Input on Right with Orange Search Button */}
            <div
              ref={searchContainerRef}
              style={{
                position: "relative",
                flex: "0 1 480px",
                width: "100%",
                maxWidth: "480px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  width: "100%",
                  height: "44px",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "12px",
                  padding: "0 6px 0 14px",
                  border: isSearchFocused ? "1.5px solid #FF5500" : "1.5px solid #E2E8F0",
                  boxShadow: isSearchFocused
                    ? "0 0 0 3px rgba(255, 85, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.04)"
                    : "0 1px 3px rgba(0, 0, 0, 0.02)",
                  transition: "all 0.2s ease",
                  boxSizing: "border-box",
                  cursor: "text",
                }}
                onClick={() => searchInputRef.current?.focus()}
              >
                <Search
                  size={18}
                  color={isSearchFocused ? "#FF5500" : "#94A3B8"}
                  style={{
                    transition: "all 0.2s ease",
                    transform: isSearchFocused ? "scale(1.05)" : "scale(1)",
                    flexShrink: 0,
                  }}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setIsSearchFocused(false);
                    }
                  }}
                  placeholder="Search dishes, cuisines, or kitchens..."
                  style={{
                    border: "none",
                    outline: "none",
                    backgroundColor: "transparent",
                    width: "100%",
                    fontSize: "0.88rem",
                    color: "#18181B",
                    fontWeight: "500",
                    fontFamily: "inherit",
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchQuery("");
                      searchInputRef.current?.focus();
                    }}
                    style={{
                      background: "#F1F5F9",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#64748B",
                      transition: "all 0.15s ease",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#FFE8D6";
                      e.currentTarget.style.color = "#FF5500";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#F1F5F9";
                      e.currentTarget.style.color = "#64748B";
                    }}
                    aria-label="Clear search"
                  >
                    <X size={13} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsSearchFocused(false)}
                  style={{
                    backgroundColor: "#FF5500",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "8px",
                    padding: "7px 18px",
                    fontSize: "0.85rem",
                    fontWeight: "700",
                    cursor: "pointer",
                    flexShrink: 0,
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#E04B00")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FF5500")}
                >
                  Search
                </button>
              </div>

              {/* Interactive Popover Dropdown Panel */}
            {isSearchFocused && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: 0,
                  right: 0,
                  backgroundColor: "#FFFFFF",
                  borderRadius: "18px",
                  boxShadow: "0 18px 42px rgba(0, 0, 0, 0.14), 0 4px 16px rgba(255, 107, 0, 0.08)",
                  border: "1.5px solid #FFD8BE",
                  padding: "14px 16px",
                  zIndex: 60,
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  animation: "foodExploreSearchPopover 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                  boxSizing: "border-box",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {!searchQuery.trim() ? (
                  <>
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "11px",
                          fontWeight: "800",
                          color: "#FF6B00",
                          textTransform: "uppercase",
                          letterSpacing: "0.6px",
                          marginBottom: "8px",
                        }}
                      >
                        <Sparkles size={13} color="#FF6B00" />
                        <span>Popular Cravings</span>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {popularCravings.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              setSearchQuery(tag);
                              setIsSearchFocused(false);
                            }}
                            style={{
                              padding: "5px 12px",
                              borderRadius: "9999px",
                              backgroundColor: "#FFF8F2",
                              border: "1px solid #FFEDD5",
                              color: "#C2410C",
                              fontSize: "12px",
                              fontWeight: "600",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#FF6B00";
                              e.currentTarget.style.color = "#FFFFFF";
                              e.currentTarget.style.borderColor = "#FF6B00";
                              e.currentTarget.style.transform = "translateY(-1px) scale(1.03)";
                              e.currentTarget.style.boxShadow = "0 3px 10px rgba(255, 107, 0, 0.25)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "#FFF8F2";
                              e.currentTarget.style.color = "#C2410C";
                              e.currentTarget.style.borderColor = "#FFEDD5";
                              e.currentTarget.style.transform = "none";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          >
                            <span>{tag}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {homeData.kitchens.length > 0 && (
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "11px",
                            fontWeight: "800",
                            color: "#64748B",
                            textTransform: "uppercase",
                            letterSpacing: "0.6px",
                            marginBottom: "6px",
                          }}
                        >
                          <Store size={13} color="#FF6B00" />
                          <span>Featured Kitchens</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          {homeData.kitchens.slice(0, 3).map((k) => (
                            <div
                              key={k.id}
                              onClick={() => {
                                setSearchQuery(k.name);
                                setIsSearchFocused(false);
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "6px 10px",
                                borderRadius: "8px",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#FFF8F2";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "transparent";
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <Store size={14} color="#FF6B00" />
                                <span style={{ fontSize: "13px", fontWeight: "600", color: "#18181B" }}>
                                  {k.name}
                                </span>
                              </div>
                              {k.locality && (
                                <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: "500" }}>
                                  {k.locality}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: "11px",
                        fontWeight: "800",
                        color: "#64748B",
                        textTransform: "uppercase",
                        letterSpacing: "0.6px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Search size={12} color="#FF6B00" />
                        <span>Live Suggestions</span>
                      </div>
                      <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: "600" }}>
                        {searchSuggestions.dishes.length + searchSuggestions.kitchens.length} matches
                      </span>
                    </div>

                    {searchSuggestions.dishes.length === 0 && searchSuggestions.kitchens.length === 0 ? (
                      <div style={{ padding: "12px 6px", textAlign: "center", fontSize: "12.5px", color: "#64748B" }}>
                        No quick matches for &quot;{searchQuery}&quot;. Press Enter to view all results.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: "260px", overflowY: "auto" }}>
                        {searchSuggestions.dishes.map((dish) => (
                          <div
                            key={dish.id}
                            onClick={() => {
                              setSearchQuery(dish.name);
                              setIsSearchFocused(false);
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "7px 10px",
                              borderRadius: "10px",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#FFF8F2";
                              e.currentTarget.style.transform = "translateX(2px)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "transparent";
                              e.currentTarget.style.transform = "none";
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                              <UtensilsCrossed size={14} color="#FF6B00" style={{ flexShrink: 0 }} />
                              <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                                <span style={{ fontSize: "13px", fontWeight: "600", color: "#18181B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {dish.name}
                                </span>
                                {dish.sellerName && (
                                  <span style={{ fontSize: "11px", fontWeight: "600", color: "#EA580C", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                                    <Store size={10} color="#EA580C" /> {dish.sellerName}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: "700",
                                color: "#EA580C",
                                backgroundColor: "#FFF3EB",
                                padding: "2px 8px",
                                borderRadius: "6px",
                                flexShrink: 0,
                              }}
                            >
                              ₹{dish.price}
                            </span>
                          </div>
                        ))}

                        {searchSuggestions.kitchens.map((k) => (
                          <div
                            key={k.id}
                            onClick={() => {
                              setSearchQuery(k.name);
                              setIsSearchFocused(false);
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "7px 10px",
                              borderRadius: "10px",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#FFF8F2";
                              e.currentTarget.style.transform = "translateX(2px)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "transparent";
                              e.currentTarget.style.transform = "none";
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <Store size={14} color="#FF6B00" />
                              <span style={{ fontSize: "13px", fontWeight: "600", color: "#18181B" }}>
                                {k.name}
                              </span>
                            </div>
                            {k.locality && (
                              <span style={{ fontSize: "11px", color: "#94A3B8" }}>
                                {k.locality}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            </div>
          </div>
        </div>{/* End food-explore-desktop-hero */}

        {/* Mobile Explore Categories (Image 2 Design) */}
        {mobileCategories.length > 0 && (
          <div className="food-explore-mobile-categories">
            <div className="mobile-categories-header">
              <h3 className="mobile-categories-title">Explore Categories</h3>
              <span className="mobile-categories-count">8 CUISINES</span>
            </div>
            <div className="mobile-categories-scroll-row hide-scrollbar">
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
                className="mobile-category-item-btn"
              >
                <div className={`mobile-category-square ${!selectedCategory ? "active" : ""}`}>
                  <CrossedKnifeSpoonIcon size={24} color={!selectedCategory ? "#FFFFFF" : "#5C4033"} />
                </div>
                <span className={`mobile-category-text ${!selectedCategory ? "active" : ""}`}>
                  All
                </span>
              </button>

              {mobileCategories.map((cat) => {
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
                        if (newCat) params.set("category", newCat);
                        else params.delete("category");
                        const newUrl = params.toString() ? `/food-explore?${params.toString()}` : "/food-explore";
                        router.replace(newUrl, { scroll: false });
                      }
                    }}
                    className="mobile-category-item-btn"
                  >
                    <div className={`mobile-category-square ${isSelected ? "active" : ""}`}>
                      {getCategoryIcon(cat.name, isSelected)}
                    </div>
                    <span className={`mobile-category-text ${isSelected ? "active" : ""}`}>
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Desktop Dynamic Category Chips Carousel */}
        <div className="food-explore-desktop-categories">
          {dynamicCategories.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Row Header: Popular Categories Title + Scroll Buttons */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#0F172A", margin: 0, letterSpacing: "-0.01em" }}>
                  Popular Categories
                </h2>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => categoryScrollRef.current?.scrollBy({ left: -240, behavior: "smooth" })}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      border: "1px solid #E2E8F0",
                      backgroundColor: "#FFFFFF",
                      color: "#475569",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#CBD5E1";
                      e.currentTarget.style.backgroundColor = "#F8FAFC";
                      e.currentTarget.style.color = "#0F172A";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#E2E8F0";
                      e.currentTarget.style.backgroundColor = "#FFFFFF";
                      e.currentTarget.style.color = "#475569";
                    }}
                    aria-label="Scroll categories left"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => categoryScrollRef.current?.scrollBy({ left: 240, behavior: "smooth" })}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      border: "1px solid #E2E8F0",
                      backgroundColor: "#FFFFFF",
                      color: "#475569",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#CBD5E1";
                      e.currentTarget.style.backgroundColor = "#F8FAFC";
                      e.currentTarget.style.color = "#0F172A";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#E2E8F0";
                      e.currentTarget.style.backgroundColor = "#FFFFFF";
                      e.currentTarget.style.color = "#475569";
                    }}
                    aria-label="Scroll categories right"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Pills Carousel */}
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
                {/* All Cuisines Pill */}
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
                    gap: "8px",
                    padding: "8px 18px",
                    borderRadius: "9999px",
                    border: !selectedCategory ? "1.5px solid #FF5500" : "1px solid #E2E8F0",
                    backgroundColor: !selectedCategory ? "#FFF7ED" : "#FFFFFF",
                    color: !selectedCategory ? "#FF5500" : "#475569",
                    fontWeight: !selectedCategory ? "700" : "600",
                    fontSize: "0.88rem",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    transition: "all 0.15s ease",
                    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
                  }}
                >
                  <UtensilsCrossed size={14} color={!selectedCategory ? "#FF5500" : "#64748B"} />
                  <span>All Cuisines</span>
                </button>

                {/* Individual Categories from dynamicCategories */}
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
                        gap: "8px",
                        padding: "8px 18px",
                        borderRadius: "9999px",
                        border: isSelected ? "1.5px solid #FF5500" : "1px solid #E2E8F0",
                        backgroundColor: isSelected ? "#FFF7ED" : "#FFFFFF",
                        color: isSelected ? "#FF5500" : "#475569",
                        fontWeight: isSelected ? "700" : "600",
                        fontSize: "0.88rem",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                        transition: "all 0.15s ease",
                        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
                      }}
                    >
                      <span>{cat.emoji || "🍲"}</span>
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>{/* End food-explore-desktop-categories */}

        {/* Mobile Sticky Filter Bar (Image 2 Design) */}
        <div className="food-explore-mobile-filter-bar">
          <div className="mobile-filter-pills-row hide-scrollbar">
            {/* 1. All Filters Button */}
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              className={`mobile-filter-pill-btn ${activeFiltersCount > 0 ? "active-filters" : ""}`}
            >
              <SlidersHorizontal size={13} color="#1E293B" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="mobile-filter-pill-badge">{activeFiltersCount}</span>
              )}
            </button>

            {/* 2. Pure Veg Pill */}
            <button
              type="button"
              onClick={() => {
                const nextDiet = selectedDiet === "veg" ? "all" : "veg";
                setSelectedDiet(nextDiet);
                if (typeof window !== "undefined") {
                  localStorage.setItem("cloudkitchen_diet_preference", nextDiet);
                  window.dispatchEvent(new CustomEvent("cloudkitchen_diet_preference_changed", { detail: nextDiet }));
                }
              }}
              className={`mobile-filter-pill-btn ${selectedDiet === "veg" ? "active-veg" : ""}`}
            >
              <span className="mobile-filter-veg-dot" />
              <span>Pure Veg {filterCounts.veg !== undefined ? `(${filterCounts.veg})` : ""}</span>
            </button>

            {/* 3. Non-Veg Pill */}
            <button
              type="button"
              onClick={() => {
                const nextDiet = selectedDiet === "non_veg" ? "all" : "non_veg";
                setSelectedDiet(nextDiet);
                if (typeof window !== "undefined") {
                  localStorage.setItem("cloudkitchen_diet_preference", nextDiet);
                  window.dispatchEvent(new CustomEvent("cloudkitchen_diet_preference_changed", { detail: nextDiet }));
                }
              }}
              className={`mobile-filter-pill-btn ${selectedDiet === "non_veg" ? "active-nonveg" : ""}`}
            >
              <span className="mobile-filter-nonveg-dot" />
              <span>Non-Veg {filterCounts.non_veg !== undefined ? `(${filterCounts.non_veg})` : ""}</span>
            </button>

            {/* 4. Vegan Pill */}
            <button
              type="button"
              onClick={() => {
                const nextDiet = selectedDiet === "vegan" ? "all" : "vegan";
                setSelectedDiet(nextDiet);
                if (typeof window !== "undefined") {
                  localStorage.setItem("cloudkitchen_diet_preference", nextDiet);
                  window.dispatchEvent(new CustomEvent("cloudkitchen_diet_preference_changed", { detail: nextDiet }));
                }
              }}
              className={`mobile-filter-pill-btn ${selectedDiet === "vegan" ? "active-veg" : ""}`}
            >
              <Leaf size={12} color={selectedDiet === "vegan" ? "#16A34A" : "#64748B"} />
              <span>Vegan {filterCounts.vegan !== undefined ? `(${filterCounts.vegan})` : ""}</span>
            </button>

            {/* 5. Jain Pill */}
            <button
              type="button"
              onClick={() => {
                const nextDiet = selectedDiet === "jain" ? "all" : "jain";
                setSelectedDiet(nextDiet);
                if (typeof window !== "undefined") {
                  localStorage.setItem("cloudkitchen_diet_preference", nextDiet);
                  window.dispatchEvent(new CustomEvent("cloudkitchen_diet_preference_changed", { detail: nextDiet }));
                }
              }}
              className={`mobile-filter-pill-btn ${selectedDiet === "jain" ? "active-veg" : ""}`}
            >
              <span>🌾 Jain {filterCounts.jain !== undefined ? `(${filterCounts.jain})` : ""}</span>
            </button>

            {/* 6. Offers Pill */}
            <button
              type="button"
              onClick={() => {
                const next = !offersOnly;
                setOffersOnly(next);
                if (typeof window !== "undefined") {
                  const params = new URLSearchParams(window.location.search);
                  if (next) params.set("offers", "true");
                  else params.delete("offers");
                  const newUrl = params.toString() ? `/food-explore?${params.toString()}` : "/food-explore";
                  router.replace(newUrl, { scroll: false });
                }
              }}
              className={`mobile-filter-pill-btn ${offersOnly ? "active-offers" : ""}`}
            >
              <Tag size={12} color={offersOnly ? "#FF6B00" : "#64748B"} />
              <span>Offers</span>
            </button>

            {/* 7. Under ₹150 Pill */}
            <button
              type="button"
              onClick={() => {
                const next = selectedPrice === "under-150" ? "all" : "under-150";
                setSelectedPrice(next as any);
              }}
              className={`mobile-filter-pill-btn ${selectedPrice === "under-150" ? "active-price" : ""}`}
            >
              <span>Under ₹150</span>
            </button>
          </div>

          {/* Active Filter Removable Tags (Image 2 style) */}
          {activeFiltersCount > 0 && (
            <div className="mobile-active-tags-row hide-scrollbar">
              {selectedDiet !== "all" && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDiet("all");
                    if (typeof window !== "undefined") {
                      localStorage.setItem("cloudkitchen_diet_preference", "all");
                      window.dispatchEvent(new CustomEvent("cloudkitchen_diet_preference_changed", { detail: "all" }));
                    }
                  }}
                  className="mobile-active-filter-tag"
                >
                  <span>{selectedDiet === "veg" ? "Pure Veg" : selectedDiet === "non_veg" ? "Non-Veg" : selectedDiet === "vegan" ? "Vegan" : "Jain"}</span>
                  <X size={12} />
                </button>
              )}

              {selectedPrice !== "all" && (
                <button
                  type="button"
                  onClick={() => setSelectedPrice("all")}
                  className="mobile-active-filter-tag"
                >
                  <span>{selectedPrice === "under-150" ? "Under ₹150" : selectedPrice === "150-300" ? "₹150 – ₹300" : "₹300+"}</span>
                  <X size={12} />
                </button>
              )}

              {offersOnly && (
                <button
                  type="button"
                  onClick={() => {
                    setOffersOnly(false);
                    if (typeof window !== "undefined") {
                      const params = new URLSearchParams(window.location.search);
                      params.delete("offers");
                      const newUrl = params.toString() ? `/food-explore?${params.toString()}` : "/food-explore";
                      router.replace(newUrl, { scroll: false });
                    }
                  }}
                  className="mobile-active-filter-tag"
                >
                  <span>Offers</span>
                  <X size={12} />
                </button>
              )}

              {openOnly && (
                <button
                  type="button"
                  onClick={() => setOpenOnly(false)}
                  className="mobile-active-filter-tag"
                >
                  <span>Open Kitchens</span>
                  <X size={12} />
                </button>
              )}

              {selectedCategory && (
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
                  className="mobile-active-filter-tag"
                >
                  <span>{selectedCategory}</span>
                  <X size={12} />
                </button>
              )}

              {selectedCuisines.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCuisines((prev) => prev.filter((item) => item !== c))}
                  className="mobile-active-filter-tag"
                >
                  <span>{c}</span>
                  <X size={12} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filters Card (Image 2 Design) */}
        <div ref={filterCardRef} className={`${filterStyles.filterBox} food-explore-desktop-filters`}>
          {/* Header Row: Filters [2 active] ... Reset All */}
          <div className={filterStyles.filterHeaderRow}>
            <div className={filterStyles.filterHeaderLeft}>
              <div className={filterStyles.filterHeaderTitle}>
                <SlidersHorizontal size={15} className={filterStyles.filterHeaderIcon} />
                <span>Filters</span>
              </div>
              {activeFiltersCount > 0 && (
                <span className={filterStyles.filterActiveBadge}>
                  {activeFiltersCount} active
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleClearAll}
              className={filterStyles.filterResetBtn}
              title="Reset all filters"
            >
              <RotateCcw size={13} />
              <span>Reset All</span>
            </button>
          </div>

          {/* Controls Row: 5 Filter Pills */}
          <div className={filterStyles.filterControlsRow}>
            {/* 1. Dietary Filter Pill */}
            <div className={filterStyles.filterDropdownWrapper}>
              <button
                type="button"
                onClick={() =>
                  setActiveFilterPopover(activeFilterPopover === "dietary" ? null : "dietary")
                }
                className={`${filterStyles.filterPillBtn} ${
                  selectedDiet !== "all" ? filterStyles.filterPillDietaryActive : ""
                }`}
              >
                {selectedDiet !== "all" && (
                  <span
                    className={
                      selectedDiet === "non_veg"
                        ? filterStyles.dietaryDotRed
                        : filterStyles.dietaryDotGreen
                    }
                  />
                )}
                <span>
                  {selectedDiet === "all"
                    ? "Dietary"
                    : selectedDiet === "veg"
                    ? "Dietary: Pure Veg"
                    : selectedDiet === "non_veg"
                    ? "Dietary: Non-Veg"
                    : selectedDiet === "vegan"
                    ? "Dietary: Vegan"
                    : "Dietary: Jain"}
                </span>
                <ChevronDown
                  size={14}
                  className={`${filterStyles.filterPillChevron} ${
                    activeFilterPopover === "dietary" ? filterStyles.filterPillChevronRotated : ""
                  }`}
                />
              </button>

              {activeFilterPopover === "dietary" && (
                <div className={filterStyles.filterPopoverMenu} role="listbox">
                  <div className={filterStyles.popoverHeader}>
                    <span>Dietary Preference</span>
                  </div>
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
                        onClick={() => {
                          const nextDiet = isSelected && d.id !== "all" ? "all" : (d.id as any);
                          setSelectedDiet(nextDiet);
                          if (typeof window !== "undefined") {
                            localStorage.setItem("cloudkitchen_diet_preference", nextDiet);
                            window.dispatchEvent(
                              new CustomEvent("cloudkitchen_diet_preference_changed", {
                                detail: nextDiet,
                              })
                            );
                          }
                          setActiveFilterPopover(null);
                        }}
                        className={`${filterStyles.popoverItemBtn} ${
                          isSelected ? filterStyles.popoverItemBtnActive : ""
                        }`}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <div className={filterStyles.popoverItemLeft}>
                          <span>{d.label}</span>
                          {d.count !== undefined && (
                            <span className={filterStyles.popoverItemCount}>({d.count})</span>
                          )}
                        </div>
                        {isSelected && <Check size={14} className={filterStyles.popoverCheckIcon} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Price Filter Pill */}
            <div className={filterStyles.filterDropdownWrapper}>
              <button
                type="button"
                onClick={() =>
                  setActiveFilterPopover(activeFilterPopover === "price" ? null : "price")
                }
                className={`${filterStyles.filterPillBtn} ${
                  selectedPrice !== "all" ? filterStyles.filterPillPriceActive : ""
                }`}
              >
                <span>
                  {selectedPrice === "all"
                    ? "Price Range"
                    : selectedPrice === "under-150"
                    ? "Price: Under ₹150"
                    : selectedPrice === "150-300"
                    ? "Price: ₹150 – ₹300"
                    : "Price: ₹300+"}
                </span>
                <ChevronDown
                  size={14}
                  className={`${filterStyles.filterPillChevron} ${
                    activeFilterPopover === "price" ? filterStyles.filterPillChevronRotated : ""
                  }`}
                />
              </button>

              {activeFilterPopover === "price" && (
                <div className={filterStyles.filterPopoverMenu} role="listbox">
                  <div className={filterStyles.popoverHeader}>
                    <span>Price Range</span>
                  </div>
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
                          setActiveFilterPopover(null);
                        }}
                        className={`${filterStyles.popoverItemBtn} ${
                          isSelected ? filterStyles.popoverItemBtnActive : ""
                        }`}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <div className={filterStyles.popoverItemLeft}>
                          <span>{p.label}</span>
                          {p.count > 0 && (
                            <span className={filterStyles.popoverItemCount}>({p.count})</span>
                          )}
                        </div>
                        {isSelected && <Check size={14} className={filterStyles.popoverCheckIcon} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Delivery Time Filter Pill */}
            <div className={filterStyles.filterDropdownWrapper}>
              <button
                type="button"
                onClick={() =>
                  setActiveFilterPopover(activeFilterPopover === "delivery" ? null : "delivery")
                }
                className={`${filterStyles.filterPillBtn} ${
                  sortBy === "fastest" ? filterStyles.filterPillActive : ""
                }`}
              >
                <span>{sortBy === "fastest" ? "⚡ Delivery: Fastest" : "⚡ Delivery Time"}</span>
                <ChevronDown
                  size={14}
                  className={`${filterStyles.filterPillChevron} ${
                    activeFilterPopover === "delivery" ? filterStyles.filterPillChevronRotated : ""
                  }`}
                />
              </button>

              {activeFilterPopover === "delivery" && (
                <div className={filterStyles.filterPopoverMenu} role="listbox">
                  <div className={filterStyles.popoverHeader}>
                    <span>Delivery Time</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSortBy(sortBy === "fastest" ? "" : "fastest");
                      setActiveFilterPopover(null);
                    }}
                    className={`${filterStyles.popoverItemBtn} ${
                      sortBy === "fastest" ? filterStyles.popoverItemBtnActive : ""
                    }`}
                  >
                    <span>⚡ Fastest Delivery (&lt; 30 min)</span>
                    {sortBy === "fastest" && (
                      <Check size={14} className={filterStyles.popoverCheckIcon} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (sortBy === "fastest") setSortBy("");
                      setActiveFilterPopover(null);
                    }}
                    className={`${filterStyles.popoverItemBtn} ${
                      sortBy !== "fastest" ? filterStyles.popoverItemBtnActive : ""
                    }`}
                  >
                    <span>⏱️ Standard Delivery (All)</span>
                    {sortBy !== "fastest" && (
                      <Check size={14} className={filterStyles.popoverCheckIcon} />
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* 4. Rating Filter Pill */}
            <div className={filterStyles.filterDropdownWrapper}>
              <button
                type="button"
                onClick={() =>
                  setActiveFilterPopover(activeFilterPopover === "rating" ? null : "rating")
                }
                className={`${filterStyles.filterPillBtn} ${
                  sortBy === "rating" ? filterStyles.filterPillActive : ""
                }`}
              >
                <span>{sortBy === "rating" ? "★ Rating: Top Rated" : "★ Rating"}</span>
                <ChevronDown
                  size={14}
                  className={`${filterStyles.filterPillChevron} ${
                    activeFilterPopover === "rating" ? filterStyles.filterPillChevronRotated : ""
                  }`}
                />
              </button>

              {activeFilterPopover === "rating" && (
                <div className={filterStyles.filterPopoverMenu} role="listbox">
                  <div className={filterStyles.popoverHeader}>
                    <span>Customer Ratings</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSortBy(sortBy === "rating" ? "" : "rating");
                      setActiveFilterPopover(null);
                    }}
                    className={`${filterStyles.popoverItemBtn} ${
                      sortBy === "rating" ? filterStyles.popoverItemBtnActive : ""
                    }`}
                  >
                    <span>⭐ Top Rated (4.0+ Stars)</span>
                    {sortBy === "rating" && (
                      <Check size={14} className={filterStyles.popoverCheckIcon} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (sortBy === "rating") setSortBy("");
                      setActiveFilterPopover(null);
                    }}
                    className={`${filterStyles.popoverItemBtn} ${
                      sortBy !== "rating" ? filterStyles.popoverItemBtnActive : ""
                    }`}
                  >
                    <span>✨ Any Rating</span>
                    {sortBy !== "rating" && (
                      <Check size={14} className={filterStyles.popoverCheckIcon} />
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* 5. More Filters Pill */}
            <div className={filterStyles.filterDropdownWrapper}>
              <button
                type="button"
                onClick={() =>
                  setActiveFilterPopover(activeFilterPopover === "more" ? null : "more")
                }
                className={`${filterStyles.filterPillBtn} ${
                  offersOnly || openOnly || sortBy === "popular" || selectedCuisines.length > 0
                    ? filterStyles.filterPillActive
                    : ""
                }`}
              >
                <span>
                  🏷️ More Filters
                  {offersOnly || openOnly || sortBy === "popular" || selectedCuisines.length > 0
                    ? ` (${
                        (offersOnly ? 1 : 0) +
                        (openOnly ? 1 : 0) +
                        (sortBy === "popular" ? 1 : 0) +
                        (selectedCuisines.length > 0 ? 1 : 0)
                      })`
                    : ""}
                </span>
                <ChevronDown
                  size={14}
                  className={`${filterStyles.filterPillChevron} ${
                    activeFilterPopover === "more" ? filterStyles.filterPillChevronRotated : ""
                  }`}
                />
              </button>

              {activeFilterPopover === "more" && (
                <div
                  className={`${filterStyles.filterPopoverMenu} ${filterStyles.filterPopoverMenuRight}`}
                  style={{ minWidth: "220px", maxHeight: "300px", overflowY: "auto" }}
                  role="listbox"
                >
                  <div className={filterStyles.popoverHeader}>
                    <span>Quick Filters</span>
                  </div>

                  {/* Offers & Deals */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = !offersOnly;
                      setOffersOnly(next);
                      if (typeof window !== "undefined") {
                        const params = new URLSearchParams(window.location.search);
                        if (next) params.set("offers", "true");
                        else params.delete("offers");
                        const newUrl = params.toString() ? `/food-explore?${params.toString()}` : "/food-explore";
                        router.replace(newUrl, { scroll: false });
                      }
                    }}
                    className={filterStyles.popoverItemBtn}
                  >
                    <div className={filterStyles.popoverItemLeft}>
                      <span
                        className={`${filterStyles.popoverCheckboxIndicator} ${
                          offersOnly ? filterStyles.popoverCheckboxActive : ""
                        }`}
                      >
                        {offersOnly && <Check size={11} color="#FFFFFF" />}
                      </span>
                      <span>🏷️ Offers &amp; Deals</span>
                    </div>
                  </button>

                  {/* Open Kitchens */}
                  <button
                    type="button"
                    onClick={() => setOpenOnly(!openOnly)}
                    className={filterStyles.popoverItemBtn}
                  >
                    <div className={filterStyles.popoverItemLeft}>
                      <span
                        className={`${filterStyles.popoverCheckboxIndicator} ${
                          openOnly ? filterStyles.popoverCheckboxActive : ""
                        }`}
                      >
                        {openOnly && <Check size={11} color="#FFFFFF" />}
                      </span>
                      <span>🏪 Open Kitchens</span>
                    </div>
                  </button>

                  {/* Popular Dishes */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = sortBy === "popular" ? "" : "popular";
                      setSortBy(next);
                      if (typeof window !== "undefined") {
                        const params = new URLSearchParams(window.location.search);
                        if (next === "popular") params.set("sort", "popular");
                        else params.delete("sort");
                        const newUrl = params.toString() ? `/food-explore?${params.toString()}` : "/food-explore";
                        router.replace(newUrl, { scroll: false });
                      }
                    }}
                    className={filterStyles.popoverItemBtn}
                  >
                    <div className={filterStyles.popoverItemLeft}>
                      <span
                        className={`${filterStyles.popoverCheckboxIndicator} ${
                          sortBy === "popular" ? filterStyles.popoverCheckboxActive : ""
                        }`}
                      >
                        {sortBy === "popular" && <Check size={11} color="#FFFFFF" />}
                      </span>
                      <span>✨ Popular Dishes</span>
                    </div>
                  </button>

                  {/* Cuisines Sublist */}
                  {availableCuisines.length > 0 && (
                    <>
                      <div className={filterStyles.popoverDivider} />
                      <div className={filterStyles.popoverHeader}>
                        <span>Cuisines</span>
                      </div>
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
                            className={filterStyles.popoverItemBtn}
                          >
                            <div className={filterStyles.popoverItemLeft}>
                              <span
                                className={`${filterStyles.popoverCheckboxIndicator} ${
                                  isSelected ? filterStyles.popoverCheckboxActive : ""
                                }`}
                              >
                                {isSelected && <Check size={11} color="#FFFFFF" />}
                              </span>
                              <span>{c}</span>
                            </div>
                            {count !== undefined && (
                              <span className={filterStyles.popoverItemCount}>({count})</span>
                            )}
                          </button>
                        );
                      })}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Results Header: "Curated For You" (Image 2 Design) */}
        <div className="food-explore-mobile-results-header">
          <div className="mobile-results-header-left">
            <h2 className="mobile-curated-title">
              {selectedCategory ? `${selectedCategory}` : "Curated For You"}
            </h2>
            <p className="mobile-curated-sub">
              {filteredFoodItems.length} top-rated dishes delivering fast in {defaultAddress?.area || defaultAddress?.city || "Kothrud"}
            </p>
          </div>
          <div className="mobile-sort-container" ref={mobileSortRef}>
            <button
              type="button"
              className={`mobile-sort-trigger-btn ${mobileSortOpen ? "open" : ""}`}
              onClick={() => setMobileSortOpen((prev) => !prev)}
              aria-haspopup="listbox"
              aria-expanded={mobileSortOpen}
            >
              <span className="mobile-sort-trigger-content">
                {(() => {
                  const currentOpt = SORT_OPTIONS.find((o) => o.value === sortBy) || SORT_OPTIONS[0];
                  const IconComp = currentOpt.icon;
                  return (
                    <>
                      <IconComp
                        size={13}
                        className="mobile-sort-trigger-icon"
                        color={sortBy ? "#EA580C" : "#D97706"}
                        fill={sortBy === "rating" ? "#EA580C" : "none"}
                      />
                      <span>{currentOpt.label}</span>
                    </>
                  );
                })()}
              </span>
              <ChevronDown
                size={14}
                className={`mobile-sort-arrow-animated ${mobileSortOpen ? "open" : ""}`}
                strokeWidth={2.4}
              />
            </button>

            {mobileSortOpen && (
              <div className="mobile-sort-dropdown-menu" role="listbox">
                {SORT_OPTIONS.map((opt) => {
                  const isSelected = sortBy === opt.value;
                  const IconComp = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={`mobile-sort-dropdown-item ${isSelected ? "selected" : ""}`}
                      onClick={() => {
                        const val = opt.value;
                        setSortBy(val);
                        setMobileSortOpen(false);
                        if (typeof window !== "undefined") {
                          const params = new URLSearchParams(window.location.search);
                          if (val) params.set("sort", val);
                          else params.delete("sort");
                          const newUrl = params.toString() ? `/food-explore?${params.toString()}` : "/food-explore";
                          router.replace(newUrl, { scroll: false });
                        }
                      }}
                    >
                      <div className="mobile-sort-item-left">
                        <IconComp
                          size={14}
                          className="mobile-sort-item-icon"
                          color={isSelected ? "#EA580C" : "#64748B"}
                          fill={opt.value === "rating" && isSelected ? "#EA580C" : "none"}
                        />
                        <span>{opt.label}</span>
                      </div>
                      {isSelected && (
                        <Check size={14} color="#EA580C" strokeWidth={2.8} />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>


        {/* Desktop Results Header (Image 2 Design) */}
        <div id="food-explore-results-section" className="food-explore-desktop-results-header">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px",
              borderBottom: "1px solid #E2E8F0",
              paddingBottom: "14px",
            }}
          >
            {/* Left: All cuisines [Showing 6 dishes] + Subtitle */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <h2
                  style={{
                    fontSize: "1.35rem",
                    fontWeight: "800",
                    color: "#0F172A",
                    margin: 0,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {selectedCategory || (activeTab === "dishes" ? "All cuisines" : "Cloud Kitchens")}
                </h2>
                <span
                  style={{
                    fontSize: "0.80rem",
                    color: "#475569",
                    fontWeight: "600",
                    backgroundColor: "#F1F5F9",
                    padding: "3px 10px",
                    borderRadius: "9999px",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  Showing {activeTab === "dishes" ? paginatedFoodItems.length : filteredKitchens.length} {activeTab === "dishes" ? (paginatedFoodItems.length === 1 ? "dish" : "dishes") : (filteredKitchens.length === 1 ? "kitchen" : "kitchens")}
                </span>
              </div>
              <p style={{ margin: "4px 0 0 0", fontSize: "0.84rem", color: "#64748B" }}>
                Dietary labels and kitchen safety tags are shown on each dish. Choose a preference to refine your menu.
              </p>
            </div>

            {/* Right: Sort by: [ Recommended ⌵ ]    Back to categories ↑ */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
              {/* Sort Selector */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#64748B" }}>Sort by:</span>
                <div style={{ position: "relative" }} ref={desktopSortRef}>
                  <button
                    type="button"
                    onClick={() => setIsDesktopSortOpen(!isDesktopSortOpen)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                      padding: "6px 14px",
                      borderRadius: "9999px",
                      border: "1px solid #CBD5E1",
                      backgroundColor: "#FFFFFF",
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      color: "#0F172A",
                      cursor: "pointer",
                      minWidth: "145px",
                      boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
                      transition: "all 0.15s ease",
                      fontFamily: "inherit",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#94A3B8")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#CBD5E1")}
                  >
                    <span>
                      {sortBy === "popular"
                        ? "Most Popular"
                        : sortBy === "rating"
                        ? "Rating: High to Low"
                        : sortBy === "price_asc"
                        ? "Price: Low to High"
                        : sortBy === "price_desc"
                        ? "Price: High to Low"
                        : sortBy === "fastest"
                        ? "Fastest Delivery"
                        : "Recommended"}
                    </span>
                    <ChevronDown
                      size={14}
                      color="#64748B"
                      style={{
                        transform: isDesktopSortOpen ? "rotate(180deg)" : "none",
                        transition: "transform 0.18s ease",
                        flexShrink: 0,
                      }}
                    />
                  </button>

                  {isDesktopSortOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 6px)",
                        right: 0,
                        backgroundColor: "#FFFFFF",
                        borderRadius: "12px",
                        padding: "6px",
                        boxShadow: "0 12px 30px -4px rgba(15, 23, 42, 0.14), 0 4px 12px -2px rgba(15, 23, 42, 0.08)",
                        border: "1px solid #E2E8F0",
                        zIndex: 100,
                        minWidth: "185px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                      }}
                      role="listbox"
                    >
                      {[
                        { value: "", label: "Recommended" },
                        { value: "popular", label: "Most Popular" },
                        { value: "rating", label: "Rating: High to Low ⭐" },
                        { value: "price_asc", label: "Price: Low to High" },
                        { value: "price_desc", label: "Price: High to Low" },
                        { value: "fastest", label: "Fastest Delivery ⚡" },
                      ].map((opt) => {
                        const isSelected = sortBy === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setSortBy(opt.value);
                              if (typeof window !== "undefined") {
                                const params = new URLSearchParams(window.location.search);
                                if (opt.value) params.set("sort", opt.value);
                                else params.delete("sort");
                                const newUrl = params.toString() ? `/food-explore?${params.toString()}` : "/food-explore";
                                router.replace(newUrl, { scroll: false });
                              }
                              setIsDesktopSortOpen(false);
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "7px 10px",
                              borderRadius: "8px",
                              border: "none",
                              backgroundColor: isSelected ? "#FFF7ED" : "transparent",
                              color: isSelected ? "#C2410C" : "#334155",
                              fontWeight: isSelected ? 700 : 500,
                              fontSize: "13px",
                              cursor: "pointer",
                              textAlign: "left",
                              transition: "all 0.12s ease",
                              fontFamily: "inherit",
                              width: "100%",
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.backgroundColor = "#F8FAFC";
                                e.currentTarget.style.color = "#0F172A";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.backgroundColor = "transparent";
                                e.currentTarget.style.color = "#334155";
                              }
                            }}
                            role="option"
                            aria-selected={isSelected}
                          >
                            <span>{opt.label}</span>
                            {isSelected && <Check size={14} color="#EA580C" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Back to categories (On same line as Sort) */}
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
                  color: "#EA580C",
                  fontWeight: "700",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 0",
                  whiteSpace: "nowrap",
                  transition: "color 0.15s ease",
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = "#C2410C")}
                onMouseOut={(e) => (e.currentTarget.style.color = "#EA580C")}
              >
                <span>Back to categories</span>
                <ArrowUp size={14} color="currentColor" />
              </button>
            </div>
          </div>
        </div>{/* End food-explore-desktop-results-header */}

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
                      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.03)",
                    }}
                  >
                    <div className="skeleton-shimmer" style={{ width: "100%", height: "170px", borderRadius: "14px" }} />
                    <div className="skeleton-shimmer" style={{ width: "70%", height: "20px", borderRadius: "6px" }} />
                    <div className="skeleton-shimmer" style={{ width: "45%", height: "16px", borderRadius: "4px" }} />
                    <div className="skeleton-shimmer" style={{ width: "90%", height: "36px", borderRadius: "10px", marginTop: "auto" }} />
                  </div>
                ))}
              </div>
            ) : filteredFoodItems.length > 0 ? (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                    gap: "20px",
                    width: "100%",
                  }}
                  className="food-explore-grid"
                >
                  {paginatedFoodItems.map((dish) => {
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
                  const offerDetails = getDishOfferBadge(
                    dish,
                    homeData.coupons,
                    homeData.allFoodItems && homeData.allFoodItems.length > 0 ? homeData.allFoodItems : homeData.foodItems
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
                          height: "175px",
                          position: "relative",
                          overflow: "hidden",
                          backgroundColor: "#F1F5F9",
                        }}
                      >
                        {/* Top Right Favorite Button for Mobile */}
                        <button
                          type="button"
                          onClick={(e) => toggleFavorite(dish.id, e)}
                          className="mobile-dish-favorite-btn"
                          aria-label={favorites[dish.id] ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Heart
                            size={18}
                            color={favorites[dish.id] ? "#EF4444" : "#64748B"}
                            fill={favorites[dish.id] ? "#EF4444" : "none"}
                          />
                        </button>

                        {/* Top Right Rating Badge for Desktop (Image 2 Design) */}
                        <div
                          className="desktop-dish-rating-badge"
                          style={{
                            position: "absolute",
                            top: "10px",
                            right: "10px",
                            zIndex: 2,
                            backgroundColor: "#FFFFFF",
                            color: "#D97706",
                            fontSize: "12px",
                            fontWeight: "800",
                            padding: "4px 9px",
                            borderRadius: "9999px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                          }}
                        >
                          <Star size={11.5} fill="#D97706" color="#D97706" />
                          <span>{dish.rating && Number(dish.rating) > 0 ? Number(dish.rating).toFixed(1) : "4.8"}</span>
                        </div>

                        {/* Offer Badge on Top Left (Image 2 Design) */}
                        {!isClosed && offerDetails.hasOffer && (offerDetails.badgeText || offerDetails.discountAmount) && (
                          <div
                            style={{
                              position: "absolute",
                              top: "10px",
                              left: "10px",
                              backgroundColor: "#FF5500",
                              color: "#FFFFFF",
                              fontSize: "11px",
                              fontWeight: "800",
                              lineHeight: "1.2",
                              letterSpacing: "0.4px",
                              padding: "4px 9px",
                              borderRadius: "8px",
                              boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                              zIndex: 2,
                              textTransform: "uppercase",
                            }}
                          >
                            {offerDetails.badgeText || (offerDetails.discountAmount ? `FLAT ₹${offerDetails.discountAmount} OFF` : "SPECIAL OFFER")}
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

                        {/* Kitchen Tag Badge overlay at bottom of image (Image 2 Design) */}
                        <div
                          style={{
                            position: "absolute",
                            bottom: "8px",
                            left: "8px",
                            zIndex: 2,
                            backgroundColor: "rgba(15, 23, 42, 0.75)",
                            backdropFilter: "blur(4px)",
                            color: "#FFFFFF",
                            fontSize: "11px",
                            fontWeight: "600",
                            padding: "3px 9px",
                            borderRadius: "9999px",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                            maxWidth: "calc(100% - 16px)",
                          }}
                        >
                          <Home size={11} color="#FFFFFF" style={{ flexShrink: 0 }} />
                          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {dish.sellerName || "Verified Kitchen"}
                          </span>
                        </div>
                      </div>

                      {/* Card Info: Desktop (Image 2 Design) */}
                      <div
                        className="desktop-card-body"
                        style={{
                          padding: "14px 16px 16px 16px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                          flex: 1,
                        }}
                      >
                        {/* Row 1: Badges Above Title - Kitchen Name Pill + Dietary Pill */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          {/* Kitchen Name Pill */}
                          <Link
                            href={dish.sellerTrackingId ? `/shop/${dish.sellerTrackingId}${selectedPrice && selectedPrice !== "all" ? `?price=${selectedPrice}` : ""}` : "#"}
                            style={{
                              fontSize: "0.76rem",
                              color: "#C2410C",
                              backgroundColor: "#FFF8F4",
                              border: "1px solid #FED7AA",
                              fontWeight: "700",
                              textDecoration: "none",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "3px 9px",
                              borderRadius: "8px",
                              maxWidth: "180px",
                              transition: "all 0.15s ease",
                            }}
                            title={`Kitchen: ${dish.sellerName || "Verified Kitchen"}`}
                          >
                            <Home size={11} color="#EA580C" style={{ flexShrink: 0 }} />
                            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {dish.sellerName || "Verified Kitchen"}
                            </span>
                          </Link>

                          {/* Dietary Pill (Pure Veg / Non-Veg / Vegan / Jain) */}
                          {(() => {
                            const isNonVeg = isNonVegDish(dish);
                            if (isNonVeg) {
                              return (
                                <span
                                  style={{
                                    backgroundColor: "#FEF2F2",
                                    border: "1px solid #FECACA",
                                    color: "#991B1B",
                                    fontSize: "0.76rem",
                                    fontWeight: "700",
                                    padding: "3px 9px",
                                    borderRadius: "8px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    whiteSpace: "nowrap",
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
                                  border: "1px solid #A7F3D0",
                                  color: "#065F46",
                                  fontSize: "0.76rem",
                                  fontWeight: "700",
                                  padding: "3px 9px",
                                  borderRadius: "8px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#10B981" }} />
                                Pure Veg
                              </span>
                            );
                          })()}
                        </div>

                        {/* Row 2: Dish Title */}
                        <h3
                          style={{
                            fontSize: "1.12rem",
                            fontWeight: "800",
                            color: isClosed ? "#64748B" : "#0F172A",
                            margin: "0",
                            lineHeight: "1.35",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {dish.name}
                        </h3>

                        {/* Row 3: Dish Description */}
                        {dish.description && dish.description.trim() && dish.description.trim().toLowerCase() !== "xyz" && (
                          <p
                            style={{
                              margin: "0",
                              fontSize: "0.82rem",
                              color: isClosed ? "#94A3B8" : "#64748B",
                              fontWeight: "400",
                              lineHeight: "1.45",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                            title={dish.description}
                          >
                            {dish.description}
                          </p>
                        )}

                        {/* Row 4: Coupon Code / Offer Tag (Image 2 Design) */}
                        {!isClosed && offerDetails.hasOffer && (offerDetails.couponCode || offerDetails.couponDescription) && (
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              backgroundColor: "#FFFBEB",
                              border: "1px solid #FDE68A",
                              color: "#92400E",
                              fontSize: "0.76rem",
                              fontWeight: "600",
                              padding: "3px 9px",
                              borderRadius: "7px",
                              width: "fit-content",
                              maxWidth: "100%",
                            }}
                          >
                            <Tag size={11} color="#D97706" style={{ flexShrink: 0 }} />
                            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {offerDetails.couponCode ? (
                                <>
                                  Use code: <strong style={{ color: "#78350F", fontWeight: "800" }}>{offerDetails.couponCode}</strong>
                                </>
                              ) : (
                                offerDetails.couponDescription
                              )}
                            </span>
                          </div>
                        )}

                        {/* Row 5: Add-ons & Distance (if applicable) */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          {hasAddons && !isClosed && (
                            <span
                              style={{
                                fontSize: "0.70rem",
                                fontWeight: "700",
                                color: "#EA580C",
                                backgroundColor: "#FFF7ED",
                                border: "1px solid #FFEDD5",
                                padding: "2px 7px",
                                borderRadius: "6px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px",
                              }}
                            >
                              <Sparkles size={10} />
                              <span>{dishAddons.length} Add-on{dishAddons.length > 1 ? "s" : ""}</span>
                            </span>
                          )}

                          {dish.distanceText && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "0.74rem", color: "#FF5500", fontWeight: "600" }}>
                              <MapPin size={11} />
                              <span>{dish.distanceText} away</span>
                            </span>
                          )}
                        </div>

                        {/* Row 6: Price, Time & Add Button (Image 2 Design) */}
                        <div
                          style={{
                            marginTop: "auto",
                            paddingTop: "10px",
                            borderTop: "1px solid #F1F5F9",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          {/* Price & Delivery Time on Left */}
                          <div>
                            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                              <span style={{ fontSize: "1.25rem", fontWeight: "800", color: isClosed ? "#64748B" : "#0F172A" }}>
                                ₹{dish.price}
                              </span>
                              {offerDetails.hasOffer && (
                                <span style={{ fontSize: "0.82rem", fontWeight: "500", color: "#94A3B8", textDecoration: "line-through" }}>
                                  ₹{Math.round(dish.price * 1.35)}
                                </span>
                              )}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#64748B", fontSize: "0.76rem", fontWeight: "500", marginTop: "2px" }}>
                              <Clock size={12} color="#64748B" />
                              <span>{dish.deliveryTime || "20–30 min"}</span>
                            </div>
                          </div>

                          {/* Right: + ADD Button */}
                          {isClosed ? (
                            <button
                              type="button"
                              onClick={() => handleAddToCart(dish, true)}
                              style={{
                                backgroundColor: "#F1F5F9",
                                color: "#64748B",
                                fontSize: "0.82rem",
                                fontWeight: "700",
                                padding: "7px 14px",
                                borderRadius: "10px",
                                border: "1px solid #CBD5E1",
                                cursor: "pointer",
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
                                padding: "8px 18px",
                                borderRadius: "10px",
                                border: "none",
                                cursor: "default",
                                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)",
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
                                  border: "1.5px solid #FF5500",
                                  borderRadius: "10px",
                                  overflow: "hidden",
                                  boxShadow: "0 2px 8px rgba(255, 85, 0, 0.15)",
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleDecreaseFromCart(dish.id)}
                                  style={{
                                    padding: "6px 12px",
                                    backgroundColor: "transparent",
                                    border: "none",
                                    cursor: "pointer",
                                    fontWeight: "800",
                                    fontSize: "1rem",
                                    color: "#FF5500",
                                  }}
                                  aria-label="Decrease quantity"
                                >
                                  -
                                </button>
                                <span
                                  style={{
                                    padding: "6px 10px",
                                    fontWeight: "800",
                                    fontSize: "0.88rem",
                                    color: "#FF5500",
                                    backgroundColor: "#FFFFFF",
                                    borderLeft: "1.5px solid #FF5500",
                                    borderRight: "1.5px solid #FF5500",
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
                                    padding: "6px 12px",
                                    backgroundColor: "transparent",
                                    border: "none",
                                    cursor: isMaxStockInCart ? "not-allowed" : "pointer",
                                    opacity: isMaxStockInCart ? 0.35 : 1,
                                    fontWeight: "800",
                                    fontSize: "1rem",
                                    color: "#FF5500",
                                  }}
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
                                backgroundColor: "#FF5500",
                                color: "#FFFFFF",
                                fontSize: "0.86rem",
                                fontWeight: "800",
                                padding: "9px 20px",
                                borderRadius: "10px",
                                border: "none",
                                cursor: "pointer",
                                boxShadow: "0 4px 12px rgba(255, 85, 0, 0.25)",
                                transition: "all 0.18s ease",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                letterSpacing: "0.02em",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#E04B00";
                                e.currentTarget.style.transform = "translateY(-1px)";
                                e.currentTarget.style.boxShadow = "0 6px 16px rgba(255, 85, 0, 0.35)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "#FF5500";
                                e.currentTarget.style.transform = "none";
                                e.currentTarget.style.boxShadow = "0 4px 12px rgba(255, 85, 0, 0.25)";
                              }}
                            >
                              <span style={{ fontSize: "1rem", fontWeight: "800" }}>+</span>
                              <span>{hasAddons ? "ADD ITEM" : "ADD"}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Card Info: Mobile View (Image 2 Design) */}
                      <div className="mobile-card-body">
                        {/* Row 1: Veg / Non-Veg Icon + Kitchen Name | Rating Badge */}
                        <div className="mobile-card-row1">
                          <div className="mobile-card-row1-left">
                            {isNonVegDish(dish) ? (
                              <span className="fssai-nonveg-icon" title="Non-Veg">
                                <span className="fssai-nonveg-triangle" />
                              </span>
                            ) : (
                              <span className="fssai-veg-icon" title="Pure Veg">
                                <span className="fssai-veg-dot" />
                              </span>
                            )}
                            <span className="mobile-card-kitchen-name">
                              {dish.sellerName || "VERIFIED KITCHEN"}
                            </span>
                          </div>
                          <div className="mobile-card-rating-pill">
                            <Star size={11} fill="#F97316" color="#F97316" />
                            <span className="mobile-card-rating-val">{dish.rating && Number(dish.rating) > 0 ? Number(dish.rating).toFixed(1) : "4.8"}</span>
                            <span className="mobile-card-rating-count">(180+)</span>
                          </div>
                        </div>

                        {/* Row 2: Dish Title */}
                        <h3 className="mobile-card-dish-name">{dish.name}</h3>

                        {/* Row 3: Description */}
                        {dish.description && dish.description.trim() && dish.description.trim().toLowerCase() !== "xyz" && (
                          <p className="mobile-card-dish-desc">{dish.description}</p>
                        )}

                        {/* Row 4: Meta: Time & Cuisine */}
                        <div className="mobile-card-meta-row">
                          <Clock size={12} color="#64748B" />
                          <span>{dish.deliveryTime || "25–35 min"}</span>
                          <span className="mobile-card-meta-dot">•</span>
                          <span>{dish.categoryName || (dish as any).category || "Italian Classic"}</span>
                        </div>

                        {/* Row 5: Price & Add Button */}
                        <div className="mobile-card-bottom-row">
                          <div className="mobile-card-price-group">
                            <span className="mobile-card-current-price">₹{dish.price}</span>
                            {offerDetails.hasOffer && (
                              <>
                                <span className="mobile-card-original-price">₹{Math.round(dish.price * 1.35)}</span>
                                <span className="mobile-card-discount-badge">{offerDetails.badgeText || "30% OFF"}</span>
                              </>
                            )}
                          </div>

                          {isClosed ? (
                            <button type="button" disabled className="mobile-card-closed-btn">
                              {isSellerClosed ? "Closed" : "Out of Stock"}
                            </button>
                          ) : quantityInCart > 0 ? (
                            <div className="mobile-card-qty-stepper">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDecreaseFromCart(dish.id);
                                }}
                                className="mobile-card-qty-btn"
                              >
                                −
                              </button>
                              <span className="mobile-card-qty-val">{quantityInCart}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToCart(dish, false);
                                }}
                                className="mobile-card-qty-btn"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(dish, false);
                              }}
                              className="mobile-card-add-btn"
                            >
                              + ADD
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Bar (Matching Designer UI) */}
              <div
                className="food-explore-pagination-bar"
                style={{
                  marginTop: "28px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: "16px",
                  padding: "14px 24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "14px",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)",
                }}
              >
                {/* Left: Showing 1 to 6 of 24 dishes nearby */}
                <div style={{ fontSize: "0.85rem", color: "#64748B", fontWeight: "500" }}>
                  Showing{" "}
                  <strong style={{ color: "#0F172A", fontWeight: "700" }}>
                    {startIndex + 1} to {endIndex}
                  </strong>{" "}
                  of{" "}
                  <strong style={{ color: "#0F172A", fontWeight: "700" }}>
                    {filteredFoodItems.length}
                  </strong>{" "}
                  {filteredFoodItems.length === 1 ? "dish" : "dishes"} nearby
                </div>

                {/* Right: Previous, page numbers, Next */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    type="button"
                    disabled={safeCurrentPage <= 1}
                    onClick={() => handlePageChange(safeCurrentPage - 1)}
                    style={{
                      padding: "7px 16px",
                      borderRadius: "12px",
                      border: "1px solid #E2E8F0",
                      backgroundColor: "#FFFFFF",
                      color: safeCurrentPage <= 1 ? "#94A3B8" : "#334155",
                      fontSize: "0.84rem",
                      fontWeight: "600",
                      cursor: safeCurrentPage <= 1 ? "not-allowed" : "pointer",
                      opacity: safeCurrentPage <= 1 ? 0.6 : 1,
                      transition: "all 0.15s ease",
                    }}
                  >
                    Previous
                  </button>

                  {pageNumbers.map((p, idx) => {
                    if (p === "...") {
                      return (
                        <span
                          key={`ellipsis-${idx}`}
                          style={{
                            padding: "0 4px",
                            color: "#94A3B8",
                            fontWeight: "700",
                            fontSize: "0.85rem",
                          }}
                        >
                          ...
                        </span>
                      );
                    }
                    const pageNum = p as number;
                    const isActive = pageNum === safeCurrentPage;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => handlePageChange(pageNum)}
                        style={{
                          minWidth: "36px",
                          height: "36px",
                          padding: "0 6px",
                          borderRadius: "12px",
                          border: isActive ? "none" : "1px solid #E2E8F0",
                          backgroundColor: isActive ? "#FF5500" : "#FFFFFF",
                          color: isActive ? "#FFFFFF" : "#334155",
                          fontSize: "0.86rem",
                          fontWeight: isActive ? "800" : "600",
                          cursor: isActive ? "default" : "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: isActive ? "0 2px 8px rgba(255, 85, 0, 0.28)" : "none",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    disabled={safeCurrentPage >= totalPages}
                    onClick={() => handlePageChange(safeCurrentPage + 1)}
                    style={{
                      padding: "7px 18px",
                      borderRadius: "12px",
                      border: "1px solid #E2E8F0",
                      backgroundColor: "#FFFFFF",
                      color: safeCurrentPage >= totalPages ? "#94A3B8" : "#334155",
                      fontSize: "0.84rem",
                      fontWeight: "600",
                      cursor: safeCurrentPage >= totalPages ? "not-allowed" : "pointer",
                      opacity: safeCurrentPage >= totalPages ? 0.6 : 1,
                      transition: "all 0.15s ease",
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
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
                      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.03)",
                    }}
                  >
                    <div className="skeleton-shimmer" style={{ width: "100%", height: "170px", borderRadius: "14px" }} />
                    <div className="skeleton-shimmer" style={{ width: "65%", height: "22px", borderRadius: "6px" }} />
                    <div className="skeleton-shimmer" style={{ width: "40%", height: "16px", borderRadius: "4px" }} />
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
                  const shopParams = new URLSearchParams();
                  if (selectedDiet && selectedDiet !== "all") {
                    shopParams.set("dietary", selectedDiet);
                  }
                  if (selectedPrice && selectedPrice !== "all") {
                    shopParams.set("price", selectedPrice);
                  }
                  const shopQuery = shopParams.toString() ? `?${shopParams.toString()}` : "";

                  return (
                    <Link
                      key={kitchen.id}
                      href={`/shop/${kitchen.trackingId || kitchen.id}${shopQuery}`}
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
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                              <span style={{ fontSize: "0.82rem", color: "#64748B" }}>
                                📍 {kitchen.locality || kitchen.city || "Pune"}
                              </span>
                              {kitchen.distanceText && (
                                <span style={{ fontSize: "0.80rem", color: "#FF6B00", fontWeight: "700" }}>
                                  • {kitchen.distanceText} away
                                </span>
                              )}
                            </div>
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
              categoryId: (addonModalDish as any).categoryId,
              foodCategoryId: (addonModalDish as any).foodCategoryId,
              category: (addonModalDish as any).category,
              foodCategory: (addonModalDish as any).foodCategory,
              categoryName: (addonModalDish as any).categoryName || (addonModalDish as any).category?.name || (addonModalDish as any).foodCategory?.name,
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

      {/* Mobile Filter Sheet Modal */}
      {isMobileFilterOpen && (
        <div className="mobile-filter-drawer-backdrop" onClick={() => setIsMobileFilterOpen(false)}>
          <div className="mobile-filter-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <div className="mobile-drawer-title-row">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="mobile-drawer-title">Filters & Sorting</span>
                  {activeFiltersCount > 0 && (
                    <span className="mobile-drawer-active-count-badge">
                      {activeFiltersCount}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {activeFiltersCount > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="mobile-drawer-clear-btn"
                    >
                      Reset All
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="mobile-drawer-close-btn"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>

            <div className="mobile-drawer-body">
              {/* Dietary */}
              <div className="mobile-drawer-section">
                <h4 className="mobile-drawer-section-title">Dietary Preference</h4>
                <div className="mobile-drawer-chips-grid">
                  {[
                    { id: "all", label: "All Diet", count: filterCounts.all },
                    { id: "veg", label: "🌱 Pure Veg", count: filterCounts.veg },
                    { id: "non_veg", label: "🍗 Non-Veg", count: filterCounts.non_veg },
                    { id: "vegan", label: "🌿 Vegan", count: filterCounts.vegan },
                    { id: "jain", label: "🌾 Jain", count: filterCounts.jain },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        setSelectedDiet(d.id as any);
                        if (typeof window !== "undefined") {
                          localStorage.setItem("cloudkitchen_diet_preference", d.id);
                          window.dispatchEvent(new CustomEvent("cloudkitchen_diet_preference_changed", { detail: d.id }));
                        }
                      }}
                      className={`mobile-drawer-chip ${selectedDiet === d.id ? "active" : ""}`}
                    >
                      <span>{d.label}</span>
                      {d.count !== undefined && <span className="mobile-drawer-chip-count">({d.count})</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mobile-drawer-section">
                <h4 className="mobile-drawer-section-title">Price Range</h4>
                <div className="mobile-drawer-chips-grid">
                  {[
                    { id: "all", label: "Any Price" },
                    { id: "under-150", label: "Under ₹150" },
                    { id: "150-300", label: "₹150 – ₹300" },
                    { id: "300-plus", label: "₹300+" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPrice(p.id as any)}
                      className={`mobile-drawer-chip ${selectedPrice === p.id ? "active" : ""}`}
                    >
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cuisines */}
              {availableCuisines.length > 0 && (
                <div className="mobile-drawer-section">
                  <h4 className="mobile-drawer-section-title">Cuisines</h4>
                  <div className="mobile-drawer-chips-grid">
                    {availableCuisines.map((c) => {
                      const isSelected = selectedCuisines.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setSelectedCuisines((prev) =>
                              prev.includes(c) ? prev.filter((item) => item !== c) : [...prev, c]
                            );
                          }}
                          className={`mobile-drawer-chip ${isSelected ? "active" : ""}`}
                        >
                          <span>{c}</span>
                          {isSelected && <Check size={12} color="#FF6B00" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quick Toggles */}
              <div className="mobile-drawer-section">
                <h4 className="mobile-drawer-section-title">More Options</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <label className="mobile-drawer-toggle-row">
                    <span>Offers & Deals Only</span>
                    <input
                      type="checkbox"
                      checked={offersOnly}
                      onChange={(e) => setOffersOnly(e.target.checked)}
                      className="mobile-drawer-checkbox"
                    />
                  </label>
                  <label className="mobile-drawer-toggle-row">
                    <span>Open Kitchens Only</span>
                    <input
                      type="checkbox"
                      checked={openOnly}
                      onChange={(e) => setOpenOnly(e.target.checked)}
                      className="mobile-drawer-checkbox"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="mobile-drawer-footer">
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="mobile-drawer-apply-btn"
              >
                Apply Filters ({filteredFoodItems.length} dishes)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />

      <style jsx>{`
        .food-explore-page-wrapper {
          width: 100%;
          min-height: 100vh;
          background: linear-gradient(180deg, #FFF6ED 0%, #FFFFFF 30%);
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* Mobile vs Desktop View Visibility Rules */
        .food-explore-mobile-categories,
        .food-explore-mobile-filter-bar,
        .food-explore-mobile-results-header,
        .mobile-card-body,
        .mobile-dish-favorite-btn {
          display: none !important;
        }

        @media (max-width: 768px) {
          :global(html),
          :global(body) {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            overflow-x: hidden !important;
          }
          :global(body:has(.food-explore-page-wrapper)) {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            overflow-x: hidden !important;
            background: linear-gradient(
              180deg,
              #FEE4D1 0px,
              #FEECDF 100px,
              #FEF2E8 180px,
              #FEFAF6 260px,
              #FFFFFF 360px,
              #FFFFFF 100%
            ) !important;
            background-color: #FFFFFF !important;
          }
          .food-explore-page-wrapper {
            width: 100% !important;
            max-width: 100vw !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow-x: hidden !important;
            background: linear-gradient(
              180deg,
              #FEE4D1 0px,
              #FEECDF 100px,
              #FEF2E8 180px,
              #FEFAF6 260px,
              #FFFFFF 360px,
              #FFFFFF 100%
            ) !important;
            background-color: #FFFFFF !important;
          }
          :global(.food-explore-page-wrapper header) {
            border-bottom-left-radius: 28px !important;
            border-bottom-right-radius: 28px !important;
            border-bottom: none !important;
            box-shadow: 0 10px 24px -4px rgba(0, 0, 0, 0.05), 0 4px 12px -2px rgba(0, 0, 0, 0.02) !important;
            overflow: visible !important;
            width: 100% !important;
            margin: 0 !important;
            background-color: #FFFFFF !important;
          }
          :global(.food-explore-page-wrapper header > div) {
            border-bottom-left-radius: 28px !important;
            border-bottom-right-radius: 28px !important;
            padding-bottom: 12px !important;
            width: 100% !important;
            box-sizing: border-box !important;
            overflow: visible !important;
          }
          .food-explore-desktop-hero,
          .food-explore-desktop-categories,
          .food-explore-desktop-filters,
          .food-explore-desktop-results-header,
          .desktop-card-body,
          .desktop-dish-rating-badge {
            display: none !important;
          }
          .food-explore-container {
            width: 100% !important;
            max-width: 100vw !important;
            box-sizing: border-box !important;
            background: transparent !important;
            background-color: transparent !important;
            padding: 16px 16px 80px 16px !important;
            gap: 16px !important;
            overflow-x: hidden !important;
          }
          .food-explore-mobile-categories {
            display: block !important;
          }
          .food-explore-mobile-filter-bar {
            display: block !important;
            position: sticky;
            top: 0;
            z-index: 30;
            background: transparent !important;
            padding: 8px 0 6px 0;
            margin: -4px 0 2px 0;
          }
          .food-explore-mobile-results-header {
            display: flex !important;
          }
          .mobile-card-body {
            display: flex !important;
          }
          .mobile-dish-favorite-btn {
            display: flex !important;
          }
        }

        /* Mobile Categories Header & Scroll */
        .mobile-categories-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          padding: 0 2px;
        }
        .mobile-categories-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: #1E293B;
          margin: 0;
          letter-spacing: -0.01em;
        }
        .mobile-categories-count {
          font-size: 0.78rem;
          font-weight: 800;
          color: #FF6B00;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .mobile-categories-scroll-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          overflow-x: auto;
          padding: 4px 0 12px 0;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .mobile-categories-scroll-row::-webkit-scrollbar {
          display: none;
        }
        .mobile-category-item-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
          flex-shrink: 0;
          width: 60px;
        }
        .mobile-category-square {
          width: 60px;
          height: 60px;
          border-radius: 18px;
          background-color: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          transition: all 0.2s ease;
        }
        .mobile-category-square.active {
          background: #FF6B00 !important;
          border-color: #FF6B00 !important;
          box-shadow: 0 8px 18px -4px rgba(255, 107, 0, 0.38) !important;
        }
        .mobile-category-text {
          font-size: 0.76rem;
          font-weight: 500;
          color: #64748B;
          margin-top: 6px;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
        }
        .mobile-category-text.active {
          color: #FF6B00 !important;
          font-weight: 700 !important;
        }

        /* Mobile Filter Pills Row */
        .mobile-filter-pills-row {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          padding: 4px 0 6px 0;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .mobile-filter-pills-row::-webkit-scrollbar {
          display: none;
        }
        .mobile-active-tags-row::-webkit-scrollbar {
          display: none;
        }
        .mobile-filter-pill-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 9999px;
          border: 1px solid #E2E8F0;
          background-color: #FFFFFF;
          color: #475569;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 0.15s ease;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
        }
        .mobile-filter-pill-btn.active-veg {
          border: 1.5px solid #86EFAC !important;
          background-color: #DCFCE7 !important;
          color: #15803D !important;
          font-weight: 700 !important;
        }
        .mobile-filter-pill-btn.active-nonveg {
          border: 1.5px solid #EF4444 !important;
          background-color: #FEF2F2 !important;
          color: #B91C1C !important;
          font-weight: 700 !important;
        }
        .mobile-filter-pill-btn.active-filters {
          border: 1px solid #FEDDC4 !important;
          background-color: #FFF6EE !important;
          color: #1E293B !important;
          font-weight: 700 !important;
        }
        .mobile-filter-pill-btn.active-offers,
        .mobile-filter-pill-btn.active-price {
          border: 1.5px solid #FF6B00 !important;
          background-color: #FFF3EB !important;
          color: #FF6B00 !important;
          font-weight: 700 !important;
        }
        .mobile-filter-pill-badge {
          background-color: #FF6B00;
          color: #FFFFFF;
          font-size: 0.72rem;
          font-weight: 800;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .mobile-filter-veg-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background-color: #047857;
          flex-shrink: 0;
        }
        .mobile-filter-nonveg-dot {
          width: 9px;
          height: 9px;
          border-radius: 2.5px;
          background-color: #BE123C;
          flex-shrink: 0;
        }

        /* Active Filter Removable Tags */
        .mobile-active-tags-row {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          padding: 4px 0 8px 0;
          margin-top: 2px;
          -webkit-overflow-scrolling: touch;
        }
        .mobile-active-filter-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 8px;
          border: 1px solid #E2E8F0;
          background-color: #FFFFFF;
          color: #1E293B;
          font-size: 0.76rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 0.15s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
        }
        .mobile-active-filter-tag:hover {
          background-color: #FEE2E2;
          border-color: #FCA5A5;
          color: #DC2626;
        }

        /* Mobile Results Header */
        .food-explore-mobile-results-header {
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 6px;
          margin-bottom: 2px;
        }
        .mobile-results-header-left {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .mobile-curated-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: #18181B;
          margin: 0;
          letter-spacing: -0.02em;
        }
        .mobile-curated-sub {
          font-size: 0.82rem;
          color: #64748B;
          font-weight: 500;
          margin: 0;
        }
        .mobile-sort-container {
          position: relative;
          flex-shrink: 0;
        }
        .mobile-sort-trigger-btn {
          appearance: none;
          background: linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%);
          border: 1.5px solid #FED7AA;
          border-radius: 9999px;
          padding: 6px 14px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 0.78rem;
          font-weight: 700;
          color: #1E293B;
          cursor: pointer;
          outline: none;
          box-shadow: 0 2px 6px rgba(234, 88, 12, 0.08);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .mobile-sort-trigger-btn:hover {
          border-color: #EA580C;
          box-shadow: 0 4px 12px rgba(234, 88, 12, 0.16);
        }
        .mobile-sort-trigger-btn:active {
          transform: scale(0.96);
        }
        .mobile-sort-trigger-btn.open {
          border-color: #EA580C;
          background: #FFF7ED;
          box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.18), 0 4px 12px rgba(234, 88, 12, 0.15);
        }
        .mobile-sort-trigger-content {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .mobile-sort-arrow-animated {
          color: #EA580C;
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .mobile-sort-arrow-animated.open {
          transform: rotate(180deg);
        }
        .mobile-sort-dropdown-menu {
          position: absolute;
          right: 0;
          top: calc(100% + 8px);
          z-index: 100;
          min-width: 195px;
          background: #FFFFFF;
          border: 1.5px solid #FFEDD5;
          border-radius: 16px;
          padding: 6px;
          box-shadow: 0 16px 36px -6px rgba(234, 88, 12, 0.18), 0 6px 16px -2px rgba(0, 0, 0, 0.06);
          display: flex;
          flex-direction: column;
          gap: 2px;
          transform-origin: top right;
          animation: mobileSortPop 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes mobileSortPop {
          0% {
            opacity: 0;
            transform: translateY(-6px) scale(0.94);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .mobile-sort-dropdown-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          border: none;
          background: transparent;
          border-radius: 10px;
          padding: 8px 10px;
          font-size: 0.8rem;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
        }
        .mobile-sort-dropdown-item:hover {
          background-color: #FFF7ED;
          color: #EA580C;
          transform: translateX(2px);
        }
        .mobile-sort-dropdown-item:active {
          transform: scale(0.97);
        }
        .mobile-sort-dropdown-item.selected {
          background-color: #FFF7ED;
          color: #EA580C;
          font-weight: 700;
        }
        .mobile-sort-item-left {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        /* Mobile Dish Card Details */
        .mobile-dish-coupon-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          z-index: 3;
          background-color: rgba(15, 23, 42, 0.88);
          color: #FFFFFF;
          font-size: 10.5px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
        }
        .mobile-dish-favorite-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          z-index: 3;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
          border: none;
          cursor: pointer;
          transition: transform 0.15s ease;
        }
        .mobile-dish-favorite-btn:active {
          transform: scale(0.9);
        }
        .mobile-card-body {
          padding: 12px 14px 16px 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .mobile-card-row1 {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2px;
        }
        .mobile-card-row1-left {
          display: flex;
          align-items: center;
          gap: 7px;
          min-width: 0;
        }
        .fssai-veg-icon {
          width: 15px;
          height: 15px;
          border: 1.5px solid #16A34A;
          border-radius: 3px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background-color: #FFFFFF;
        }
        .fssai-veg-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background-color: #16A34A;
        }
        .fssai-nonveg-icon {
          width: 15px;
          height: 15px;
          border: 1.5px solid #DC2626;
          border-radius: 3px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background-color: #FFFFFF;
        }
        .fssai-nonveg-triangle {
          width: 0;
          height: 0;
          border-left: 3.5px solid transparent;
          border-right: 3.5px solid transparent;
          border-bottom: 7px solid #DC2626;
        }
        .mobile-card-kitchen-name {
          font-size: 0.78rem;
          font-weight: 800;
          color: #334155;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .mobile-card-rating-pill {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          background-color: #EEF2FF;
          border-radius: 9999px;
          padding: 3px 10px;
          flex-shrink: 0;
        }
        .mobile-card-rating-val {
          font-size: 0.82rem;
          font-weight: 800;
          color: #0F172A;
        }
        .mobile-card-rating-count {
          font-size: 0.76rem;
          font-weight: 500;
          color: #64748B;
        }
        .mobile-card-dish-name {
          font-size: 1.1rem;
          font-weight: 800;
          color: #0F172A;
          margin: 2px 0 1px 0;
          line-height: 1.3;
        }
        .mobile-card-dish-desc {
          font-size: 0.82rem;
          color: #64748B;
          margin: 0;
          line-height: 1.4;
          word-break: break-word;
          overflow-wrap: break-word;
        }
        .mobile-card-meta-row {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.78rem;
          color: #475569;
          font-weight: 500;
          margin: 3px 0 6px 0;
        }
        .mobile-card-meta-dot {
          color: #94A3B8;
        }
        .mobile-card-bottom-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 4px;
        }
        .mobile-card-price-group {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }
        .mobile-card-current-price {
          font-size: 1.3rem;
          font-weight: 800;
          color: #0F172A;
        }
        .mobile-card-original-price {
          font-size: 0.85rem;
          color: #94A3B8;
          text-decoration: line-through;
          font-weight: 500;
        }
        .mobile-card-discount-badge {
          font-size: 0.8rem;
          font-weight: 800;
          color: #16A34A;
        }
        .mobile-card-add-btn {
          background-color: #FF6B00;
          color: #FFFFFF;
          border: none;
          font-weight: 800;
          font-size: 0.88rem;
          padding: 8px 24px;
          border-radius: 12px;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(255, 107, 0, 0.28);
          letter-spacing: 0.4px;
          transition: all 0.15s ease;
        }
        .mobile-card-add-btn:active {
          transform: scale(0.96);
        }
        .mobile-card-closed-btn {
          background-color: #F1F5F9;
          color: #94A3B8;
          border: 1px solid #E2E8F0;
          font-weight: 700;
          font-size: 0.8rem;
          padding: 6px 14px;
          border-radius: 8px;
          cursor: not-allowed;
        }
        .mobile-card-qty-stepper {
          display: flex;
          align-items: center;
          gap: 10px;
          background-color: #FF6B00;
          color: #FFFFFF;
          border-radius: 10px;
          padding: 5px 12px;
          box-shadow: 0 3px 12px rgba(255, 107, 0, 0.28);
        }
        .mobile-card-qty-btn {
          background: none;
          border: none;
          color: #FFFFFF;
          font-size: 1.1rem;
          font-weight: 800;
          cursor: pointer;
          padding: 0 4px;
        }
        .mobile-card-qty-val {
          font-size: 0.9rem;
          font-weight: 800;
          min-width: 14px;
          text-align: center;
        }

        /* Mobile Filter Modal (Interactive Centered Popup Dialog) */
        .mobile-filter-drawer-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(15, 23, 42, 0.65);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          backdrop-filter: blur(8px);
          animation: filterModalFadeIn 0.2s ease-out;
        }
        @keyframes filterModalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .mobile-filter-drawer-content {
          width: 100%;
          max-width: 460px;
          max-height: min(85vh, 660px);
          background-color: #FFFFFF;
          border-radius: 24px;
          border: 1.5px solid #FED7AA;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 24px 60px -12px rgba(15, 23, 42, 0.28), 0 8px 24px -4px rgba(234, 88, 12, 0.12);
          animation: filterModalPopIn 0.24s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes filterModalPopIn {
          0% {
            opacity: 0;
            transform: scale(0.92) translateY(10px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .mobile-drawer-header {
          padding: 16px 20px;
          border-bottom: 1px solid #F1F5F9;
          background: linear-gradient(180deg, #FFF7ED 0%, #FFFFFF 100%);
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .mobile-drawer-active-count-badge {
          background-color: #EA580C;
          color: #FFFFFF;
          font-size: 0.72rem;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 9999px;
          line-height: 1.2;
        }
        .mobile-drawer-title-row {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .mobile-drawer-title {
          font-size: 1.05rem;
          font-weight: 800;
          color: #18181B;
          letter-spacing: -0.01em;
        }
        .mobile-drawer-clear-btn {
          background: none;
          border: none;
          color: #EA580C;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 8px;
          transition: all 0.15s ease;
        }
        .mobile-drawer-clear-btn:hover {
          background-color: #FFF7ED;
          color: #C2410C;
        }
        .mobile-drawer-close-btn {
          background: #F1F5F9;
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748B;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .mobile-drawer-close-btn:hover {
          background: #E2E8F0;
          color: #0F172A;
          transform: scale(1.06);
        }
        .mobile-drawer-close-btn:active {
          transform: scale(0.94);
        }
        .mobile-drawer-body {
          padding: 16px 20px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 18px;
          flex: 1;
        }
        .mobile-drawer-body::-webkit-scrollbar {
          width: 5px;
        }
        .mobile-drawer-body::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 9999px;
        }
        .mobile-drawer-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .mobile-drawer-section-title {
          font-size: 0.78rem;
          font-weight: 800;
          color: #64748B;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }
        .mobile-drawer-chips-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .mobile-drawer-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 13px;
          border-radius: 12px;
          border: 1.5px solid #E2E8F0;
          background-color: #FFFFFF;
          color: #334155;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .mobile-drawer-chip:hover {
          border-color: #FED7AA;
          background-color: #FFFDF9;
          transform: translateY(-1px);
        }
        .mobile-drawer-chip:active {
          transform: scale(0.96);
        }
        .mobile-drawer-chip.active {
          border-color: #EA580C !important;
          background: linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%) !important;
          color: #EA580C !important;
          font-weight: 700 !important;
          box-shadow: 0 2px 6px rgba(234, 88, 12, 0.12);
        }
        .mobile-drawer-chip-count {
          font-size: 0.74rem;
          color: #94A3B8;
        }
        .mobile-drawer-chip.active .mobile-drawer-chip-count {
          color: #EA580C;
          opacity: 0.85;
        }
        .mobile-drawer-toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          border-radius: 12px;
          border: 1px solid #F1F5F9;
          background-color: #F8FAFC;
          font-size: 0.86rem;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }
        .mobile-drawer-toggle-row:hover {
          background-color: #F1F5F9;
        }
        .mobile-drawer-checkbox {
          width: 18px;
          height: 18px;
          accent-color: #EA580C;
          cursor: pointer;
        }
        .mobile-drawer-footer {
          padding: 12px 20px 16px 20px;
          border-top: 1px solid #F1F5F9;
          background-color: #FFFFFF;
        }
        .mobile-drawer-apply-btn {
          width: 100%;
          padding: 12px 18px;
          border-radius: 14px;
          background: linear-gradient(135deg, #FF6B00 0%, #EA580C 100%);
          color: #FFFFFF;
          border: none;
          font-size: 0.92rem;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(234, 88, 12, 0.32);
          transition: all 0.18s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .mobile-drawer-apply-btn:hover {
          box-shadow: 0 6px 20px rgba(234, 88, 12, 0.42);
          transform: translateY(-1px);
        }
        .mobile-drawer-apply-btn:active {
          transform: scale(0.98);
        }
        @keyframes foodExploreSearchPopover {
          0% {
            opacity: 0;
            transform: translateY(-8px) scale(0.97);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
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
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .skeleton-shimmer {
          background: linear-gradient(90deg, #F1F5F9 0%, #E2E8F0 50%, #F1F5F9 100%) !important;
          background-size: 200% 100% !important;
          animation: shimmer 1.5s infinite ease-in-out !important;
        }
        @media (max-width: 600px) {
          .food-explore-grid {
            grid-template-columns: 1fr !important;
          }
          .kitchens-explore-grid {
            grid-template-columns: 1fr !important;
          }
          .food-explore-pagination-bar {
            justify-content: center !important;
            text-align: center;
            padding: 12px 14px !important;
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
        <div style={{ minHeight: "100vh", backgroundColor: "#FAFAFA", padding: "40px 24px", display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ width: "240px", height: "36px", borderRadius: "8px", background: "linear-gradient(90deg, #F1F5F9 0%, #E2E8F0 50%, #F1F5F9 100%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite ease-in-out" }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} style={{ height: "300px", borderRadius: "18px", background: "linear-gradient(90deg, #F1F5F9 0%, #E2E8F0 50%, #F1F5F9 100%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite ease-in-out" }} />
            ))}
          </div>
        </div>
      }
    >
      <FoodExploreContent />
    </Suspense>
  );
}
