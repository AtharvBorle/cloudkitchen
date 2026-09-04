"use client";

import React, { useRef, useState } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export interface CategoryItem {
  id: string;
  name: string;
  icon: string; // Emoji / SVG / Image representation
  route: string;
}

const CATEGORIES: CategoryItem[] = [
  { id: "food", name: "Food", icon: "🍔", route: "/explore/food" },
  { id: "mess", name: "Mess", icon: "🧺", route: "/explore/food?category=mess" },
  { id: "bakery", name: "Bakery", icon: "🥐", route: "/explore/food?category=bakery" },
  { id: "home-meals", name: "Home Meals", icon: "🍲", route: "/explore/food?category=homemeals" },
  { id: "healthy", name: "Healthy", icon: "🥗", route: "/explore/food?category=healthy" },
  { id: "snacks", name: "Snacks", icon: "🍿", route: "/explore/food?category=snacks" },
  { id: "desserts", name: "Desserts", icon: "🍰", route: "/explore/food?category=desserts" },
  { id: "drink", name: "Drink", icon: "🍹", route: "/explore/food?category=drinks" },
  { id: "rooms", name: "Rooms", icon: "🛏️", route: "/explore/rooms" },
];

interface CategoryBarProps {
  activeCategoryId?: string;
  onSelectCategory?: (id: string) => void;
}

export default function CategoryBar({
  activeCategoryId = "food",
  onSelectCategory,
}: CategoryBarProps) {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string>(activeCategoryId);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "right" ? 220 : -220;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const handleItemClick = (cat: CategoryItem) => {
    setSelectedId(cat.id);
    if (onSelectCategory) {
      onSelectCategory(cat.id);
    } else {
      router.push(cat.route);
    }
  };

  return (
    <div
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
          minHeight: "99px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0",
          position: "relative",
          boxSizing: "border-box",
          gap: "12px",
        }}
      >
        {/* Scrollable Categories Wrapper */}
        <div
          ref={scrollContainerRef}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flex: 1,
            gap: "24px",
            overflowX: "auto",
            scrollBehavior: "smooth",
            padding: "8px 4px",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
          className="hide-scrollbar"
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedId === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleItemClick(cat)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: isSelected ? "88px" : "78px",
                  height: "88px",
                  padding: isSelected ? "8px 12px" : "6px 8px",
                  borderRadius: isSelected ? "20px" : "16px",
                  backgroundColor: isSelected ? "#F6C792" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                  flexShrink: 0,
                  boxShadow: isSelected
                    ? "0 8px 20px rgba(246, 199, 146, 0.45)"
                    : "none",
                }}
                className={`category-item-btn ${isSelected ? "selected" : ""}`}
              >
                {/* 3D Icon Graphic Render */}
                <div
                  style={{
                    height: "44px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "2rem",
                    filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.08))",
                    transform: isSelected ? "scale(1.05)" : "scale(1)",
                    transition: "transform 0.2s ease",
                  }}
                >
                  {cat.id === "food" && (
                    <span style={{ fontSize: "2rem" }}>🍔</span>
                  )}
                  {cat.id === "mess" && (
                    <span style={{ fontSize: "2rem" }}>🧺</span>
                  )}
                  {cat.id === "bakery" && (
                    <span style={{ fontSize: "2rem" }}>🥐</span>
                  )}
                  {cat.id === "home-meals" && (
                    <span style={{ fontSize: "2rem" }}>🍲</span>
                  )}
                  {cat.id === "healthy" && (
                    <span style={{ fontSize: "2rem" }}>🥗</span>
                  )}
                  {cat.id === "snacks" && (
                    <span style={{ fontSize: "2rem" }}>🍿</span>
                  )}
                  {cat.id === "desserts" && (
                    <span style={{ fontSize: "2rem" }}>🍰</span>
                  )}
                  {cat.id === "drink" && (
                    <span style={{ fontSize: "2rem" }}>🍹</span>
                  )}
                  {cat.id === "rooms" && (
                    <span style={{ fontSize: "2rem" }}>🛏️</span>
                  )}
                </div>

                {/* Category Label */}
                <span
                  style={{
                    marginTop: "6px",
                    fontSize: "0.85rem",
                    fontWeight: isSelected ? "700" : "600",
                    color: isSelected ? "#FFFFFF" : "#18181B",
                    whiteSpace: "nowrap",
                    letterSpacing: "0.2px",
                  }}
                >
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Arrow Navigation Button */}
        <button
          type="button"
          onClick={() => handleScroll("right")}
          style={{
            width: "44px",
            height: "44px",
            minWidth: "44px",
            borderRadius: "50%",
            backgroundColor: "#FF5500",
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 6px 16px rgba(255, 85, 0, 0.3)",
            transition: "all 0.2s ease",
            marginLeft: "8px",
            flexShrink: 0,
          }}
          className="category-scroll-arrow"
          aria-label="Scroll Categories Right"
        >
          <ChevronRight size={22} strokeWidth={2.5} />
        </button>
      </div>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .category-item-btn:not(.selected):hover {
          background-color: rgba(246, 199, 146, 0.2);
          transform: translateY(-2px);
        }
        .category-scroll-arrow:hover {
          background-color: "#E64D00";
          transform: scale(1.06);
        }
        .category-scroll-arrow:active {
          transform: scale(0.96);
        }
      `}</style>
    </div>
  );
}
