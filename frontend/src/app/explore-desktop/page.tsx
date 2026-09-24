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

function ExploreDesktopContent() {
  const searchParams = useSearchParams();
  const categoryFilter = searchParams.get("category");
  const searchQuery = searchParams.get("query");
  const { defaultAddress, openLocationModal } = useLocation();
  const homeData = useHomeData();

  // Dynamic Reels from approved kitchens
  const dynamicReels = useMemo(() => {
    if (!homeData.kitchens || homeData.kitchens.length === 0) return undefined;
    return homeData.kitchens.map((k) => ({
      id: k.id,
      name: k.name,
      subtitle: k.category || (k.foodType === "VEG" ? "Pure Veg" : "Cloud Kitchen"),
      image: k.imageUrl || "/images/places/place-biryani.png",
      kitchenId: k.trackingId || k.id,
    }));
  }, [homeData.kitchens]);

  // Dynamic Featured Collections from food items
  const dynamicCollections = useMemo(() => {
    if (!homeData.foodItems || homeData.foodItems.length === 0) return undefined;
    return homeData.foodItems.slice(0, 8).map((f, idx) => ({
      id: f.id,
      author: f.sellerName || "Verified Chef",
      title: `${f.name} ${f.itemType === "VEG" ? "🥦" : "🍗"}`,
      views: `${(10 + idx * 2.4).toFixed(1)}k views`,
      image: f.imageUrl || "/images/places/place-biryani.png",
      kitchenId: f.sellerTrackingId || f.sellerId,
    }));
  }, [homeData.foodItems]);

  // Dynamic Curated Dining Collections (grouped by price/type)
  const dynamicDiningItems = useMemo(() => {
    if (!homeData.foodItems || homeData.foodItems.length === 0) return undefined;
    return homeData.foodItems.slice(0, 8).map((f) => ({
      id: f.id,
      badge: f.price ? `₹${f.price}` : "Popular",
      title: f.name,
      image: f.imageUrl || "/images/places/place-pizza.png",
      kitchenId: f.sellerTrackingId || f.sellerId,
    }));
  }, [homeData.foodItems]);

  // Dynamic Meal Moments from DB Categories
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
    return homeData.categories.slice(0, 8).map((c, idx) => ({
      id: c.id,
      badge: "Category",
      title: c.name,
      icon: c.image || "/images/categories/cat-food.png",
      bgClass: bgClasses[idx % bgClasses.length],
      categoryQuery: c.name,
    }));
  }, [homeData.categories]);

  // Filtered Kitchens if user arrived via search or category filter
  const filteredKitchens = useMemo(() => {
    if (!categoryFilter && !searchQuery) return [];
    let list = homeData.kitchens || [];
    if (categoryFilter) {
      const q = categoryFilter.toLowerCase();
      list = list.filter(
        (k) =>
          k.category?.toLowerCase().includes(q) ||
          k.name.toLowerCase().includes(q)
      );
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (k) =>
          k.name.toLowerCase().includes(q) ||
          k.category?.toLowerCase().includes(q) ||
          k.locality?.toLowerCase().includes(q) ||
          k.city?.toLowerCase().includes(q) ||
          k.pincode?.includes(q)
      );
    }
    return list;
  }, [homeData.kitchens, categoryFilter, searchQuery]);

  // Filtered Food Items if user arrived via search or category filter
  const filteredFoodItems = useMemo(() => {
    if (!categoryFilter && !searchQuery) return [];
    let list = homeData.foodItems || [];
    if (categoryFilter) {
      const q = categoryFilter.toLowerCase();
      list = list.filter(
        (f) =>
          f.categoryName?.toLowerCase().includes(q) ||
          f.name.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q)
      );
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          f.sellerName.toLowerCase().includes(q) ||
          f.categoryName?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [homeData.foodItems, categoryFilter, searchQuery]);

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
        <Navbar initialActiveItem="Explore" />
        <main className={styles.desktopMain}>
          {/* Out of Service Area Alert Banner */}
          {(homeData.activePincode || defaultAddress?.latitude) && !homeData.isLoading && homeData.kitchens.length === 0 && (
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

          {/* 6. What's on Your Mind? (8 Meal Moment Cards) */}
          <WhatsOnYourMind moments={dynamicMoments} />
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

