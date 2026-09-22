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
import styles from "./page.module.css";
import momentStyles from "@/components/explore-desktop/whats-on-your-mind/WhatsOnYourMind.module.css";
import Link from "next/link";
import Image from "next/image";
import { Star, MapPin } from "lucide-react";

function ExploreDesktopContent() {
  const searchParams = useSearchParams();
  const categoryFilter = searchParams.get("category");
  const searchQuery = searchParams.get("query");
  const { openLocationModal } = useLocation();
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

  // Filtered Food Items if user arrived via search or category filter
  const filteredFoodItems = useMemo(() => {
    if (!categoryFilter && !searchQuery) return null;
    let list = homeData.foodItems;
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
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          f.sellerName.toLowerCase().includes(q)
      );
    }
    return list;
  }, [homeData.foodItems, categoryFilter, searchQuery]);

  return (
    <div className={styles.pageContainer}>
      {/* 1. Desktop & Tablet View (>768px) */}
      <div className={styles.desktopOnly}>
        <Navbar initialActiveItem="Explore" />
        <main className={styles.desktopMain}>
          {/* Out of Service Area Alert Banner */}
          {homeData.activePincode && !homeData.isLoading && homeData.kitchens.length === 0 && (
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
                    No Cloud Kitchens Delivering to PIN {homeData.activePincode}
                  </h3>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748B" }}>
                    We haven&apos;t expanded to this specific pincode yet. Choose a nearby area like Kothrud (411038), Baner (411045), or Aundh (411007).
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

          {/* Active Filter Banner if filtered */}
          {(categoryFilter || searchQuery) && (
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "16px",
                padding: "20px 24px",
                marginBottom: "28px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
                border: "1px solid #FFE6D0",
              }}
            >
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#0F172A", margin: "0 0 4px 0" }}>
                  Results for &quot;{categoryFilter || searchQuery}&quot;
                </h2>
                <p style={{ fontSize: "0.88rem", color: "#64748B", margin: 0 }}>
                  Found {filteredFoodItems ? filteredFoodItems.length : 0} matching items
                </p>
              </div>
              <Link
                href="/explore-desktop"
                style={{
                  fontSize: "0.88rem",
                  fontWeight: "600",
                  color: "#FF6B00",
                  textDecoration: "none",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  backgroundColor: "#FFF3EB",
                }}
              >
                Clear Filter
              </Link>
            </div>
          )}

          {/* Filtered Grid if active */}
          {filteredFoodItems && filteredFoodItems.length > 0 && (
            <section style={{ marginBottom: "48px" }}>
              <h3 style={{ fontSize: "1.4rem", fontWeight: "800", color: "#0F172A", marginBottom: "16px" }}>
                Matching Dishes &amp; Kitchens
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                  gap: "20px",
                }}
              >
                {filteredFoodItems.map((item) => {
                  const isClosed = item.sellerIsOnline === false;
                  return (
                  <Link
                    key={item.id}
                    href={item.sellerTrackingId ? `/shop/${item.sellerTrackingId}` : `/explore-desktop?item=${item.id}`}
                    style={{
                      backgroundColor: isClosed ? "#F8FAFC" : "#FFFFFF",
                      borderRadius: "18px",
                      overflow: "hidden",
                      border: isClosed ? "1px solid #E2E8F0" : "1px solid #F1F5F9",
                      boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
                      textDecoration: "none",
                      color: "inherit",
                      display: "flex",
                      flexDirection: "column",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      opacity: isClosed ? 0.85 : 1,
                    }}
                    className="hover-lift"
                  >
                    <div style={{ position: "relative", width: "100%", height: "160px", backgroundColor: "#F8FAFC" }}>
                      <Image
                        src={item.imageUrl || "/images/places/place-biryani.png"}
                        alt={item.name}
                        fill
                        style={{
                          objectFit: "cover",
                          filter: isClosed ? "grayscale(100%)" : "none",
                        }}
                      />
                      {isClosed && (
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: "rgba(15, 23, 42, 0.4)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 2,
                          }}
                        >
                          <span
                            style={{
                              backgroundColor: "#0F172A",
                              color: "#FFFFFF",
                              fontSize: "11px",
                              fontWeight: "800",
                              letterSpacing: "0.8px",
                              padding: "5px 12px",
                              borderRadius: "14px",
                              textTransform: "uppercase",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                              border: "1px solid rgba(255,255,255,0.2)",
                            }}
                          >
                            🔴 CLOSED
                          </span>
                        </div>
                      )}
                    </div>
                    <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "1rem", fontWeight: "700", color: isClosed ? "#64748B" : "#0F172A" }}>{item.name}</span>
                        <span style={{ fontSize: "0.95rem", fontWeight: "800", color: isClosed ? "#94A3B8" : "#FF6B00" }}>₹{item.price}</span>
                      </div>
                      <span style={{ fontSize: "0.82rem", color: "#64748B" }}>
                        {item.sellerName} {isClosed ? "• (Not accepting orders)" : ""}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            backgroundColor: isClosed ? "#F1F5F9" : "#E8FBF2",
                            color: isClosed ? "#64748B" : "#10B981",
                            padding: "2px 6px",
                            borderRadius: "6px",
                            fontSize: "0.78rem",
                            fontWeight: "700",
                          }}
                        >
                          <Star size={11} fill={isClosed ? "#64748B" : "#10B981"} />
                          <span>{item.rating || 4.8}</span>
                        </div>
                        <span style={{ fontSize: "0.78rem", color: "#94A3B8" }}>• {item.categoryName}</span>
                      </div>
                    </div>
                  </Link>
                  );
                })}
              </div>
            </section>
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

