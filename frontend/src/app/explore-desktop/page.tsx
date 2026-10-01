"use client";

import React, { useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { ExploreHeroBanner } from "@/components/explore-desktop/explore-herobanner";
import { CloudKitchenReels } from "@/components/explore-desktop/cloudkitchen-reels";
import { FeaturedCollections } from "@/components/explore-desktop/featured-collections";
import { CuratedDiningCollections } from "@/components/explore-desktop/curated-dining-collections";
import { WhatsOnYourMind } from "@/components/explore-desktop/whats-on-your-mind";
import { Footer } from "@/components/explore-desktop/footer";
import { ExploreMobileView } from "@/components/explore-desktop/explore-mobile";
import { useHomeData } from "@/lib/useHomeData";
import { useLocation } from "@/components/location-provider";
import { SearchResultsSection } from "@/components/explore-desktop/search-results";
import styles from "./page.module.css";
import momentStyles from "@/components/explore-desktop/whats-on-your-mind/WhatsOnYourMind.module.css";
import Link from "next/link";
import Image from "next/image";
import { Star, MapPin } from "lucide-react";
import {
  isKitchenMatchingDiet,
  isDishMatchingDiet,
  matchesKitchenOrDishSearch,
  matchesKitchenCategoryFilter,
  matchesDishCategory,
  matchesDishSearch,
  matchesSearchQuery,
} from "@/lib/dietary-filter";

function ExploreDesktopContent() {
  const searchParams = useSearchParams();
  const categoryFilter = searchParams.get("category");
  const searchQuery = searchParams.get("query");
  const dietaryParam = searchParams.get("dietary");
  const [selectedDiet, setSelectedDiet] = React.useState<string>(dietaryParam || "all");
  const { defaultAddress, openLocationModal } = useLocation();
  const homeData = useHomeData();

  // Sync with searchParams if dietary changes in URL
  React.useEffect(() => {
    if (dietaryParam) {
      setSelectedDiet(dietaryParam);
    }
  }, [dietaryParam]);

  // Dynamic Reels from Curated Reels (Instagram Sync) or Fallback to approved kitchens
  const dynamicReels = useMemo(() => {
    // 1. If curated reels exist from Reel Manager, prioritize them
    if (homeData.reels && homeData.reels.length > 0) {
      let list = homeData.reels;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        list = list.filter((r) =>
          (r.caption || "").toLowerCase().includes(q) ||
          (r.seller?.name || "").toLowerCase().includes(q) ||
          (r.foodItem?.name || "").toLowerCase().includes(q) ||
          (r.customTitle || "").toLowerCase().includes(q)
        );
      }
      if (selectedDiet && selectedDiet !== "all") {
        list = list.filter((r) => {
          if (!r.foodItem) return true;
          if (selectedDiet === "veg") return r.foodItem.itemType === "VEG";
          if (selectedDiet === "non_veg") return r.foodItem.itemType === "NON_VEG";
          return true;
        });
      }

      return list.map((r) => ({
        id: r.id,
        name: r.customTitle || r.seller?.name || "Neo Cloud Kitchen",
        subtitle: r.customSubtitle || (r.foodItem ? `${r.foodItem.name} • ₹${r.foodItem.price}` : r.seller?.locality || "Fresh Kitchen Creation"),
        image: r.thumbnailUrl || r.mediaUrl || "/images/places/place-biryani.png",
        videoUrl: r.mediaUrl,
        caption: r.caption,
        likes: r.likeCount ? `${(r.likeCount / 1000).toFixed(1)}k` : undefined,
        kitchenId: r.seller?.trackingId || r.seller?.id,
        dishId: r.foodItem?.id,
        dishName: r.foodItem?.name,
        dishPrice: r.foodItem?.price,
        redirectType: r.redirectType,
        customRedirectUrl: r.customRedirectUrl || undefined,
      }));
    }

    // 2. Fallback to approved kitchens if no curated reels yet
    const sourceKitchens = searchQuery ? homeData.allKitchens : homeData.kitchens;
    const sourceFoodItems = searchQuery ? homeData.allFoodItems : homeData.foodItems;
    if (!sourceKitchens || sourceKitchens.length === 0) return undefined;
    let list = sourceKitchens;
    if (searchQuery) {
      list = list.filter((k) => matchesKitchenOrDishSearch(searchQuery, k, sourceFoodItems));
    }
    if (selectedDiet && selectedDiet !== "all") {
      list = list.filter((k) => isKitchenMatchingDiet(k, selectedDiet, sourceFoodItems));
    }
    return list.map((k) => ({
      id: k.id,
      name: k.name,
      subtitle: k.category || (k.foodType === "VEG" ? "Pure Veg" : "Cloud Kitchen"),
      image: k.imageUrl || "/images/places/place-biryani.png",
      kitchenId: k.trackingId || k.id,
    }));
  }, [homeData.reels, homeData.kitchens, homeData.allKitchens, homeData.foodItems, homeData.allFoodItems, selectedDiet, searchQuery]);

  // Dynamic Featured Collections from food items
  const dynamicCollections = useMemo(() => {
    const sourceFoodItems = searchQuery ? homeData.allFoodItems : homeData.foodItems;
    if (!sourceFoodItems || sourceFoodItems.length === 0) return undefined;
    let list = sourceFoodItems;
    if (selectedDiet && selectedDiet !== "all") {
      list = list.filter((f) => isDishMatchingDiet(f, selectedDiet));
    }
    return list.slice(0, 8).map((f, idx) => ({
      id: f.id,
      author: f.sellerName || "Verified Chef",
      title: `${f.name} ${f.itemType === "VEG" ? "🥦" : "🍗"}`,
      views: `${(10 + idx * 2.4).toFixed(1)}k views`,
      image: f.imageUrl || "/images/places/place-biryani.png",
      kitchenId: f.sellerTrackingId || f.sellerId,
    }));
  }, [homeData.foodItems, homeData.allFoodItems, selectedDiet, searchQuery]);

  // Dynamic Curated Dining Collections (grouped by price/type)
  const dynamicDiningItems = useMemo(() => {
    const sourceFoodItems = searchQuery ? homeData.allFoodItems : homeData.foodItems;
    if (!sourceFoodItems || sourceFoodItems.length === 0) return undefined;
    let list = sourceFoodItems;
    if (selectedDiet && selectedDiet !== "all") {
      list = list.filter((f) => isDishMatchingDiet(f, selectedDiet));
    }
    return list.slice(0, 8).map((f) => ({
      id: f.id,
      badge: f.price ? `₹${f.price}` : "Popular",
      title: f.name,
      image: f.imageUrl || "/images/places/place-pizza.png",
      kitchenId: f.sellerTrackingId || f.sellerId,
    }));
  }, [homeData.foodItems, homeData.allFoodItems, selectedDiet, searchQuery]);

  // Dynamic Meal Moments from DB Categories (Deduplicated)
  const dynamicMoments = useMemo(() => {
    if (!homeData.categories || homeData.categories.length === 0) return undefined;
    const bgClasses = [
      momentStyles.bgBreakfast,
      momentStyles.bgLunch,
      momentStyles.bgDinner,
      momentStyles.bgSnacks,
      momentStyles.bgLateNight,
      momentStyles.bgDrinks,
      momentStyles.bgDesserts,
      momentStyles.bgHealthy,
    ];
    // Filter out non-food categories like rooms and deduplicate
    const seen = new Set<string>();
    const foodCategories: typeof homeData.categories = [];
    for (const c of homeData.categories) {
      const lower = c.name.toLowerCase().trim();
      if (c.id === "rooms" || lower === "rooms") continue;
      if (!seen.has(lower)) {
        seen.add(lower);
        foodCategories.push(c);
      }
    }
    const BADGES = ["Popular", "Special", "Trending", "Cravings", "Quick Bite", "Chef's Pick", "Fresh", "Classic"];
    return foodCategories.map((c, idx) => ({
      id: c.id,
      badge: BADGES[idx % BADGES.length],
      title: c.name,
      icon: c.image || "/images/categories/cat-food.png",
      bgClass: bgClasses[idx % bgClasses.length],
      categoryQuery: c.name,
    }));
  }, [homeData.categories]);

  // Filtered Kitchens if user arrived via search or category filter
  const filteredKitchens = useMemo(() => {
    if (!categoryFilter && !searchQuery) return [];
    const sourceKitchens = searchQuery || categoryFilter ? homeData.allKitchens : homeData.kitchens;
    const sourceFoodItems = searchQuery || categoryFilter ? homeData.allFoodItems : homeData.foodItems;
    let list = sourceKitchens || [];
    if (categoryFilter) {
      list = list.filter((k) => matchesKitchenCategoryFilter(categoryFilter, k, sourceFoodItems));
    }
    if (searchQuery) {
      list = list.filter((k) => matchesKitchenOrDishSearch(searchQuery, k, sourceFoodItems));
    }
    if (selectedDiet && selectedDiet !== "all") {
      list = list.filter((k) => isKitchenMatchingDiet(k, selectedDiet, sourceFoodItems));
    }
    return list;
  }, [homeData.kitchens, homeData.allKitchens, homeData.foodItems, homeData.allFoodItems, categoryFilter, searchQuery, selectedDiet]);

  // Filtered Food Items if user arrived via search, dietary, or category filter
  const filteredFoodItems = useMemo(() => {
    if (!categoryFilter && !searchQuery && selectedDiet === "all") return [];
    const sourceFoodItems = searchQuery || categoryFilter ? homeData.allFoodItems : homeData.foodItems;
    let list = sourceFoodItems || [];
    if (categoryFilter) {
      list = list.filter((f) => matchesDishCategory(categoryFilter, f));
    }
    if (searchQuery) {
      list = list.filter((f) => matchesDishSearch(searchQuery, f));
    }
    if (selectedDiet && selectedDiet !== "all") {
      list = list.filter((f) => isDishMatchingDiet(f, selectedDiet));
    }
    return list;
  }, [homeData.foodItems, homeData.allFoodItems, categoryFilter, searchQuery, selectedDiet]);

  // Filtered Rooms if user arrived via search or category filter
  const filteredRooms = useMemo(() => {
    if (!categoryFilter && !searchQuery) return [];
    let list = homeData.rooms || [];
    if (categoryFilter) {
      const q = categoryFilter.toLowerCase();
      if (q === "rooms" || q === "room") return list;
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.sellerLocality?.toLowerCase().includes(q) ||
          r.sellerCity?.toLowerCase().includes(q)
      );
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.sellerName.toLowerCase().includes(q) ||
          r.sellerLocality?.toLowerCase().includes(q) ||
          r.sellerCity?.toLowerCase().includes(q) ||
          r.sellerPincode?.includes(q)
      );
    }
    return list;
  }, [homeData.rooms, categoryFilter, searchQuery]);

  return (
    <div className={styles.pageContainer}>
      {/* 1. Desktop & Tablet View (>768px) */}
      <div className={styles.desktopOnly}>
        <Navbar
          initialActiveItem="Explore"
          selectedDiet={selectedDiet}
          onDietChange={(diet) => setSelectedDiet(diet)}
        />
        <main className={styles.desktopMain}>
          {/* Out of Service Area Alert Banner (only shown when browsing by location, not when searching by name) */}
          {!searchQuery && !categoryFilter && (homeData.activePincode || defaultAddress?.latitude) && !homeData.isLoading && homeData.kitchens.length === 0 && (
            <div
              style={{
                width: "100%",
                backgroundColor: "#FFF8F2",
                border: "1.5px solid #FED7AA",
                borderRadius: "18px",
                padding: "18px 24px",
                marginBottom: "24px",
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
                    No Cloud Kitchens Delivering Within 5 km
                  </h3>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748B" }}>
                    We only show outlets within a 5 km radius of your location to ensure fast &amp; fresh delivery. Choose a nearby area like Kothrud (411038), Baner (411045), or Deccan (411004).
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

          {/* Search Results Section if Search or Category filter is active */}
          {(Boolean(categoryFilter) || Boolean(searchQuery)) && (
            <SearchResultsSection
              searchQuery={searchQuery || ""}
              categoryFilter={categoryFilter || ""}
              kitchens={filteredKitchens}
              foodItems={filteredFoodItems}
              rooms={filteredRooms}
              isLoading={homeData.isLoading}
            />
          )}

          {/* 2. Explore Hero Banner */}
          <ExploreHeroBanner />

          {/* 3. Cloud Kitchen Reels */}
          <CloudKitchenReels reels={dynamicReels} />

          {/* 4. Featured Collections (Video Recipes / Streams) */}
          <FeaturedCollections collections={dynamicCollections} />

          {/* 5. Curated Dining Collections (8 Category Cards with Badges) */}
          <CuratedDiningCollections items={dynamicDiningItems} />

          {/* 6. What's on Your Mind? (Meal Moment Category Cards) */}
          <WhatsOnYourMind
            moments={dynamicMoments}
            activeCategory={categoryFilter || ""}
          />
        </main>
        <Footer />
      </div>

      {/* 2. Mobile View (<=768px) matching exact mobile design */}
      <div className={styles.mobileOnly}>
        <ExploreMobileView />
        <Footer />
      </div>
    </div>
  );
}

export default function ExploreDesktopPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", backgroundColor: "#FFF4E6", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "1.1rem", fontWeight: "600", color: "#FF6B00" }}>Loading Explore...</span>
        </div>
      }
    >
      <ExploreDesktopContent />
    </Suspense>
  );
}

