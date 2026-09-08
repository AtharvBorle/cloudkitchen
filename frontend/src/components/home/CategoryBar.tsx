"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

export interface CategoryItem {
  id: string;
  name: string;
  image: string;
  emoji: string;
  route: string;
}

const CATEGORIES: CategoryItem[] = [
  { id: "food", name: "Food", image: "/images/categories/cat-food.png", emoji: "🍔", route: "/explore-desktop" },
  { id: "mess", name: "Mess", image: "/images/categories/cat-mess.png", emoji: "🧺", route: "/explore-desktop?category=mess" },
  { id: "bakery", name: "Bakery", image: "/images/categories/cat-backery.png", emoji: "🥐", route: "/explore-desktop?category=bakery" },
  { id: "home-meals", name: "Home Meals", image: "/images/categories/cat-homemeals.png", emoji: "🍲", route: "/explore-desktop?category=homemeals" },
  { id: "healthy", name: "Healthy", image: "/images/categories/cat-healthy.png", emoji: "🥗", route: "/explore-desktop?category=healthy" },
  { id: "snacks", name: "Snacks", image: "/images/categories/cat-snacks.png", emoji: "🍿", route: "/explore-desktop?category=snacks" },
  { id: "desserts", name: "Desserts", image: "/images/categories/cat-deserts.png", emoji: "🍰", route: "/explore-desktop?category=desserts" },
  { id: "drink", name: "Drink", image: "/images/categories/cat-drink.png", emoji: "🍹", route: "/explore-desktop?category=drinks" },
  { id: "rooms", name: "Rooms", image: "/images/categories/cat-rooms.png", emoji: "🛏️", route: "/room-booking" },
];

interface CategoryBarProps {
  activeCategoryId?: string;
  onSelectCategory?: (id: string) => void;
  items?: CategoryItem[];
}

export default function CategoryBar({
  activeCategoryId = "food",
  onSelectCategory,
  items,
}: CategoryBarProps) {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string>(activeCategoryId);

  // Use dynamic items if provided and not empty, otherwise fallback to CATEGORIES
  const displayCategories: CategoryItem[] = React.useMemo(() => {
    if (items && items.length > 0) {
      const hasRooms = items.some((c) => c.id === "rooms" || c.name.toLowerCase() === "rooms");
      if (!hasRooms) {
        return [
          ...items,
          { id: "rooms", name: "Rooms", image: "/images/categories/cat-rooms.png", emoji: "🛏️", route: "/room-booking" }
        ];
      }
      return items;
    }
    return CATEGORIES;
  }, [items]);

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
      className="category-scroll"
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1280px",
          minHeight: "112px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingRight: "12px",
          paddingLeft: "0",
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
            gap: "16px",
            overflowX: "auto",
            scrollBehavior: "smooth",
            padding: "8px 4px",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
          className="hide-scrollbar"
        >
          {displayCategories.map((cat) => {
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
                  width: "98px",
                  minWidth: "98px",
                  minHeight: "108px",
                  padding: "10px 12px",
                  borderRadius: "18px",
                  backgroundColor: isSelected ? "#F5C58B" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                  flexShrink: 0,
                  gap: "6px",
                  boxSizing: "border-box",
                  boxShadow: isSelected
                    ? "0 6px 16px rgba(245, 197, 139, 0.45)"
                    : "none",
                }}
                className={`tab-home category-item-btn ${isSelected ? "selected" : ""}`}
              >
                {/* 3D Graphic Icon (Width: 60px, Height: 60px, Shadow: 0px 4px 11.9px 0px #00000040) */}
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    minWidth: "60px",
                    minHeight: "60px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    transform: isSelected ? "scale(1.05)" : "scale(1)",
                    transition: "transform 0.2s ease",
                  }}
                >
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    width={60}
                    height={60}
                    style={{
                      width: "60px",
                      height: "60px",
                      objectFit: "contain",
                      filter: "drop-shadow(0px 4px 11.9px rgba(0, 0, 0, 0.25))",
                    }}
                    onError={(e) => {
                      // Fallback to emoji if image cannot be loaded
                      const target = e.currentTarget;
                      target.style.display = "none";
                    }}
                  />
                </div>

                {/* Category Label */}
                <span
                  style={{
                    fontSize: "13.5px",
                    fontWeight: isSelected ? "700" : "600",
                    color: isSelected ? "#FFFFFF" : "#2E3A59",
                    whiteSpace: "nowrap",
                    letterSpacing: "0.2px",
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                    lineHeight: "1.2",
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
            backgroundColor: "#FF6B00",
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 6px 16px rgba(255, 107, 0, 0.35)",
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
          background-color: rgba(245, 197, 139, 0.18);
          transform: translateY(-3px);
        }
        .category-scroll-arrow:hover {
          background-color: #E65F00;
          transform: scale(1.08);
        }
        .category-scroll-arrow:active {
          transform: scale(0.95);
        }
      `}</style>
    </div>
  );
}
