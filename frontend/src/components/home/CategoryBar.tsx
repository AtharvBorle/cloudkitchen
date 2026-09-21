"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export interface CategoryItem {
  id: string;
  name: string;
  image: string;
  emoji: string;
  route: string;
}

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
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(true);

  const displayCategories = items || [];

  const checkScrollPosition = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  }, []);

  useEffect(() => {
    checkScrollPosition();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScrollPosition, { passive: true });
      window.addEventListener("resize", checkScrollPosition);
      return () => {
        container.removeEventListener("scroll", checkScrollPosition);
        window.removeEventListener("resize", checkScrollPosition);
      };
    }
  }, [displayCategories, checkScrollPosition]);

  if (!items || items.length === 0) {
    return null;
  }

  const handleScroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "right" ? 320 : -320;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      setTimeout(checkScrollPosition, 350);
    }
  };

  const handleItemClick = (cat: CategoryItem) => {
    setSelectedId(cat.id);
    if (cat.id === "rooms" || cat.name.toLowerCase() === "rooms") {
      router.push("/room-booking");
      return;
    }
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
          position: "relative",
          boxSizing: "border-box",
          gap: "8px",
        }}
      >
        {/* Left Arrow Navigation Button (Dynamic: visible when scrolled right) */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => handleScroll("left")}
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
              marginRight: "4px",
              flexShrink: 0,
              zIndex: 2,
            }}
            className="category-scroll-arrow category-scroll-arrow-left"
            aria-label="Scroll Categories Left"
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>
        )}

        {/* Scrollable Categories Wrapper */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScrollPosition}
          style={{
            display: "flex",
            alignItems: "center",
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

        {/* Right Arrow Navigation Button (Dynamic: visible when can scroll right) */}
        {canScrollRight && (
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
              marginLeft: "4px",
              flexShrink: 0,
              zIndex: 2,
            }}
            className="category-scroll-arrow category-scroll-arrow-right"
            aria-label="Scroll Categories Right"
          >
            <ChevronRight size={22} strokeWidth={2.5} />
          </button>
        )}
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
        @media (max-width: 768px) {
          .category-scroll-arrow {
            display: none !important;
          }
          .category-item-btn {
            width: 72px !important;
            min-width: 72px !important;
            min-height: 90px !important;
            padding: 8px 4px !important;
            border-radius: 16px !important;
            gap: 4px !important;
          }
        }
      `}</style>
    </div>
  );
}
