"use client";

import React, { useState, useEffect } from "react";
import { SlidersHorizontal, X, Check, RotateCcw, ChevronRight } from "lucide-react";

export interface FilterOption {
  id: string;
  label: string;
}

const DEFAULT_PILL_FILTERS: FilterOption[] = [
  { id: "fastest", label: "Fastest" },
  { id: "rating", label: "Rating 4.5+" },
  { id: "offers", label: "Offers" },
];

const CUISINES = [
  { id: "italian", label: "Italian", count: 12 },
  { id: "american", label: "American", count: 18 },
  { id: "healthy", label: "Healthy / Bowls", count: 8 },
  { id: "japanese", label: "Japanese", count: 6 },
  { id: "indian", label: "Indian / Mughlai", count: 24 },
  { id: "mexican", label: "Mexican", count: 10 },
];

const DIETARY = [
  { id: "veg", label: "Vegetarian", count: 15 },
  { id: "vegan", label: "Vegan", count: 4 },
  { id: "gluten-free", label: "Gluten-Free", count: 6 },
  { id: "halal", label: "Halal Certified", count: 11 },
];

const PRICE_TIERS = ["$", "$$", "$$$"];

interface FilterRowProps {
  filters?: FilterOption[];
  activeFilterId?: string;
  onFilterChange?: (filterId: string) => void;
}

export default function FilterRow({
  filters = DEFAULT_PILL_FILTERS,
  activeFilterId = "fastest",
  onFilterChange,
}: FilterRowProps) {
  const [selectedPill, setSelectedPill] = useState<string>(activeFilterId);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Dynamic filter state
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([
    "italian",
    "american",
    "healthy",
  ]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<string>("$");

  // Lock body scroll when modal/drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  const activeFiltersCount =
    selectedCuisines.length +
    selectedDietary.length +
    (selectedPrice ? 1 : 0);

  const handlePillClick = (id: string) => {
    setSelectedPill(id);
    if (onFilterChange) {
      onFilterChange(id);
    }
  };

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

  const handlePriceSelect = (tier: string) => {
    setSelectedPrice((prev) => (prev === tier ? "" : tier));
  };

  const handleResetFilters = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedCuisines([]);
    setSelectedDietary([]);
    setSelectedPrice("");
  };

  const handleApplyFilters = () => {
    setIsDrawerOpen(false);
    if (onFilterChange) {
      const summary = [
        ...selectedCuisines,
        ...selectedDietary,
        selectedPrice,
      ]
        .filter(Boolean)
        .join(",");
      onFilterChange(summary || selectedPill);
    }
  };

  return (
    <section className="filter-row-section">
      {/* Top Bar with Filter Icon Button & Quick Pills */}
      <div className="filter-bar-container hide-scrollbar">
        {/* 3-line filter trigger button */}
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className={`filter-modal-trigger ${activeFiltersCount > 0 ? "active-trigger" : ""}`}
          aria-label="Open Cuisines, Dietary and Price filters"
        >
          <div className="icon-badge-box">
            <SlidersHorizontal size={17} strokeWidth={2.4} />
            {activeFiltersCount > 0 && (
              <span className="count-badge">{activeFiltersCount}</span>
            )}
          </div>
          <span className="filter-trigger-text">Filters</span>
        </button>

        {/* Quick Pills */}
        {filters.map((filter) => {
          const isActive = selectedPill === filter.id && activeFiltersCount === 0;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => handlePillClick(filter.id)}
              className={`filter-pill-btn ${isActive ? "active-pill" : ""}`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {/* FILTER DRAWER / MODAL POPUP */}
      {isDrawerOpen && (
        <div className="filter-modal-overlay" onClick={() => setIsDrawerOpen(false)}>
          <div
            className="filter-modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="modal-header">
              <h3 className="modal-heading">Filters</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="clear-all-action-btn"
                >
                  Clear All
                </button>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setIsDrawerOpen(false)}
                  aria-label="Close filters"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body: Continuous Form with Cuisines, Dietary Preferences & Price Range */}
            <div className="modal-body hide-scrollbar">
              {/* 1. CUISINES */}
              <div className="form-filter-group">
                <h4 className="group-title">Cuisines</h4>
                <div className="checkbox-col">
                  {CUISINES.map((item) => {
                    const isChecked = selectedCuisines.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        className="checkbox-row"
                        onClick={() => toggleCuisine(item.id)}
                      >
                        <div className="row-left">
                          <div className={`checkbox-square ${isChecked ? "checked" : ""}`}>
                            {isChecked && <Check size={12} color="#FFFFFF" strokeWidth={3.5} />}
                          </div>
                          <span className={`row-label ${isChecked ? "label-active" : ""}`}>
                            {item.label}
                          </span>
                        </div>
                        <span className="row-count">{item.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. DIETARY PREFERENCES */}
              <div className="form-filter-group">
                <h4 className="group-title">Dietary Preferences</h4>
                <div className="checkbox-col">
                  {DIETARY.map((item) => {
                    const isChecked = selectedDietary.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        className="checkbox-row"
                        onClick={() => toggleDietary(item.id)}
                      >
                        <div className="row-left">
                          <div className={`checkbox-square ${isChecked ? "checked" : ""}`}>
                            {isChecked && <Check size={12} color="#FFFFFF" strokeWidth={3.5} />}
                          </div>
                          <span className={`row-label ${isChecked ? "label-active" : ""}`}>
                            {item.label}
                          </span>
                        </div>
                        <span className="row-count">{item.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. PRICE RANGE */}
              <div className="form-filter-group">
                <h4 className="group-title">Price Range</h4>
                <div className="price-tiers-row">
                  {PRICE_TIERS.map((tier) => {
                    const isSelected = selectedPrice === tier;
                    return (
                      <button
                        key={tier}
                        type="button"
                        className={`price-pill-btn ${isSelected ? "price-pill-active" : ""}`}
                        onClick={() => handlePriceSelect(tier)}
                      >
                        {tier}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <button
                type="button"
                className="apply-btn"
                onClick={handleApplyFilters}
              >
                Apply Filters {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ""}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .filter-row-section {
          width: 100%;
          padding: 0;
          background: transparent;
        }

        .filter-bar-container {
          max-width: 1280px;
          width: 100%;
          min-height: 42px;
          margin: 0 auto;
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 10px;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
          padding-bottom: 2px;
          box-sizing: border-box;
        }

        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }

        /* 3-line filter trigger button */
        .filter-modal-trigger {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 38px;
          padding: 0 16px;
          border-radius: 9999px;
          background-color: #ffffff;
          border: 1.5px solid #e2e8f0;
          color: #0f172a;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .filter-modal-trigger:hover {
          border-color: #f97316;
          color: #f97316;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(249, 115, 22, 0.12);
        }

        .active-trigger {
          background-color: #fff7ed;
          border-color: #f97316;
          color: #f97316;
        }

        .icon-badge-box {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .count-badge {
          position: absolute;
          top: -7px;
          right: -9px;
          background-color: #f97316;
          color: #ffffff;
          font-size: 0.65rem;
          font-weight: 800;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .filter-trigger-text {
          letter-spacing: 0.01em;
        }

        /* Pills */
        .filter-pill-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 38px;
          padding: 0 16px;
          border-radius: 9999px;
          border: 1px solid #e2e8f0;
          background-color: #ffffff;
          color: #475569;
          font-size: 0.86rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
          flex-shrink: 0;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
        }

        .filter-pill-btn:hover {
          border-color: #cbd5e1;
          background-color: #f8fafc;
          color: #0f172a;
        }

        .active-pill {
          background-color: #f97316 !important;
          border-color: #f97316 !important;
          color: #ffffff !important;
          box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25) !important;
        }

        /* MODAL OVERLAY & CONTENT */
        .filter-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: rgba(15, 23, 42, 0.5);
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          box-sizing: border-box;
          animation: fadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .filter-modal-content {
          width: 100%;
          max-width: 400px;
          max-height: 88vh;
          background-color: #ffffff;
          border-radius: 20px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          border: 1px solid #f1f5f9;
        }

        /* Header */
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 22px;
          border-bottom: 1px solid #f1f5f9;
        }

        .modal-heading {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }

        .clear-all-action-btn {
          color: #f97316;
          font-size: 0.92rem;
          font-weight: 700;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 4px 6px;
          transition: color 0.15s ease;
        }

        .clear-all-action-btn:hover {
          color: #ea580c;
        }

        .modal-close-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          background-color: #f1f5f9;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .modal-close-btn:hover {
          background-color: #e2e8f0;
          color: #0f172a;
        }

        /* Body */
        .modal-body {
          padding: 20px 22px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .form-filter-group {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .group-title {
          font-size: 1rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .checkbox-col {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .checkbox-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          user-select: none;
          padding: 2px 0;
        }

        .row-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .checkbox-square {
          width: 18px;
          height: 18px;
          border-radius: 5px;
          border: 1.5px solid #cbd5e1;
          background-color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
          box-sizing: border-box;
          flex-shrink: 0;
        }

        .checked {
          background-color: #f97316 !important;
          border-color: #f97316 !important;
        }

        .row-label {
          font-size: 0.92rem;
          color: #475569;
          font-weight: 500;
          transition: color 0.15s ease;
        }

        .label-active {
          color: #0f172a !important;
          font-weight: 600 !important;
        }

        .row-count {
          font-size: 0.88rem;
          color: #94a3b8;
          font-weight: 400;
        }

        /* Price Tiers */
        .price-tiers-row {
          display: flex;
          gap: 10px;
        }

        .price-pill-btn {
          flex: 1;
          height: 40px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          background-color: #ffffff;
          color: #334155;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .price-pill-btn:hover {
          border-color: #f97316;
        }

        .price-pill-active {
          border: 1.5px solid #f97316 !important;
          background-color: #fff7ed !important;
          color: #f97316 !important;
          font-weight: 700 !important;
        }

        /* Footer */
        .modal-footer {
          padding: 16px 22px;
          border-top: 1px solid #f1f5f9;
          background-color: #ffffff;
        }

        .apply-btn {
          width: 100%;
          height: 44px;
          border-radius: 12px;
          background-color: #f97316;
          color: #ffffff;
          font-size: 0.95rem;
          font-weight: 700;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(249, 115, 22, 0.28);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .apply-btn:hover {
          background-color: #ea580c;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(249, 115, 22, 0.36);
        }

        @media (max-width: 768px) {
          .filter-row-section {
            display: none !important;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleUp {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}
