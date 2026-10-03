"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
        padding: "14px 18px",
        backgroundColor: "#FFFFFF",
        borderTop: "1px solid #E2E8F0",
        borderRadius: "0 0 12px 12px",
        fontSize: "13px",
        color: "#475569",
        marginTop: "auto",
      }}
      className="pagination-controls-bar"
    >
      {/* Left: Summary text */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span>
          Showing <strong>{startItem}</strong> - <strong>{endItem}</strong> of <strong>{totalItems}</strong> {displayLabel}
        </span>
      </div>

      {/* Center: Page Buttons */}
      {!isAll && totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {/* Previous Page */}
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid #CBD5E1",
              backgroundColor: currentPage <= 1 ? "#F8FAFC" : "#FFFFFF",
              color: currentPage <= 1 ? "#94A3B8" : "#334155",
              cursor: currentPage <= 1 ? "not-allowed" : "pointer",
              fontSize: "12.5px",
              fontWeight: 600,
              gap: "4px",
              transition: "all 0.15s ease",
            }}
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
                <span
                  key={`ellipsis-${idx}`}
                  style={{
                    padding: "4px 8px",
                    color: "#94A3B8",
                    fontWeight: 600,
                    userSelect: "none",
                  }}
                >
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
                style={{
                  minWidth: "32px",
                  height: "32px",
                  padding: "0 6px",
                  borderRadius: "6px",
                  border: isActive ? "1px solid #F97316" : "1px solid #CBD5E1",
                  backgroundColor: isActive ? "#F97316" : "#FFFFFF",
                  color: isActive ? "#FFFFFF" : "#334155",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: "12.5px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s ease",
                }}
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
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid #CBD5E1",
              backgroundColor: currentPage >= totalPages ? "#F8FAFC" : "#FFFFFF",
              color: currentPage >= totalPages ? "#94A3B8" : "#334155",
              cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
              fontSize: "12.5px",
              fontWeight: 600,
              gap: "4px",
              transition: "all 0.15s ease",
            }}
            title="Next Page"
            aria-label="Next Page"
          >
            <span className="pagination-next-label">Next</span>
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Right: Page Size Selector */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "12.5px", color: "#64748B" }}>Per page:</span>
        <select
          value={String(pageSize)}
          onChange={(e) => {
            const val = e.target.value;
            onPageSizeChange(val === "All" ? "All" : Number(val));
            onPageChange(1);
          }}
          style={{
            padding: "5px 10px",
            borderRadius: "6px",
            border: "1px solid #CBD5E1",
            backgroundColor: "#FFFFFF",
            fontSize: "12.5px",
            fontWeight: 600,
            color: "#1E293B",
            cursor: "pointer",
            outline: "none",
          }}
          aria-label="Items per page"
        >
          {pageSizeOptions.map((opt) => (
            <option key={String(opt)} value={String(opt)}>
              {opt === "All" ? "Show All" : `${opt} per page`}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default PaginationControls;
