"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Star, Check } from "lucide-react";
import Link from "next/link";

interface PlaceCardData {
  id: string;
  name: string;
  rating: number;
  time: string;
  imageUrl: string;
  category: string;
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
  },
  {
    id: "2",
    name: "Spice Biryani",
    rating: 4.7,
    time: "20-30 min",
    imageUrl: "/images/places/place-biryani.png",
    category: "Indian / Mughlai",
  },
  {
    id: "3",
    name: "Baker Delight",
    rating: 4.6,
    time: "15-25 min",
    imageUrl: "/images/places/place-bakery.png",
    category: "Bakery",
  },
  {
    id: "4",
    name: "Spice Biryani",
    rating: 4.7,
    time: "20-30 min",
    imageUrl: "/images/places/place-biryani.png",
    category: "Indian / Mughlai",
  },
  // Row 2
  {
    id: "5",
    name: "Pizza Palace",
    rating: 4.8,
    time: "25-35 min",
    imageUrl: "/images/places/place-pizza.png",
    category: "Italian",
  },
  {
    id: "6",
    name: "Spice Biryani",
    rating: 4.7,
    time: "20-30 min",
    imageUrl: "/images/places/place-biryani.png",
    category: "Indian / Mughlai",
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

  const handleClearAll = () => {
    setSelectedCuisines([]);
    setSelectedDietary([]);
    setPriceTier("$");
  };

  return (
    <section
      style={{
        width: "100%",
        background: "transparent",
        padding: "0",
      }}
      className="properties-wrapper"
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1283px",
          minHeight: "843px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
          gap: "40px",
          boxSizing: "border-box",
        }}
        className="properties-container Properties"
      >
        {/* ================= 1. sidebarFilters (Fixed 260px x 683px) ================= */}
        <aside
          style={{
            width: "260px",
            minWidth: "260px",
            height: "683px",
            borderRadius: "20px",
            border: "1px solid #E2E8F0",
            padding: "24px",
            backgroundColor: "#FFFFFF",
            display: "flex",
            flexDirection: "column",
            gap: "44px",
            boxSizing: "border-box",
            boxShadow: "0 2px 12px rgba(0, 0, 0, 0.02)",
            fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
          }}
          className="sidebar-filters sidebarFilters"
        >
          {/* Header Row: Filters Title + Clear All button */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3
              style={{
                fontSize: "20px",
                fontWeight: "700",
                color: "#0F172A",
                margin: 0,
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
              }}
            >
              Filters
            </h3>
            <button
              type="button"
              onClick={handleClearAll}
              style={{
                color: "#FF6B00",
                fontSize: "14px",
                fontWeight: "600",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px 4px",
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#E65F00";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#FF6B00";
              }}
            >
              Clear All
            </button>
          </div>

          {/* Section 1: Cuisines */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h4
              style={{
                fontSize: "16px",
                fontWeight: "700",
                color: "#0F172A",
                margin: 0,
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
              }}
            >
              Cuisines
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {CUISINES.map((item) => {
                const isChecked = selectedCuisines.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleCuisine(item.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {/* Custom Checkbox */}
                      <div
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "5px",
                          border: isChecked
                            ? "1.5px solid #FF6B00"
                            : "1.5px solid #94A3B8",
                          backgroundColor: isChecked ? "#FF6B00" : "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.15s ease",
                          boxSizing: "border-box",
                        }}
                      >
                        {isChecked && (
                          <Check size={13} color="#FFFFFF" strokeWidth={3} />
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: "14px",
                          color: isChecked ? "#0F172A" : "#475569",
                          fontWeight: isChecked ? "500" : "400",
                          fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                        }}
                      >
                        {item.label}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "14px",
                        color: "#94A3B8",
                        fontWeight: "400",
                        fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                      }}
                    >
                      {item.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Dietary Preferences */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h4
              style={{
                fontSize: "16px",
                fontWeight: "700",
                color: "#0F172A",
                margin: 0,
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
              }}
            >
              Dietary Preferences
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {DIETARY.map((item) => {
                const isChecked = selectedDietary.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleDietary(item.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "5px",
                          border: isChecked
                            ? "1.5px solid #FF6B00"
                            : "1.5px solid #94A3B8",
                          backgroundColor: isChecked ? "#FF6B00" : "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.15s ease",
                          boxSizing: "border-box",
                        }}
                      >
                        {isChecked && (
                          <Check size={13} color="#FFFFFF" strokeWidth={3} />
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: "14px",
                          color: isChecked ? "#0F172A" : "#475569",
                          fontWeight: isChecked ? "500" : "400",
                          fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                        }}
                      >
                        {item.label}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "14px",
                        color: "#94A3B8",
                        fontWeight: "400",
                        fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                      }}
                    >
                      {item.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Price Range */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <h4
              style={{
                fontSize: "16px",
                fontWeight: "700",
                color: "#0F172A",
                margin: 0,
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
              }}
            >
              Price Range
            </h4>
            <div style={{ display: "flex", gap: "10px" }}>
              {["$", "$$", "$$$"].map((tier) => {
                const isSelected = priceTier === tier;
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setPriceTier(tier)}
                    style={{
                      flex: 1,
                      height: "38px",
                      borderRadius: "8px",
                      border: isSelected
                        ? "1.5px solid #FF6B00"
                        : "1px solid #E2E8F0",
                      backgroundColor: isSelected ? "#FFF3EB" : "#FFFFFF",
                      color: isSelected ? "#FF6B00" : "#334155",
                      fontWeight: isSelected ? "700" : "600",
                      fontSize: "14px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                    }}
                  >
                    {tier}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* ================= 2. Properties2 (Right Column: 983px x 843px) ================= */}
        <div
          style={{
            width: "983px",
            flex: "1 1 983px",
            minHeight: "843px",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            boxSizing: "border-box",
            fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
          }}
          className="properties2-column Properties2"
        >
          {/* Header Title: Best Places Nearby */}
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#0F172A",
              margin: 0,
              letterSpacing: "-0.3px",
              fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
            }}
          >
            Best Places Nearby
          </h2>

          {/* PlacesGrid: 4 columns grid with 24px gap, ~250px hug cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: "24px",
              width: "100%",
              boxSizing: "border-box",
            }}
            className="places-grid-layout PlacesGrid"
          >
            {SAMPLE_PLACES.map((place) => (
              <div
                key={place.id}
                style={{
                  width: "100%",
                  height: "250px",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "20px",
                  overflow: "hidden",
                  border: "1px solid #F1F5F9",
                  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
                  display: "flex",
                  flexDirection: "column",
                  cursor: "pointer",
                  transition: "transform 0.25s ease, box-shadow 0.25s ease",
                  boxSizing: "border-box",
                }}
                className="place-card"
              >
                {/* Card Food Image */}
                <div
                  style={{
                    width: "100%",
                    height: "155px",
                    position: "relative",
                    overflow: "hidden",
                    backgroundColor: "#F8FAFC",
                  }}
                >
                  <Image
                    src={place.imageUrl}
                    alt={place.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 250px"
                    style={{
                      objectFit: "cover",
                      transition: "transform 0.3s ease",
                    }}
                    className="place-card-img"
                  />
                </div>

                {/* Card Content Footer */}
                <div
                  style={{
                    padding: "12px 14px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    flex: 1,
                    boxSizing: "border-box",
                  }}
                >
                  {/* Restaurant Name */}
                  <h3
                    style={{
                      fontSize: "15px",
                      fontWeight: "700",
                      color: "#0F172A",
                      margin: 0,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                    }}
                  >
                    {place.name}
                  </h3>

                  {/* Rating & Delivery Time Meta Row */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    {/* Green Star Rating Badge */}
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        backgroundColor: "#E8FBF2",
                        color: "#10B981",
                        border: "1px solid rgba(16, 185, 129, 0.2)",
                        padding: "2px 7px",
                        borderRadius: "6px",
                        fontSize: "12.5px",
                        fontWeight: "700",
                        fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                      }}
                    >
                      <Star size={12} fill="#10B981" color="#10B981" />
                      <span>{place.rating.toFixed(1)}</span>
                    </div>

                    {/* Delivery Time */}
                    <span
                      style={{
                        fontSize: "13px",
                        color: "#64748B",
                        fontWeight: "500",
                        fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                      }}
                    >
                      {place.time}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .place-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08) !important;
        }
        .place-card:hover .place-card-img {
          transform: scale(1.05);
        }
        @media (max-width: 1200px) {
          .properties-container {
            flex-direction: column !important;
            align-items: center !important;
            height: auto !important;
          }
          .sidebarFilters {
            width: 100% !important;
            min-width: 100% !important;
            height: auto !important;
          }
          .Properties2 {
            width: 100% !important;
            height: auto !important;
          }
          .PlacesGrid {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 768px) {
          .PlacesGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 480px) {
          .PlacesGrid {
            grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
          }
        }
      `}</style>
    </section>
  );
}
