"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Check, SlidersHorizontal } from "lucide-react";
import styles from "./PaginationControls.module.css";

export interface PageSizeSelectorProps {
  pageSize: number | "All";
  onPageSizeChange: (newSize: number | "All") => void;
  pageSizeOptions?: (number | "All")[];
  onPageChange?: (newPage: number) => void;
  label?: string;
  dropDirection?: "up" | "down" | "auto";
  className?: string;
}

export const PageSizeSelector: React.FC<PageSizeSelectorProps> = ({
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 25, 50, "All"],
  onPageChange,
  label = "Per page:",
  dropDirection = "auto",
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [computedDirection, setComputedDirection] = useState<"up" | "down">("up");
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close when clicked outside or on Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Handle position direction calculation (smart dropup / dropdown)
  useEffect(() => {
    if (!isOpen) return;

    if (dropDirection === "up" || dropDirection === "down") {
      setComputedDirection(dropDirection);
      return;
    }

    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      // In table footers or bottom pages, prefer dropping up if space below is limited
      if (spaceBelow < 230 && spaceAbove > 180) {
        setComputedDirection("up");
      } else if (spaceBelow >= 230) {
        setComputedDirection("down");
      } else {
        setComputedDirection("up");
      }
    }
  }, [isOpen, dropDirection]);

  const handleSelect = (opt: number | "All") => {
    onPageSizeChange(opt);
    if (onPageChange) {
      onPageChange(1);
    }
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className={`${styles.pageSizeWrapper} ${className || ""}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`${styles.pageSizeTrigger} ${isOpen ? styles.pageSizeTriggerActive : ""}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`${label} ${pageSize === "All" ? "All records" : `${pageSize} records`}`}
      >
        <SlidersHorizontal size={13} className={styles.triggerIcon} />
        {label && <span className={styles.triggerLabel}>{label}</span>}
        <span className={styles.triggerBadge}>{pageSize === "All" ? "All" : pageSize}</span>
        <ChevronDown
          size={14}
          className={`${styles.chevronIcon} ${isOpen ? styles.chevronRotated : ""}`}
        />
      </button>

      {isOpen && (
        <div
          className={`${styles.pageSizeMenu} ${
            computedDirection === "up" ? styles.menuDropUp : styles.menuDropDown
          }`}
          role="listbox"
          aria-label="Select records per page"
        >
          <div className={styles.menuHeader}>
            <span className={styles.menuHeaderTitle}>Records Per Page</span>
            <span className={styles.menuHeaderCount}>
              {pageSize === "All" ? "All" : `${pageSize}`}
            </span>
          </div>

          {pageSizeOptions.map((opt) => {
            const isSelected = String(pageSize) === String(opt);
            return (
              <button
                key={String(opt)}
                type="button"
                className={`${styles.menuItem} ${isSelected ? styles.menuItemActive : ""}`}
                onClick={() => handleSelect(opt)}
                role="option"
                aria-selected={isSelected}
              >
                <div className={styles.menuItemLeft}>
                  <span className={styles.menuItemBadge}>{opt === "All" ? "∞" : opt}</span>
                  <span className={styles.menuItemText}>
                    {opt === "All" ? "Show All" : `${opt} per page`}
                  </span>
                </div>
                {isSelected && <Check size={14} strokeWidth={2.8} className={styles.menuCheckIcon} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export interface PaginationControlsProps {
  currentPage: number;
  totalItems: number;
  pageSize: number | "All";
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newSize: number | "All") => void;
  itemName?: string;
  itemLabel?: string;
  pageSizeOptions?: (number | "All")[];
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  itemName,
  itemLabel,
  pageSizeOptions = [10, 20, 25, 50, "All"],
}) => {
  const displayLabel = itemLabel || itemName || "items";
  const isAll = pageSize === "All";
  const numericPageSize = isAll ? Math.max(1, totalItems) : Number(pageSize) || 10;
  const totalPages = isAll ? 1 : Math.max(1, Math.ceil(totalItems / numericPageSize));

  if (totalItems <= 0) return null;

  const startItem = isAll ? 1 : (currentPage - 1) * numericPageSize + 1;
  const endItem = isAll ? totalItems : Math.min(currentPage * numericPageSize, totalItems);

  // Generate page numbers window (e.g. 1, 2, 3... or 1, ..., 4, 5, 6, ..., 12)
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  };

  const pages = getPageNumbers();

  return (
    <div className={`${styles.paginationContainer} pagination-controls-bar`}>
      {/* Left: Summary text */}
      <div className={styles.summaryText}>
        <span>
          Showing <strong>{startItem}</strong> - <strong>{endItem}</strong> of <strong>{totalItems}</strong> {displayLabel}
        </span>
      </div>

      {/* Center: Page Buttons */}
      {!isAll && totalPages > 1 && (
        <div className={styles.pageNavList}>
          {/* Previous Page */}
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            className={styles.pageNavBtn}
            title="Previous Page"
            aria-label="Previous Page"
          >
            <ChevronLeft size={14} />
            <span className="pagination-prev-label">Prev</span>
          </button>

          {/* Page numbers */}
          {pages.map((p, idx) => {
            if (p === "...") {
              return (
                <span key={`ellipsis-${idx}`} className={styles.pageEllipsis}>
                  ...
                </span>
              );
            }

            const pageNum = Number(p);
            const isActive = pageNum === currentPage;

            return (
              <button
                key={`page-${pageNum}`}
                type="button"
                onClick={() => onPageChange(pageNum)}
                className={`${styles.pageNumberBtn} ${isActive ? styles.pageNumberActive : ""}`}
                aria-current={isActive ? "page" : undefined}
                aria-label={`Page ${pageNum}`}
              >
                {pageNum}
              </button>
            );
          })}

          {/* Next Page */}
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            className={styles.pageNavBtn}
            title="Next Page"
            aria-label="Next Page"
          >
            <span className="pagination-next-label">Next</span>
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Right: Interactive Page Size Selector */}
      <PageSizeSelector
        pageSize={pageSize}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={pageSizeOptions}
        onPageChange={onPageChange}
      />
    </div>
  );
};

export default PaginationControls;
