"use client";

import React, { useState } from "react";

export interface FilterOption {
  id: string;
  label: string;
}

const DEFAULT_FILTERS: FilterOption[] = [
  { id: "fastest", label: "Fastest" },
  { id: "rating", label: "Rating 4.5+" },
  { id: "offers", label: "Offers" },
  { id: "cuisines", label: "Cuisines" },
  { id: "price", label: "Price Range" },
  { id: "dietary", label: "Dietary" },
];

interface FilterRowProps {
  filters?: FilterOption[];
  activeFilterId?: string;
  onFilterChange?: (filterId: string) => void;
}

export default function FilterRow({
  filters = DEFAULT_FILTERS,
  activeFilterId = "fastest",
  onFilterChange,
}: FilterRowProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>(activeFilterId);

  const handleFilterClick = (id: string) => {
    setSelectedFilter(id);
    if (onFilterChange) {
      onFilterChange(id);
    }
  };

  return (
    <section
      style={{
        width: "100%",
        padding: "0",
        background: "transparent",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          width: "100%",
          minHeight: "37px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "12px",
          overflowX: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          paddingBottom: "4px",
          boxSizing: "border-box",
        }}
        className="hide-scrollbar"
      >
        {filters.map((filter) => {
          const isActive = selectedFilter === filter.id;

          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => handleFilterClick(filter.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                height: "37px",
                padding: "8px 16px",
                borderRadius: "16px",
                border: isActive ? "1px solid #FF6B00" : "1px solid #E2E8F0",
                backgroundColor: isActive ? "#FF6B00" : "#FFFFFF",
                color: isActive ? "#FFFFFF" : "#334155",
                fontSize: "0.88rem",
                fontWeight: isActive ? "700" : "500",
                cursor: "pointer",
                gap: "6px",
                whiteSpace: "nowrap",
                transition: "all 0.2s ease",
                boxShadow: isActive ? "0 2px 8px rgba(255, 107, 0, 0.25)" : "none",
                flexShrink: 0,
              }}
              className="filter-btn"
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .filter-btn:not(:active):hover {
          border-color: #CBD5E1;
          background-color: #F8FAFC;
        }
      `}</style>
    </section>
  );
}
