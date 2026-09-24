"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Star,
  MapPin,
  Clock,
  Utensils,
  Store,
  BedDouble,
  Search,
  X,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { DynamicFoodItem, DynamicKitchen, DynamicRoom } from "@/lib/useHomeData";
import styles from "./SearchResultsSection.module.css";

export interface SearchResultsSectionProps {
  searchQuery?: string;
  categoryFilter?: string;
  kitchens: DynamicKitchen[];
  foodItems: DynamicFoodItem[];
  rooms: DynamicRoom[];
  onClearSearch?: () => void;
  onTagClick?: (tag: string) => void;
}

const POPULAR_SEARCH_TAGS = [
  "Biryani",
  "Pizza",
  "North Indian",
  "Pure Veg",
  "Thali",
  "Burger",
  "Rooms in Pune",
  "Hostel",
  "Chinese",
  "Dessert",
];

export const SearchResultsSection: React.FC<SearchResultsSectionProps> = ({
  searchQuery = "",
  categoryFilter = "",
  kitchens = [],
  foodItems = [],
  rooms = [],
  onClearSearch,
  onTagClick,
}) => {
  const [activeTab, setActiveTab] = useState<"all" | "restaurants" | "dishes" | "rooms">("all");

  const totalResults = kitchens.length + foodItems.length + rooms.length;
  const currentQuery = searchQuery || categoryFilter;

  const showRestaurants = (activeTab === "all" || activeTab === "restaurants") && kitchens.length > 0;
  const showDishes = (activeTab === "all" || activeTab === "dishes") && foodItems.length > 0;
  const showRooms = (activeTab === "all" || activeTab === "rooms") && rooms.length > 0;

  return (
    <div className={styles.searchSectionWrapper}>
      {/* 1. Header Banner */}
      <div className={styles.headerBanner}>
        <div className={styles.headerLeft}>
          <div className={styles.badgeRow}>
            <span className={styles.searchBadge}>
              <Search size={13} />
              <span>Search Results</span>
            </span>
            <span className={styles.countBadge}>
              {totalResults} {totalResults === 1 ? "result" : "results"} found
            </span>
          </div>
          <h2 className={styles.queryTitle}>
            Results for &ldquo;{currentQuery}&rdquo;
          </h2>
          <p className={styles.querySubtitle}>
            Showing matching cloud kitchens, authentic dishes, and verified rooms.
          </p>
        </div>

        {onClearSearch ? (
          <button
            type="button"
            onClick={onClearSearch}
            className={styles.clearBtn}
            aria-label="Clear current search"
          >
            <X size={15} />
            <span>Clear Search</span>
          </button>
        ) : (
          <Link href="/explore-desktop" className={styles.clearBtn}>
            <X size={15} />
            <span>Clear Filter</span>
          </Link>
        )}
      </div>

      {/* 2. Category Filter Tabs */}
      {totalResults > 0 && (
        <div className={styles.tabsRow}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === "all" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("all")}
          >
            <span>All</span>
            <span className={styles.tabBadge}>{totalResults}</span>
          </button>

          {kitchens.length > 0 && (
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === "restaurants" ? styles.tabBtnActive : ""}`}
              onClick={() => setActiveTab("restaurants")}
            >
              <Store size={15} />
              <span>Restaurants</span>
              <span className={styles.tabBadge}>{kitchens.length}</span>
            </button>
          )}

          {foodItems.length > 0 && (
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === "dishes" ? styles.tabBtnActive : ""}`}
              onClick={() => setActiveTab("dishes")}
            >
              <Utensils size={15} />
              <span>Dishes</span>
              <span className={styles.tabBadge}>{foodItems.length}</span>
            </button>
          )}

          {rooms.length > 0 && (
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === "rooms" ? styles.tabBtnActive : ""}`}
              onClick={() => setActiveTab("rooms")}
            >
              <BedDouble size={15} />
              <span>Hotels &amp; Rooms</span>
              <span className={styles.tabBadge}>{rooms.length}</span>
            </button>
          )}
        </div>
      )}

      {/* 3. Empty State if No Results */}
      {totalResults === 0 && (
        <div className={styles.emptyStateCard}>
          <div className={styles.emptyIconCircle}>
            <Search size={32} color="#FF6B00" />
          </div>
          <h3 className={styles.emptyTitle}>No matching results found for &ldquo;{currentQuery}&rdquo;</h3>
          <p className={styles.emptyDesc}>
            We couldn&apos;t find any kitchens, dishes, or rooms matching your query. Try checking your spelling or search for something else.
          </p>

          <div className={styles.popularTagsWrapper}>
            <span className={styles.popularLabel}>
              <Sparkles size={14} color="#FF6B00" />
              <span>Popular Searches:</span>
            </span>
            <div className={styles.tagsList}>
              {POPULAR_SEARCH_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={styles.popularTagBtn}
                  onClick={() => {
                    if (onTagClick) {
                      onTagClick(tag);
                    } else if (typeof window !== "undefined") {
                      window.location.href = `/explore-desktop?query=${encodeURIComponent(tag)}`;
                    }
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {onClearSearch && (
            <button type="button" onClick={onClearSearch} className={styles.resetSearchBtn}>
              Explore All Items
            </button>
          )}
        </div>
      )}

      {/* 4. Section: Matching Restaurants / Cloud Kitchens */}
      {showRestaurants && (
        <section className={styles.resultSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <Store size={20} color="#FF6B00" />
              <h3 className={styles.sectionTitle}>
                Matching Restaurants &amp; Cloud Kitchens ({kitchens.length})
              </h3>
            </div>
          </div>

          <div className={styles.kitchensGrid}>
            {kitchens.map((kitchen) => {
              const isClosed = kitchen.isOnline === false;
              const linkHref = kitchen.trackingId ? `/shop/${kitchen.trackingId}` : `/restaurant/${kitchen.id}`;

              return (
                <Link
                  key={kitchen.id}
                  href={linkHref}
                  className={`${styles.kitchenCard} ${isClosed ? styles.cardClosed : ""}`}
                >
                  <div className={styles.kitchenImageWrapper}>
                    <Image
                      src={kitchen.imageUrl || "/images/places/place-pizza.png"}
                      alt={kitchen.name}
                      fill
                      className={styles.cardImg}
                      style={{ filter: isClosed ? "grayscale(100%)" : "none" }}
                    />
                    {isClosed ? (
                      <div className={styles.closedOverlay}>
                        <span className={styles.closedBadge}>🔴 CLOSED</span>
                      </div>
                    ) : (
                      <div className={styles.openOverlay}>
                        <span className={styles.openBadge}>🟢 OPEN</span>
                      </div>
                    )}
                  </div>

                  <div className={styles.kitchenBody}>
                    <div className={styles.titleRow}>
                      <h4 className={styles.kitchenName}>{kitchen.name}</h4>
                      <div className={styles.ratingBadge}>
                        <Star size={12} fill="#FFFFFF" color="#FFFFFF" />
                        <span>{kitchen.rating || 4.8}</span>
                      </div>
                    </div>

                    <span className={styles.kitchenCategory}>
                      {kitchen.category || (kitchen.foodType === "VEG" ? "Pure Veg" : "Cloud Kitchen")}
                    </span>

                    <div className={styles.metaRow}>
                      {(kitchen.locality || kitchen.city) && (
                        <div className={styles.metaItem}>
                          <MapPin size={13} color="#64748B" />
                          <span>
                            {kitchen.locality ? `${kitchen.locality}, ` : ""}
                            {kitchen.city || ""}
                          </span>
                        </div>
                      )}

                      {kitchen.distanceText && (
                        <div className={styles.metaItem}>
                          <Clock size={13} color="#FF6B00" />
                          <span className={styles.distHighlight}>{kitchen.distanceText}</span>
                        </div>
                      )}
                    </div>

                    <div className={styles.cardFooterAction}>
                      <span>View Kitchen &amp; Menu</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. Section: Matching Dishes / Food Items */}
      {showDishes && (
        <section className={styles.resultSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <Utensils size={20} color="#FF6B00" />
              <h3 className={styles.sectionTitle}>
                Matching Dishes &amp; Food Items ({foodItems.length})
              </h3>
            </div>
          </div>

          <div className={styles.dishesGrid}>
            {foodItems.map((item) => {
              const isSellerClosed = item.sellerIsOnline === false;
              const isItemUnavailable = item.isAvailable === false;
              const isClosed = isSellerClosed || isItemUnavailable;
              const linkHref = item.sellerTrackingId ? `/shop/${item.sellerTrackingId}` : `/restaurant/${item.sellerId}`;

              return (
                <Link
                  key={item.id}
                  href={linkHref}
                  className={`${styles.dishCard} ${isClosed ? styles.cardClosed : ""}`}
                >
                  <div className={styles.dishImageWrapper}>
                    <Image
                      src={item.imageUrl || "/images/places/place-biryani.png"}
                      alt={item.name}
                      fill
                      className={styles.cardImg}
                      style={{ filter: isClosed ? "grayscale(100%)" : "none" }}
                    />
                    {isClosed && (
                      <div className={styles.closedOverlay}>
                        <span className={styles.closedBadge}>
                          {isSellerClosed ? "🔴 CLOSED" : "🔴 UNAVAILABLE"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className={styles.dishBody}>
                    <div className={styles.dishTopRow}>
                      <div className={styles.dishNameGroup}>
                        <span
                          className={`${styles.vegSymbol} ${
                            item.itemType === "NON_VEG" ? styles.nonVeg : styles.veg
                          }`}
                          title={item.itemType === "NON_VEG" ? "Non-Veg" : "Veg"}
                        />
                        <h4 className={styles.dishName}>{item.name}</h4>
                      </div>
                      <span className={styles.dishPrice}>₹{item.price}</span>
                    </div>

                    <p className={styles.sellerNameText}>
                      By {item.sellerName || "Verified Cloud Kitchen"}
                    </p>

                    <div className={styles.dishMeta}>
                      <div className={styles.ratingBadgeSm}>
                        <Star size={11} fill="#10B981" color="#10B981" />
                        <span>{item.rating || 4.8}</span>
                      </div>
                      {item.distanceText && (
                        <div className={styles.distanceBadge}>
                          <MapPin size={11} />
                          <span>{item.distanceText}</span>
                        </div>
                      )}
                      {item.categoryName && (
                        <span className={styles.categoryTag}>• {item.categoryName}</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 6. Section: Matching Hotels, Rooms & Coliving Stays */}
      {showRooms && (
        <section className={styles.resultSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <BedDouble size={20} color="#FF6B00" />
              <h3 className={styles.sectionTitle}>
                Matching Hotels &amp; Rooms ({rooms.length})
              </h3>
            </div>
          </div>

          <div className={styles.roomsGrid}>
            {rooms.map((room) => {
              const linkHref = `/room-booking/${room.id}`;
              const roomImage = room.images?.[0] || "/images/categories/cat-rooms.png";

              return (
                <Link
                  key={room.id}
                  href={linkHref}
                  className={styles.roomCard}
                >
                  <div className={styles.roomImageWrapper}>
                    <Image
                      src={roomImage}
                      alt={room.title}
                      fill
                      className={styles.cardImg}
                    />
                    <div className={styles.roomCapacityBadge}>
                      <span>{room.capacity || 1} Sharing</span>
                    </div>
                  </div>

                  <div className={styles.roomBody}>
                    <div className={styles.titleRow}>
                      <h4 className={styles.roomTitle}>{room.title}</h4>
                      <span className={styles.roomPrice}>₹{room.price}</span>
                    </div>

                    <p className={styles.roomSellerName}>
                      {room.sellerName || "Verified Property"}
                    </p>

                    <div className={styles.metaRow}>
                      {(room.sellerLocality || room.sellerCity) && (
                        <div className={styles.metaItem}>
                          <MapPin size={13} color="#64748B" />
                          <span>
                            {room.sellerLocality ? `${room.sellerLocality}, ` : ""}
                            {room.sellerCity || ""}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className={styles.cardFooterAction}>
                      <span>View Stay Details</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default SearchResultsSection;
