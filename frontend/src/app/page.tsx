"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Navbar from "@/components/navbar";
import {
  HeroSection,
  CategoryBar,
  PromoRow2,
  FilterRow,
  Properties,
  PopularOrders,
  BestPlaces,
  DashboardBody,
  RecommendedForYou,
} from "@/components/home";
import type { ActiveHomeFilters } from "@/components/home/FilterRow";
import PopupBannerDisplay from "@/components/PopupBannerDisplay";
import { useHomeData } from "@/lib/useHomeData";
import { useLocation } from "@/components/location-provider";
import { resolveLocationCoordinates } from "@/lib/geo-distance";
import { MapPin } from "lucide-react";
import { Footer } from "@/components/explore-desktop/footer";
import {
  isKitchenMatchingDiet,
  isDishMatchingDiet,
  matchesKitchenOrDishSearch,
  matchesKitchenCategoryFilter,
  matchesDishCategory,
  matchesDishSearch,
  isDishMatchingCuisine,
  isKitchenServingCuisine,
  isKitchenHavingOffers,
  isDishHavingOffers,
  getDishOfferBadge,
  resolveDishDietaryTypes,
} from "@/lib/dietary-filter";
import { useRoomModule } from "@/context/RoomModuleContext";

function getInitialDietPreference(): "all" | "veg" | "pure_veg" | "non_veg" | "vegan" | "jain" {
  if (typeof window !== "undefined") {
    try {
      const storedDiet = localStorage.getItem("cloudkitchen_diet_preference");
      if (storedDiet) {
        const lower = storedDiet.toLowerCase().trim();
        if (lower === "pure_veg" || lower === "pureveg") return "pure_veg";
        if (lower === "veg") return "veg";
        if (lower === "non_veg" || lower === "non-veg") return "non_veg";
        if (lower === "vegan") return "vegan";
        if (lower === "jain") return "jain";
        if (lower === "all") return "all";
      }
      const storedVeg = localStorage.getItem("cloudkitchen_veg_preference");
      if (storedVeg === "false") return "all";
      if (storedVeg === "true") return "veg";
    } catch {}
  }
  return "veg";
}

export default function Home() {
  const { isRoomEnabled } = useRoomModule();
  const [selectedCategory, setSelectedCategory] = useState("food");
  const [activeFilters, setActiveFilters] = useState<ActiveHomeFilters>(() => {
    let initialDiet: "all" | "veg" | "pure_veg" | "non_veg" | "vegan" | "jain" = "veg";
    let initialPriceTier: "all" | "under-150" | "150-300" | "300-plus" | null = null;
    if (typeof window !== "undefined") {
      try {
        initialDiet = getInitialDietPreference();
        const storedPrice = localStorage.getItem("cloudkitchen_price_filter") || sessionStorage.getItem("cloudkitchen_price_filter");
        if (storedPrice) {
          const parsed = JSON.parse(storedPrice);
          if (parsed?.preset && parsed.preset !== "all" && parsed.preset !== "custom") {
            initialPriceTier = parsed.preset;
          }
        }
      } catch {}
    }
    return {
      dietary: initialDiet,
      priceTier: initialPriceTier,
    };
  });
  const [homeSearchQuery, setHomeSearchQuery] = useState("");
  const { openLocationModal, defaultAddress, setGuestLocation } = useLocation();
  const homeData = useHomeData();
  const isDietInitializedRef = useRef<boolean>(false);

  const persistDietaryPreference = (dietVal: "all" | "veg" | "pure_veg" | "non_veg" | "non-veg" | "vegan" | "jain") => {
    if (typeof window !== "undefined") {
      try {
        const storageVal =
          dietVal === "non_veg" || dietVal === "non-veg"
            ? "non-veg"
            : dietVal === "pure_veg"
            ? "pure_veg"
            : dietVal === "veg"
            ? "veg"
            : dietVal;
        localStorage.setItem("cloudkitchen_diet_preference", storageVal);
        const isVeg = storageVal === "veg" || storageVal === "pure_veg" || storageVal === "vegan" || storageVal === "jain";
        localStorage.setItem("cloudkitchen_veg_preference", String(isVeg));
        window.dispatchEvent(new CustomEvent("cloudkitchen_diet_preference_changed", { detail: storageVal }));
        window.dispatchEvent(new CustomEvent("cloudkitchen_veg_preference_changed", { detail: isVeg }));
      } catch {}
    }
  };

  // Restore and sync dietary preference with localStorage and across tabs/components
  useEffect(() => {
    try {
      const saved = getInitialDietPreference();
      setActiveFilters((prev) => (prev.dietary === saved ? prev : { ...prev, dietary: saved }));
    } catch {}
    isDietInitializedRef.current = true;

    const syncDiet = (e: any) => {
      const d = e?.detail || getInitialDietPreference();
      const norm =
        d === "non-veg" || d === "non_veg"
          ? "non_veg"
          : d === "vegan"
          ? "vegan"
          : d === "jain"
          ? "jain"
          : d === "pure_veg" || d === "pureveg"
          ? "pure_veg"
          : d === "veg"
          ? "veg"
          : "all";
      setActiveFilters((prev) => (prev.dietary === norm ? prev : { ...prev, dietary: norm }));
    };

    const syncVeg = (e: any) => {
      if (e?.detail !== undefined) {
        const isVeg = Boolean(e.detail);
        setActiveFilters((prev) => {
          const currentDiet =
            typeof window !== "undefined"
              ? localStorage.getItem("cloudkitchen_diet_preference")
              : null;
          if (!isVeg) {
            if (currentDiet === "non-veg" || currentDiet === "non_veg") {
              return prev.dietary === "non_veg" ? prev : { ...prev, dietary: "non_veg" };
            }
            if (
              prev.dietary === "veg" ||
              prev.dietary === "pure_veg" ||
              prev.dietary === "vegan" ||
              prev.dietary === "jain"
            ) {
              return { ...prev, dietary: "all" };
            }
            return prev;
          }
          if (isVeg) {
            if (currentDiet === "pure_veg" || currentDiet === "pureveg") {
              return prev.dietary === "pure_veg" ? prev : { ...prev, dietary: "pure_veg" };
            }
            if (currentDiet === "vegan") {
              return prev.dietary === "vegan" ? prev : { ...prev, dietary: "vegan" };
            }
            if (currentDiet === "jain") {
              return prev.dietary === "jain" ? prev : { ...prev, dietary: "jain" };
            }
            if (
              prev.dietary !== "veg" &&
              prev.dietary !== "pure_veg" &&
              prev.dietary !== "vegan" &&
              prev.dietary !== "jain"
            ) {
              return { ...prev, dietary: "veg" };
            }
          }
          return prev;
        });
      }
    };

    const syncPrice = (e?: any) => {
      const payload = e?.detail;
      if (payload && payload.preset && payload.preset !== "all" && payload.preset !== "custom") {
        setActiveFilters((prev) => (prev.priceTier === payload.preset ? prev : { ...prev, priceTier: payload.preset }));
      } else if (!payload || payload?.preset === "all" || payload?.preset === "custom") {
        setActiveFilters((prev) => (prev.priceTier === null ? prev : { ...prev, priceTier: null }));
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("cloudkitchen_diet_preference_changed", syncDiet);
      window.addEventListener("cloudkitchen_veg_preference_changed", syncVeg);
      window.addEventListener("cloudkitchen_price_filter_changed", syncPrice);
      window.addEventListener("storage", syncDiet);
      window.addEventListener("storage", syncPrice);
      window.addEventListener("popstate", syncPrice);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("cloudkitchen_diet_preference_changed", syncDiet);
        window.removeEventListener("cloudkitchen_veg_preference_changed", syncVeg);
        window.removeEventListener("cloudkitchen_price_filter_changed", syncPrice);
        window.removeEventListener("storage", syncDiet);
        window.removeEventListener("storage", syncPrice);
        window.removeEventListener("popstate", syncPrice);
      }
    };
  }, []);

  const handleHomeSearch = (query: string, location?: string) => {
    const q = (query || "").trim();
    const pinMatch = q.match(/\b\d{6}\b/);
    if (pinMatch) {
      setGuestLocation(pinMatch[0]);
      setHomeSearchQuery("");
      return;
    }
    const resolvedArea = resolveLocationCoordinates(q);
    if (resolvedArea && (q.length >= 3 || resolvedArea.locality.toLowerCase().includes(q.toLowerCase()))) {
      setGuestLocation(
        resolvedArea.pincode,
        resolvedArea.locality,
        resolvedArea.city,
        resolvedArea.lat,
        resolvedArea.lng
      );
    }
    setHomeSearchQuery(q);
  };

  // Dynamic Categories without fallback (excluding non-food categories like rooms)
  const categoryItems = useMemo(() => {
    if (!homeData.categories || homeData.categories.length === 0) return [];
    return homeData.categories
      .filter((c) => {
        const idLower = (c.id || "").toLowerCase().trim();
        const nameLower = (c.name || "").toLowerCase().trim();
        return (
          idLower !== "rooms" &&
          idLower !== "room" &&
          nameLower !== "rooms" &&
          nameLower !== "room" &&
          !nameLower.includes("room") &&
          !nameLower.includes("property")
        );
      })
      .map((c) => ({
        id: c.id,
        name: c.name,
        image: c.image || "/images/categories/cat-food.png",
        emoji: c.emoji || "🍽️",
        route: c.route,
      }));
  }, [homeData.categories, isRoomEnabled]);

  // Extract available cuisines from DB categories & items
  const availableCuisines = useMemo(() => {
    const set = new Set<string>();
    homeData.categories.forEach((c) => {
      if (c.id !== "food" && c.id !== "rooms" && c.name) {
        set.add(c.name);
      }
    });
    const sourceItems = homeData.foodItems;
    sourceItems.forEach((f) => {
      if (f.categoryName) set.add(f.categoryName);
    });
    return Array.from(set);
  }, [homeData.categories, homeData.foodItems]);

  // Compute dynamic filter counts from available kitchens & items
  const filterCounts = useMemo(() => {
    const kitchens = homeData.kitchens;
    const items = homeData.foodItems;
    if (!kitchens || kitchens.length === 0) return undefined;

    let baseKitchens = kitchens;
    let baseItems = items || [];

    if (homeSearchQuery) {
      baseKitchens = baseKitchens.filter((k) => matchesKitchenOrDishSearch(homeSearchQuery, k, baseItems));
      baseItems = baseItems.filter((f) => matchesDishSearch(homeSearchQuery, f));
    }

    if (selectedCategory && selectedCategory !== "food" && selectedCategory !== "rooms") {
      baseKitchens = baseKitchens.filter((k) => matchesKitchenCategoryFilter(selectedCategory, k, baseItems));
      baseItems = baseItems.filter((f) => matchesDishCategory(selectedCategory, f));
    }

    const cuisineCounts: Record<string, number> = {};
    availableCuisines.forEach((c) => {
      cuisineCounts[c] = baseKitchens.filter((k) => isKitchenServingCuisine(c, k, baseItems)).length;
    });

    return {
      all: baseKitchens.length,
      veg: baseKitchens.filter((k) => isKitchenMatchingDiet(k, "veg", baseItems)).length,
      pure_veg: baseKitchens.filter((k) => isKitchenMatchingDiet(k, "pure_veg", baseItems)).length,
      non_veg: baseKitchens.filter((k) => isKitchenMatchingDiet(k, "non_veg", baseItems)).length,
      vegan: baseKitchens.filter((k) => isKitchenMatchingDiet(k, "vegan", baseItems)).length,
      jain: baseKitchens.filter((k) => isKitchenMatchingDiet(k, "jain", baseItems)).length,
      under150: baseItems.filter((f) => f.price <= 150).length,
      price150to300: baseItems.filter((f) => f.price > 150 && f.price <= 300).length,
      price300plus: baseItems.filter((f) => f.price > 300).length,
      cuisineCounts,
    };
  }, [homeData.kitchens, homeData.foodItems, availableCuisines, homeSearchQuery, selectedCategory]);

  // Dynamic Kitchens / Places (and multi-dimensional filtering)
  const dynamicPlaces = useMemo(() => {
    const sourceKitchens = homeData.kitchens;
    const sourceFoodItems = homeData.foodItems;

    if (!sourceKitchens || sourceKitchens.length === 0) {
      return [];
    }
    let list = sourceKitchens;

    // 0. Search query filter (matches kitchen name, category, or child dishes globally)
    if (homeSearchQuery) {
      list = list.filter((k) =>
        matchesKitchenOrDishSearch(homeSearchQuery, k, sourceFoodItems)
      );
    }

    // 1. Category Bar Filter
    if (selectedCategory && selectedCategory !== "food" && selectedCategory !== "rooms") {
      list = list.filter((k) =>
        matchesKitchenCategoryFilter(selectedCategory, k, sourceFoodItems)
      );
    }

    // 2. Dietary Filter
    if (activeFilters.dietary && activeFilters.dietary !== "all") {
      list = list.filter((k) =>
        isKitchenMatchingDiet(k, activeFilters.dietary, sourceFoodItems)
      );
    }

    // 3. Rating Filter (4.5+)
    if (activeFilters.minRating) {
      list = list.filter((k) => (k.rating || 0) >= (activeFilters.minRating || 4.5));
    }

    // 4. Fastest Delivery Filter (<30 min)
    if (activeFilters.fastest) {
      list = list.filter((k) => {
        const num = parseInt(k.time) || 30;
        return num <= 25 || k.time.includes("15") || k.time.includes("20");
      });
    }

    // 4.5 Offers & Deals Filter (Only show kitchens having offers/coupons)
    if (activeFilters.offersOnly) {
      list = list.filter((k) =>
        isKitchenHavingOffers(k, homeData.coupons, sourceFoodItems)
      );
    }

    // 5. Cuisines Filter
    if (activeFilters.cuisines && activeFilters.cuisines.length > 0) {
      list = list.filter((k) =>
        activeFilters.cuisines!.some((c) => isKitchenServingCuisine(c, k, sourceFoodItems))
      );
    }

    // 6. Price Tier Filter
    if (activeFilters.priceTier && activeFilters.priceTier !== "all") {
      const tier = activeFilters.priceTier;
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

        if (tier === "under-150") return prices.some((p) => p <= 150);
        if (tier === "150-300") return prices.some((p) => p >= 150 && p <= 300);
        if (tier === "300-plus") return prices.some((p) => p >= 300);
        return true;
      });
    }

    return list.map((k) => ({
      id: k.id,
      name: k.name,
      rating: k.rating,
      time: k.time,
      imageUrl: k.imageUrl,
      category: k.category,
      kitchenId: k.trackingId || k.id,
      trackingId: k.trackingId,
      locality: k.locality,
      isOnline: k.isOnline !== false,
      foodType: k.foodType,
    }));
  }, [homeData.kitchens, homeData.foodItems, homeData.coupons, selectedCategory, activeFilters, homeSearchQuery]);

  // Dynamic Offers for PopularOrders derived from active coupons & deliverable food items
  const dynamicOffers = useMemo(() => {
    const sourceFoodItems = homeData.foodItems;
    if (!sourceFoodItems || sourceFoodItems.length === 0) {
      return [];
    }

    let list = sourceFoodItems;

    if (homeSearchQuery) {
      list = list.filter((f) => matchesDishSearch(homeSearchQuery, f));
    }

    if (selectedCategory && selectedCategory !== "food" && selectedCategory !== "rooms") {
      list = list.filter((f) => matchesDishCategory(selectedCategory, f));
    }

    if (activeFilters.dietary && activeFilters.dietary !== "all") {
      list = list.filter((f) => isDishMatchingDiet(f, activeFilters.dietary));
    }

    if (activeFilters.priceTier === "under-150") {
      list = list.filter((f) => f.price <= 150);
    } else if (activeFilters.priceTier === "150-300") {
      list = list.filter((f) => f.price > 150 && f.price <= 300);
    } else if (activeFilters.priceTier === "300-plus") {
      list = list.filter((f) => f.price > 300);
    }

    if (activeFilters.cuisines && activeFilters.cuisines.length > 0) {
      list = list.filter((f) =>
        activeFilters.cuisines!.some((c) => isDishMatchingCuisine(c, f))
      );
    }

    if (list.length === 0) return [];

    // Pair all eligible food items with active offers using the unified offer resolver
    const offersList: any[] = [];
    list.forEach((matchedItem) => {
      const offerInfo = getDishOfferBadge(matchedItem, homeData.coupons, sourceFoodItems);
      if (offerInfo.hasOffer && offerInfo.badgeText) {
        const rawStock = matchedItem.stockQuantity !== undefined && matchedItem.stockQuantity !== null
          ? Number(matchedItem.stockQuantity)
          : (matchedItem.maxStock !== undefined && matchedItem.maxStock !== null ? Number(matchedItem.maxStock) : -1);

        offersList.push({
          id: `offer-${matchedItem.id}`,
          foodItemId: matchedItem.id,
          discount: offerInfo.badgeText,
          title: matchedItem.name,
          code: offerInfo.couponCode
            ? `Use code: ${offerInfo.couponCode}`
            : offerInfo.couponDescription || "Special Offer",
          description: matchedItem.description || "",
          imageUrl: matchedItem.imageUrl || "/images/places/place-biryani.png",
          link: matchedItem.sellerTrackingId ? `/shop/${matchedItem.sellerTrackingId}` : `/food-explore?item=${matchedItem.id}`,
          price: matchedItem.price || 0,
          rating: matchedItem.rating || 5.0,
          deliveryTime: matchedItem.deliveryTime || "20-30 min",
          sellerId: matchedItem.sellerId || "",
          sellerName: matchedItem.sellerName || "Cloud Kitchen",
          sellerTrackingId: matchedItem.sellerTrackingId || "",
          sellerIsOnline: matchedItem.sellerIsOnline !== false,
          isAvailable: matchedItem.isAvailable !== false && rawStock !== 0,
          itemType: matchedItem.itemType || "VEG",
          stockQuantity: rawStock,
          maxStock: rawStock,
          categoryId: (matchedItem as any).categoryId,
          foodCategoryId: (matchedItem as any).foodCategoryId,
          category: (matchedItem as any).category,
          foodCategory: (matchedItem as any).foodCategory,
          categoryName: (matchedItem as any).categoryName || (matchedItem as any).category?.name || (matchedItem as any).foodCategory?.name,
          addons: (matchedItem as any).addons,
        });
      }
    });

    return offersList.slice(0, 4);
  }, [homeData.foodItems, homeData.coupons, selectedCategory, activeFilters, homeSearchQuery]);

  // Dynamic Dishes for BestPlaces
  const dynamicDishes = useMemo(() => {
    const sourceFoodItems = homeData.foodItems;
    if (!sourceFoodItems || sourceFoodItems.length === 0) return [];
    let list = sourceFoodItems;

    if (homeSearchQuery) {
      list = list.filter((f) => matchesDishSearch(homeSearchQuery, f));
    }

    if (selectedCategory && selectedCategory !== "food" && selectedCategory !== "rooms") {
      list = list.filter((f) => matchesDishCategory(selectedCategory, f));
    }

    if (activeFilters.dietary && activeFilters.dietary !== "all") {
      list = list.filter((f) => isDishMatchingDiet(f, activeFilters.dietary));
    }

    // Price tier filter
    if (activeFilters.priceTier === "under-150") {
      list = list.filter((f) => f.price <= 150);
    } else if (activeFilters.priceTier === "150-300") {
      list = list.filter((f) => f.price > 150 && f.price <= 300);
    } else if (activeFilters.priceTier === "300-plus") {
      list = list.filter((f) => f.price > 300);
    }

    if (activeFilters.cuisines && activeFilters.cuisines.length > 0) {
      list = list.filter((f) =>
        activeFilters.cuisines!.some((c) => isDishMatchingCuisine(c, f))
      );
    }

    if (activeFilters.offersOnly) {
      list = list.filter((f) => isDishHavingOffers(f, homeData.coupons, sourceFoodItems));
    }

    if (activeFilters.minRating) {
      list = list.filter((f) => (f.rating || 0) >= (activeFilters.minRating || 4.5));
    }

    const sortedDishes = [...list].sort((a, b) => {
      const salesA = Number(a.totalSales || a.orderCount) || 0;
      const salesB = Number(b.totalSales || b.orderCount) || 0;
      if (salesB !== salesA) return salesB - salesA;
      const ratingA = Number(a.rating) || 0;
      const ratingB = Number(b.rating) || 0;
      if (ratingB !== ratingA) return ratingB - ratingA;
      return 0;
    });

    return sortedDishes.slice(0, 4).map((f) => {
      const offerInfo = getDishOfferBadge(f, homeData.coupons, sourceFoodItems);
      const discountText = offerInfo.hasOffer && offerInfo.badgeText ? offerInfo.badgeText : undefined;

      return {
        id: f.id,
        name: f.name,
        rating: f.rating || 5.0,
        time: f.deliveryTime || "20-30 min",
        imageUrl: f.imageUrl || "/images/places/place-biryani.png",
        link: f.sellerTrackingId ? `/shop/${f.sellerTrackingId}` : `/food-explore`,
        itemType: resolveDishDietaryTypes(f),
        categoryName: f.categoryName,
        description: f.description,
        sellerIsOnline: f.sellerIsOnline !== false,
        isAvailable: f.isAvailable !== false,
        stockQuantity: typeof f.stockQuantity === "number" ? f.stockQuantity : -1,
        maxStock: typeof f.maxStock === "number" ? f.maxStock : (typeof f.stockQuantity === "number" ? f.stockQuantity : -1),
        distanceText: f.distanceText,
        discount: discountText,
      };
    });
  }, [homeData.foodItems, homeData.coupons, selectedCategory, activeFilters, homeSearchQuery]);

  // Dynamic Top Rated Items for DashboardBody
  const dynamicTopRated = useMemo(() => {
    const sourceFoodItems = homeData.foodItems;
    if (!sourceFoodItems || sourceFoodItems.length === 0) return [];
    let list = sourceFoodItems;

    if (homeSearchQuery) {
      list = list.filter((f) => matchesDishSearch(homeSearchQuery, f));
    }

    if (selectedCategory && selectedCategory !== "food" && selectedCategory !== "rooms") {
      list = list.filter((f) => matchesDishCategory(selectedCategory, f));
    }

    if (activeFilters.dietary && activeFilters.dietary !== "all") {
      list = list.filter((f) => isDishMatchingDiet(f, activeFilters.dietary));
    }

    if (activeFilters.priceTier === "under-150") {
      list = list.filter((f) => f.price <= 150);
    } else if (activeFilters.priceTier === "150-300") {
      list = list.filter((f) => f.price > 150 && f.price <= 300);
    } else if (activeFilters.priceTier === "300-plus") {
      list = list.filter((f) => f.price > 300);
    }

    if (activeFilters.cuisines && activeFilters.cuisines.length > 0) {
      list = list.filter((f) =>
        activeFilters.cuisines!.some((c) => isDishMatchingCuisine(c, f))
      );
    }

    if (activeFilters.offersOnly) {
      list = list.filter((f) => isDishHavingOffers(f, homeData.coupons, sourceFoodItems));
    }

    if (activeFilters.minRating) {
      list = list.filter((f) => (f.rating || 0) >= (activeFilters.minRating || 4.5));
    }

    const sortedTopRated = [...list].sort((a, b) => {
      const rA = Number(a.rating) || 0;
      const rB = Number(b.rating) || 0;
      if (rB !== rA) return rB - rA;
      const countA = Number(a.totalRatings || a.reviewsCount) || 0;
      const countB = Number(b.totalRatings || b.reviewsCount) || 0;
      if (countB !== countA) return countB - countA;
      const salesA = Number(a.totalSales || a.orderCount) || 0;
      const salesB = Number(b.totalSales || b.orderCount) || 0;
      if (salesB !== salesA) return salesB - salesA;
      return 0;
    });

    return sortedTopRated.slice(0, 6).map((f) => ({
      id: f.id,
      foodItemId: f.id,
      name: f.name,
      rating: f.rating || 5.0,
      category: f.categoryName || (f.itemType === "VEG" ? "Pure Veg" : "Non-Veg Special"),
      price: f.price || 0,
      time: f.deliveryTime || "20-30 min",
      imageUrl: f.imageUrl || "/images/places/place-pizza.png",
      link: f.sellerTrackingId ? `/shop/${f.sellerTrackingId}` : `/food-explore`,
      itemType: resolveDishDietaryTypes(f),
      sellerId: f.sellerId,
      sellerName: f.sellerName,
      sellerIsOnline: f.sellerIsOnline !== false,
      isAvailable: f.isAvailable !== false,
      stockQuantity: typeof f.stockQuantity === "number" ? f.stockQuantity : -1,
      maxStock: typeof f.maxStock === "number" ? f.maxStock : (typeof f.stockQuantity === "number" ? f.stockQuantity : -1),
      distanceText: f.distanceText,
      description: f.description,
      addons: f.addons,
      variants: f.variants,
    }));
  }, [homeData.foodItems, homeData.coupons, selectedCategory, activeFilters, homeSearchQuery]);

  // Dynamic Recommended Dishes for RecommendedForYou
  const dynamicRecommended = useMemo(() => {
    const sourceFoodItems = homeData.foodItems;
    if (!sourceFoodItems || sourceFoodItems.length === 0) return [];
    let list = sourceFoodItems;

    if (homeSearchQuery) {
      list = list.filter((f) => matchesDishSearch(homeSearchQuery, f));
    }

    if (selectedCategory && selectedCategory !== "food" && selectedCategory !== "rooms") {
      list = list.filter((f) => matchesDishCategory(selectedCategory, f));
    }

    if (activeFilters.dietary && activeFilters.dietary !== "all") {
      list = list.filter((f) => isDishMatchingDiet(f, activeFilters.dietary));
    }

    if (activeFilters.priceTier === "under-150") {
      list = list.filter((f) => f.price <= 150);
    } else if (activeFilters.priceTier === "150-300") {
      list = list.filter((f) => f.price > 150 && f.price <= 300);
    } else if (activeFilters.priceTier === "300-plus") {
      list = list.filter((f) => f.price > 300);
    }

    if (activeFilters.cuisines && activeFilters.cuisines.length > 0) {
      list = list.filter((f) =>
        activeFilters.cuisines!.some((c) => isDishMatchingCuisine(c, f))
      );
    }

    if (activeFilters.offersOnly) {
      list = list.filter((f) => isDishHavingOffers(f, homeData.coupons, sourceFoodItems));
    }

    const items = list.length > 4 ? [...list].reverse() : list;
    return items.slice(0, 4).map((f) => ({
      id: f.id,
      name: f.name,
      rating: f.rating || 5.0,
      time: `₹${f.price} • ${f.deliveryTime || "20-25 min"}`,
      imageUrl: f.imageUrl || "/images/places/place-biryani.png",
      link: f.sellerTrackingId ? `/shop/${f.sellerTrackingId}` : `/food-explore?item=${f.id}`,
      itemType: resolveDishDietaryTypes(f),
      categoryName: f.categoryName,
      description: f.description,
      sellerIsOnline: f.sellerIsOnline !== false,
      isAvailable: f.isAvailable !== false,
      stockQuantity: f.stockQuantity,
      maxStock: f.maxStock,
    }));
  }, [homeData.foodItems, homeData.coupons, selectedCategory, activeFilters, homeSearchQuery]);

  // Dynamic Promo Banner from active coupons or DB promo banners
  const promoProps = useMemo(() => {
    if (homeData.coupons && homeData.coupons.length > 0) {
      const cp = homeData.coupons[0];
      return {
        code: cp.code,
        titleHighlight: cp.discountPercentage ? `${cp.discountPercentage}% OFF` : `FLAT ₹${cp.discountAmount} OFF`,
        description: cp.description || "Limited time offer on all orders.",
      };
    }
    return undefined;
  }, [homeData.coupons]);

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "linear-gradient(180deg, #FFF3E3 0%, #FFFBF7 35%, #FFFFFF 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        overflowX: "clip",
      }}
    >
      <PopupBannerDisplay />

      {/* 0. Top Navbar */}
      <Navbar
        hideSearch={true}
        selectedDiet={
          activeFilters.dietary === "non_veg"
            ? "non-veg"
            : activeFilters.dietary === "vegan"
            ? "vegan"
            : activeFilters.dietary === "jain"
            ? "jain"
            : activeFilters.dietary === "veg"
            ? "veg"
            : "all"
        }
        onDietChange={(diet) => {
          const nextDiet =
            diet === "non-veg" || diet === "non_veg"
              ? "non_veg"
              : diet === "vegan"
              ? "vegan"
              : diet === "jain"
              ? "jain"
              : diet === "veg"
              ? "veg"
              : "all";
          setActiveFilters((prev) => ({
            ...prev,
            dietary: nextDiet,
          }));
          persistDietaryPreference(nextDiet);
        }}
      />

      {/* Main Canvas Container */}
      <main
        style={{
          width: "1440px",
          maxWidth: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "40px",
          padding: "40px 80px",
          boxSizing: "border-box",
        }}
        className="home-page-canvas"
      >
        {/* 1. Hero Section (Dynamic Search Autocomplete + Map Picker) */}
        <HeroSection
          availableItems={homeData.foodItems}
          availableKitchens={homeData.kitchens}
          availableRooms={homeData.rooms}
          onSearch={handleHomeSearch}
          currentSearchQuery={homeSearchQuery}
        />

        {/* Home Search Query Active Status Banner */}
        {homeSearchQuery && (
          <div
            style={{
              width: "100%",
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              padding: "14px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              border: "1.5px solid #FFD8C2",
              boxShadow: "0 4px 14px rgba(255, 107, 0, 0.06)",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "14px", color: "#64748B" }}>Showing results for:</span>
              <span style={{ fontSize: "15px", fontWeight: "700", color: "#FF6B00" }}>
                &quot;{homeSearchQuery}&quot;
              </span>
              <span
                style={{
                  fontSize: "12.5px",
                  fontWeight: "700",
                  backgroundColor: "#FFF3EB",
                  color: "#FF6B00",
                  padding: "3px 10px",
                  borderRadius: "12px",
                  border: "1px solid #FFD8C2",
                }}
              >
                {dynamicPlaces.length} {dynamicPlaces.length === 1 ? "Kitchen" : "Kitchens"} Available
              </span>
            </div>
            <button
              type="button"
              onClick={() => setHomeSearchQuery("")}
              style={{
                background: "#FFF3EB",
                border: "1px solid #FFD8C2",
                color: "#FF6B00",
                fontSize: "13px",
                fontWeight: "700",
                borderRadius: "8px",
                padding: "6px 14px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              Clear Filter
            </button>
          </div>
        )}

        {/* 2. Category Bar */}
        {categoryItems.length > 0 && (
          <CategoryBar
            activeCategoryId={selectedCategory}
            onSelectCategory={(id) => setSelectedCategory(id)}
            items={categoryItems}
          />
        )}

        {/* 2.5 Multi-dimensional Filter Row */}
        <FilterRow
          activeFilters={activeFilters}
          onFilterChange={(newFilters) => {
            setActiveFilters(newFilters);
            const dietVal = newFilters.dietary || "all";
            persistDietaryPreference(dietVal);
          }}
          availableCuisines={availableCuisines}
          counts={filterCounts}
        />

        {/* Out of Service Area Alert Banner (only shown during location browsing, not during name search) */}
        {!homeSearchQuery && homeData.activePincode && !homeData.isLoading && !homeData.isDirectlyDeliverable && (
          <div
            style={{
              width: "100%",
              backgroundColor: "#FFF8F2",
              border: "1.5px solid #FED7AA",
              borderRadius: "18px",
              padding: "18px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "14px",
              boxShadow: "0 4px 16px rgba(249, 115, 22, 0.06)",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  backgroundColor: "#FFEADB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FF6B00",
                  flexShrink: 0,
                }}
              >
                <MapPin size={22} />
              </div>
              <div>
                <h3 style={{ margin: "0 0 2px 0", fontSize: "1rem", fontWeight: "700", color: "#0F172A" }}>
                  No Kitchens Within 5 km of PIN {homeData.activePincode}
                </h3>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748B" }}>
                  No cloud kitchens are within the 5 km delivery radius of your selected location. Choose an area like Kothrud (411038 / 411052), Shivajinagar (411004), or Hinjawadi (411057) for doorstep delivery.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={openLocationModal}
              style={{
                padding: "9px 18px",
                borderRadius: "10px",
                backgroundColor: "#FF6B00",
                color: "#FFFFFF",
                fontWeight: "700",
                fontSize: "0.88rem",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(255, 107, 0, 0.25)",
                whiteSpace: "nowrap",
              }}
            >
              Change Location
            </button>
          </div>
        )}

        {/* 3. Promo Banner Row (Dynamic Full-Graphic Banner) */}
        {homeData.promoBanners && homeData.promoBanners.length > 0 && (
          <PromoRow2 banners={homeData.promoBanners} {...promoProps} />
        )}

        {/* 4. Properties / Best Places Nearby */}
        <Properties
          places={dynamicPlaces}
          foodItems={homeData.foodItems}
          allKitchens={homeData.kitchens}
          isLoading={homeData.isLoading}
          selectedDietary={
            (activeFilters.dietary as string) === "pure_veg"
              ? ["pure_veg"]
              : activeFilters.dietary === "non_veg" || (activeFilters.dietary as string) === "non-veg"
              ? ["non-veg"]
              : activeFilters.dietary === "vegan"
              ? ["vegan"]
              : activeFilters.dietary === "jain"
              ? ["jain"]
              : []
          }
          onDietaryChange={(newDietary) => {
            const lastSelected = newDietary.length > 0 ? newDietary[newDietary.length - 1] : "all";
            const nextDiet: "all" | "veg" | "pure_veg" | "non_veg" | "vegan" | "jain" =
              lastSelected === "pure_veg" || lastSelected === "pure-veg"
                ? "pure_veg"
                : lastSelected === "veg"
                ? "veg"
                : lastSelected === "non-veg" || lastSelected === "non_veg"
                ? "non_veg"
                : lastSelected === "vegan"
                ? "vegan"
                : lastSelected === "jain"
                ? "jain"
                : "all";

            setActiveFilters((prev) => ({
              ...prev,
              dietary: nextDiet,
            }));
            persistDietaryPreference(nextDiet);
          }}
        />

        {/* 6. Popular Orders / Today's Special Offers */}
        {dynamicOffers.length > 0 && (
          <PopularOrders
            offers={dynamicOffers}
            seeAllLink="/food-explore?offers=true"
          />
        )}

        {/* 7. Best Places / Popular Dishes */}
        {dynamicDishes.length > 0 && (
          <BestPlaces
            dishes={dynamicDishes}
            seeAllLink="/food-explore?sort=popular"
          />
        )}

        {/* 8. Dashboard Body / Top Rated */}
        {dynamicTopRated.length > 0 && (
          <DashboardBody
            items={dynamicTopRated}
            seeAllLink="/food-explore?sort=rating"
          />
        )}

        {/* 9. Recommended For You */}
        {dynamicRecommended.length > 0 && (
          <RecommendedForYou
            items={dynamicRecommended}
            seeAllLink="/food-explore"
          />
        )}
      </main>

      {/* Footer */}
      <Footer />

      <style jsx>{`
        @media (max-width: 1024px) {
          .home-page-canvas {
            padding: 24px 20px !important;
            gap: 24px !important;
          }
        }
        @media (max-width: 768px) {
          .home-page-canvas {
            padding-bottom: 32px !important;
          }
        }
        @media (max-width: 640px) {
          .home-page-canvas {
            padding: 16px 12px 32px 12px !important;
            gap: 18px !important;
          }
        }
      `}</style>
      <style jsx global>{`
        .hover-lift {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .hover-lift:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1) !important;
        }
      `}</style>
    </div>
  );
}
