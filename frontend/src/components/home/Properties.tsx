"use client";

import React, { useState } from "react";
import { Star, Check } from "lucide-react";
import Link from "next/link";
import styles from "./Properties.module.css";

interface PlaceCardData {
  id: string;
  name: string;
  rating: number;
  time: string;
  imageUrl: string;
  category: string;
  kitchenId?: string;
}

const SAMPLE_PLACES: PlaceCardData[] = [
  // Row 1
  {
    id: "1",
    name: "Pizza Palace",
    rating: 4.8,
    time: "25-35 min",
    imageUrl: "/images/places/place-pizza.png",
    category: "Italian",
    kitchenId: "pizza-palace",
  },
  {
    id: "2",
    name: "Spice Biryani",
    rating: 4.7,
    time: "20-30 min",
    imageUrl: "/images/places/place-biryani.png",
    category: "Indian / Mughlai",
    kitchenId: "spice-biryani",
  },
  {
    id: "3",
    name: "Sushi Hub",
    rating: 4.9,
    time: "30-40 min",
    imageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&auto=format&fit=crop&q=80",
    category: "Japanese",
    kitchenId: "sushi-hub",
  },
  {
    id: "4",
    name: "Baker Delight",
    rating: 4.6,
    time: "15-25 min",
    imageUrl: "/images/places/place-bakery.png",
    category: "Bakery",
    kitchenId: "baker-delight",
  },
  // Row 2
  {
    id: "5",
    name: "Pizza Palace",
    rating: 4.8,
    time: "25-35 min",
    imageUrl: "/images/places/place-pizza.png",
    category: "Italian",
    kitchenId: "pizza-palace",
  },
  {
    id: "6",
    name: "Spice Biryani",
    rating: 4.7,
    time: "20-30 min",
    imageUrl: "/images/places/place-biryani.png",
    category: "Indian / Mughlai",
    kitchenId: "spice-biryani",
  },
  {
    id: "7",
    name: "Baker Delight",
    rating: 4.6,
    time: "15-25 min",
    imageUrl: "/images/places/place-bakery.png",
    category: "Bakery",
  },
  {
    id: "8",
    name: "Spice Biryani",
    rating: 4.7,
    time: "20-30 min",
    imageUrl: "/images/places/place-biryani.png",
    category: "Indian / Mughlai",
  },
  // Row 3
  {
    id: "9",
    name: "Pizza Palace",
    rating: 4.8,
    time: "25-35 min",
    imageUrl: "/images/places/place-pizza.png",
    category: "Italian",
  },
  {
    id: "10",
    name: "Spice Biryani",
    rating: 4.7,
    time: "20-30 min",
    imageUrl: "/images/places/place-biryani.png",
    category: "Indian / Mughlai",
  },
  {
    id: "11",
    name: "Baker Delight",
    rating: 4.6,
    time: "15-25 min",
    imageUrl: "/images/places/place-bakery.png",
    category: "Bakery",
  },
  {
    id: "12",
    name: "Spice Biryani",
    rating: 4.7,
    time: "20-30 min",
    imageUrl: "/images/places/place-biryani.png",
    category: "Indian / Mughlai",
  },
];

const CUISINES = [
  { id: "italian", label: "Italian", count: 12, defaultChecked: true },
  { id: "american", label: "American", count: 18, defaultChecked: true },
  { id: "healthy", label: "Healthy / Bowls", count: 8, defaultChecked: true },
  { id: "japanese", label: "Japanese", count: 6, defaultChecked: false },
  { id: "indian", label: "Indian / Mughlai", count: 24, defaultChecked: false },
  { id: "mexican", label: "Mexican", count: 10, defaultChecked: false },
];

const DIETARY = [
  { id: "veg", label: "Vegetarian", count: 15, defaultChecked: false },
  { id: "vegan", label: "Vegan", count: 4, defaultChecked: false },
  { id: "gluten-free", label: "Gluten-Free", count: 6, defaultChecked: false },
  { id: "halal", label: "Halal Certified", count: 11, defaultChecked: false },
];

export default function Properties() {
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([
    "italian",
    "american",
    "healthy",
  ]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [priceTier, setPriceTier] = useState<string>("$");

  const toggleCuisine = (id: string) => {
    setSelectedCuisines((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleDietary = (id: string) => {
    setSelectedDietary((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleClearAll = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedCuisines([]);
    setSelectedDietary([]);
    setPriceTier("$");
  };

  return (
    <section className={styles.propertiesWrapper}>
      <div className={styles.propertiesContainer}>
        {/* ================= 1. Sidebar Filters (Desktop only) ================= */}
        <aside className={styles.sidebarFilters}>
          {/* Header Row: Filters Title + Clear All button */}
          <div className={styles.filterHeaderRow}>
            <h3 className={styles.filterHeaderTitle}>Filters</h3>

            <button
              type="button"
              onClick={handleClearAll}
              className={styles.clearAllBtn}
            >
              Clear All
            </button>
          </div>

          {/* Sidebar Sections */}
          <div className={styles.filterSections}>
            {/* Section 1: Cuisines */}
            <div className={styles.filterSection}>
              <h4 className={styles.filterSectionTitle}>Cuisines</h4>
              <div className={styles.filterItemList}>
                {CUISINES.map((item) => {
                  const isChecked = selectedCuisines.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleCuisine(item.id)}
                      className={styles.filterItemRow}
                    >
                      <div className={styles.filterItemLeft}>
                        <div
                          className={`${styles.checkboxBox} ${
                            isChecked
                              ? styles.checkboxChecked
                              : styles.checkboxUnchecked
                          }`}
                        >
                          {isChecked && (
                            <Check size={13} color="#FFFFFF" strokeWidth={3} />
                          )}
                        </div>
                        <span
                          className={`${styles.filterItemLabel} ${
                            isChecked
                              ? styles.filterItemLabelChecked
                              : styles.filterItemLabelUnchecked
                          }`}
                        >
                          {item.label}
                        </span>
                      </div>
                      <span className={styles.filterItemCount}>
                        {item.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Dietary Preferences */}
            <div className={styles.filterSection}>
              <h4 className={styles.filterSectionTitle}>Dietary Preferences</h4>
              <div className={styles.filterItemList}>
                {DIETARY.map((item) => {
                  const isChecked = selectedDietary.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleDietary(item.id)}
                      className={styles.filterItemRow}
                    >
                      <div className={styles.filterItemLeft}>
                        <div
                          className={`${styles.checkboxBox} ${
                            isChecked
                              ? styles.checkboxChecked
                              : styles.checkboxUnchecked
                          }`}
                        >
                          {isChecked && (
                            <Check size={13} color="#FFFFFF" strokeWidth={3} />
                          )}
                        </div>
                        <span
                          className={`${styles.filterItemLabel} ${
                            isChecked
                              ? styles.filterItemLabelChecked
                              : styles.filterItemLabelUnchecked
                          }`}
                        >
                          {item.label}
                        </span>
                      </div>
                      <span className={styles.filterItemCount}>
                        {item.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Price Range */}
            <div className={styles.filterSection}>
              <h4 className={styles.filterSectionTitle}>Price Range</h4>
              <div className={styles.priceButtonGroup}>
                {["$", "$$", "$$$"].map((tier) => {
                  const isSelected = priceTier === tier;
                  return (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setPriceTier(tier)}
                      className={`${styles.priceTierBtn} ${
                        isSelected
                          ? styles.priceTierSelected
                          : styles.priceTierUnselected
                      }`}
                    >
                      {tier}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* ================= 2. Properties Right Column ================= */}
        <div className={styles.propertiesRight}>
          {/* Header Row: Title ("Best Places Nearby") + See All Link */}
          <div className={styles.headerRow}>
            <h2 className={styles.sectionTitle}>Best Places Nearby</h2>
            <Link href="/explore-desktop" className={styles.seeAllLink}>
              See All
            </Link>
          </div>

          {/* ================= Places Grid (3 columns desktop, side-running on mobile) ================= */}
          <div className={styles.placesGrid}>
            {SAMPLE_PLACES.map((place) => (
              <Link
                key={place.id}
                href={
                  place.kitchenId
                    ? `/restaurant/${place.kitchenId}`
                    : `/explore-desktop?category=${encodeURIComponent(
                        place.category
                      )}`
                }
                className={styles.placeCard}
              >
                {/* Image Container */}
                <div className={styles.placeImgWrapper}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={place.imageUrl}
                    alt={place.name}
                    className={styles.placeCardImg}
                  />

                  {/* Dark Gradient Overlay */}
                  <div className={styles.darkGradientOverlay} />

                  {/* Text Overlay at Bottom */}
                  <div className={styles.placeCardInfo}>
                    <h3 className={styles.placeTitle}>{place.name}</h3>

                    <div className={styles.placeMetaRow}>
                      <Star size={13} fill="#FBBF24" color="#FBBF24" />
                      <span className={styles.placeMetaText}>
                        {place.rating.toFixed(1)} • {place.time}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
