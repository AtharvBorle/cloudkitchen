"use client";

import React, { useState } from "react";
import { Star, Check } from "lucide-react";
import Link from "next/link";

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
  {
    id: "1",
    name: "Pizza Palace",
    rating: 4.8,
    time: "25-35 min",
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80",
    category: "Italian",
    kitchenId: "pizza-palace",
  },
  {
    id: "2",
    name: "Spice Biryani",
    rating: 4.7,
    time: "20-30 min",
    imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80",
    category: "Indian / Mughlai",
    kitchenId: "spice-biryani",
  },
  {
    id: "3",
    name: "Baker Delight",
    rating: 4.6,
    time: "15-25 min",
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80",
    category: "Bakery",
    kitchenId: "baker-delight",
  },
  {
    id: "4",
    name: "Spice Biryani",
    rating: 4.7,
    time: "20-30 min",
    imageUrl: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80",
    category: "Indian / Mughlai",
    kitchenId: "spice-biryani",
  },
  {
    id: "5",
    name: "Pizza Palace",
    rating: 4.8,
    time: "25-35 min",
    imageUrl: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=500&auto=format&fit=crop&q=80",
    category: "Italian",
    kitchenId: "pizza-palace",
  },
  {
    id: "6",
    name: "Spice Biryani",
    rating: 4.7,
    time: "20-30 min",
    imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80",
    category: "Indian / Mughlai",
    kitchenId: "spice-biryani",
  },
  {
    id: "7",
    name: "Baker Delight",
    rating: 4.6,
    time: "15-25 min",
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80",
    category: "Bakery",
  },
  {
    id: "8",
    name: "Spice Biryani",
    rating: 4.7,
    time: "20-30 min",
    imageUrl: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80",
    category: "Indian / Mughlai",
  },
  {
    id: "9",
    name: "Pizza Palace",
    rating: 4.8,
    time: "25-35 min",
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80",
    category: "Italian",
  },
  {
    id: "10",
    name: "Spice Biryani",
    rating: 4.7,
    time: "20-30 min",
    imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80",
    category: "Indian / Mughlai",
  },
  {
    id: "11",
    name: "Baker Delight",
    rating: 4.6,
    time: "15-25 min",
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80",
    category: "Bakery",
  },
  {
    id: "12",
    name: "Spice Biryani",
    rating: 4.7,
    time: "20-30 min",
    imageUrl: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80",
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
    >
      <div
        style={{
          maxWidth: "1280px",
          width: "100%",
          minHeight: "843px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
          gap: "40px",
          boxSizing: "border-box",
        }}
        className="properties-main-layout"
      >
        {/* ================= 1. SidebarFilters (Left Column) ================= */}
        <aside
          style={{
            width: "260px",
            minWidth: "260px",
            minHeight: "683px",
            borderRadius: "20px",
            border: "1px solid #E2E8F0",
            padding: "24px",
            backgroundColor: "#FFFFFF",
            display: "flex",
            flexDirection: "column",
            gap: "36px",
            boxSizing: "border-box",
            boxShadow: "0 2px 12px rgba(0, 0, 0, 0.02)",
          }}
          className="sidebar-filters"
        >
          {/* Header: Title + Clear All */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3
              style={{
                fontSize: "1.15rem",
                fontWeight: "700",
                color: "#18181B",
                margin: 0,
              }}
            >
              Filters
            </h3>
            <button
              type="button"
              onClick={handleClearAll}
              style={{
                color: "#FF5500",
                fontSize: "0.85rem",
                fontWeight: "600",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px 4px",
              }}
            >
              Clear All
            </button>
          </div>

          {/* Section: Cuisines */}
          <div>
            <h4
              style={{
                fontSize: "0.95rem",
                fontWeight: "700",
                color: "#18181B",
                marginBottom: "16px",
              }}
            >
              Cuisines
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
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
                      {/* Checkbox box */}
                      <div
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "4px",
                          border: isChecked
                            ? "1.5px solid #FF5500"
                            : "1.5px solid #CBD5E1",
                          backgroundColor: isChecked ? "#FF5500" : "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {isChecked && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                      </div>
                      <span
                        style={{
                          fontSize: "0.9rem",
                          color: "#334155",
                          fontWeight: isChecked ? "600" : "400",
                        }}
                      >
                        {item.label}
                      </span>
                    </div>
                    <span style={{ fontSize: "0.85rem", color: "#94A3B8" }}>
                      {item.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Dietary Preferences */}
          <div>
            <h4
              style={{
                fontSize: "0.95rem",
                fontWeight: "700",
                color: "#18181B",
                marginBottom: "16px",
              }}
            >
              Dietary Preferences
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
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
                          borderRadius: "4px",
                          border: isChecked
                            ? "1.5px solid #FF5500"
                            : "1.5px solid #CBD5E1",
                          backgroundColor: isChecked ? "#FF5500" : "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {isChecked && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                      </div>
                      <span
                        style={{
                          fontSize: "0.9rem",
                          color: "#334155",
                          fontWeight: isChecked ? "600" : "400",
                        }}
                      >
                        {item.label}
                      </span>
                    </div>
                    <span style={{ fontSize: "0.85rem", color: "#94A3B8" }}>
                      {item.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Price Range */}
          <div>
            <h4
              style={{
                fontSize: "0.95rem",
                fontWeight: "700",
                color: "#18181B",
                marginBottom: "14px",
              }}
            >
              Price Range
            </h4>
            <div style={{ display: "flex", gap: "8px" }}>
              {["$", "$$", "$$$"].map((tier) => {
                const isSelected = priceTier === tier;
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setPriceTier(tier)}
                    style={{
                      flex: 1,
                      height: "36px",
                      borderRadius: "8px",
                      border: isSelected
                        ? "1.5px solid #FF5500"
                        : "1px solid #E2E8F0",
                      backgroundColor: isSelected ? "#FFF7ED" : "#FFFFFF",
                      color: isSelected ? "#FF5500" : "#475569",
                      fontWeight: isSelected ? "700" : "500",
                      fontSize: "0.9rem",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {tier}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* ================= 2. BestPlaces (Right Column) ================= */}
        <div
          style={{
            flex: "1 1 983px",
            maxWidth: "983px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
          className="best-places-column"
        >
          {/* Section Title */}
          <h2
            style={{
              fontSize: "1.55rem",
              fontWeight: "800",
              color: "#18181B",
              margin: 0,
              letterSpacing: "-0.3px",
            }}
          >
            Best Places Nearby
          </h2>

          {/* PlaceGrid: 4 cards per row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: "24px",
              width: "100%",
            }}
            className="place-grid-layout"
          >
            {SAMPLE_PLACES.map((place) => (
              <Link
                href={`/restaurant/${place.kitchenId || "7-12-kitchen"}`}
                key={place.id}
                style={{
                  width: "100%",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: "1px solid #F1F5F9",
                  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.03)",
                  display: "flex",
                  flexDirection: "column",
                  cursor: "pointer",
                  transition: "transform 0.25s ease, box-shadow 0.25s ease",
                  textDecoration: "none",
                  color: "inherit",
                }}
                className="place-card"
              >
                {/* Card Image */}
                <div
                  style={{
                    width: "100%",
                    height: "160px",
                    position: "relative",
                    overflow: "hidden",
                    backgroundColor: "#F8FAFC",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={place.imageUrl}
                    alt={place.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "transform 0.3s ease",
                    }}
                    className="place-card-img"
                  />
                </div>

                {/* Card Content */}
                <div
                  style={{
                    padding: "14px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {/* Place Name */}
                  <h3
                    style={{
                      fontSize: "1.05rem",
                      fontWeight: "700",
                      color: "#18181B",
                      margin: 0,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
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
                    {/* Green Star Rating Pill */}
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        backgroundColor: "#ECFDF5",
                        color: "#10B981",
                        border: "1px solid rgba(16, 185, 129, 0.2)",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "0.82rem",
                        fontWeight: "700",
                      }}
                    >
                      <Star size={13} fill="#10B981" color="#10B981" />
                      <span>{place.rating.toFixed(1)}</span>
                    </div>

                    {/* Delivery Time */}
                    <span
                      style={{
                        fontSize: "0.85rem",
                        color: "#64748B",
                        fontWeight: "500",
                      }}
                    >
                      {place.time}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .place-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08) !important;
        }
        .place-card:hover .place-card-img {
          transform: scale(1.04);
        }
        @media (max-width: 1100px) {
          .place-grid-layout {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 900px) {
          .properties-main-layout {
            flex-direction: column !important;
          }
          .sidebar-filters {
            width: 100% !important;
            min-width: 100% !important;
            height: auto !important;
          }
          .best-places-column {
            width: 100% !important;
            max-width: 100% !important;
          }
          .place-grid-layout {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 540px) {
          .place-grid-layout {
            grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
          }
        }
      `}</style>
    </section>
  );
}
