"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { DietaryTag } from "@/components/common/DietaryTag";
import { useCart } from "@/context/CartContext";

export interface TopRatedItem {
  id: string;
  foodItemId?: string;
  name: string;
  rating: number;
  category: string;
  price: number;
  time: string;
  imageUrl: string;
  link?: string;
  itemType?: string;
  distanceText?: string;
  sellerId?: string;
  sellerName?: string;
  sellerIsOnline?: boolean;
  isAvailable?: boolean;
}

interface DashboardBodyProps {
  title?: string;
  seeAllLink?: string;
  items?: TopRatedItem[];
}

export default function DashboardBody({
  title = "Top Rated",
  seeAllLink = "/food-explore?sort=rating",
  items,
}: DashboardBodyProps) {
  const { addToCart } = useCart();
  const [addedId, setAddedId] = useState<string | null>(null);

  if (!items || items.length === 0) {
    return null;
  }

  const handleOrder = (item: TopRatedItem) => {
    if (item.sellerIsOnline === false || item.isAvailable === false) return;

    addToCart({
      id: item.id,
      foodItemId: item.foodItemId || item.id,
      name: item.name,
      price: item.price || 0,
      quantity: 1,
      sellerId: item.sellerId || "k-1",
      sellerName: item.sellerName || "Verified Cloud Kitchen",
      image: item.imageUrl,
      imageUrl: item.imageUrl,
      stockQuantity: -1,
    });
    setAddedId(item.id);
    setTimeout(() => setAddedId(null), 1800);
  };

  const displayItems = items;

  return (
    <section
      style={{
        width: "100%",
        background: "transparent",
        padding: "0",
        boxSizing: "border-box",
        marginBottom: "24px",
      }}
      aria-label={title}
    >
      {/* Outer Card Wrapper */}
      <div
        style={{
          width: "100%",
          backgroundColor: "#FDFDFD",
          borderRadius: "24px",
          border: "1px solid #EFEFEF",
          boxShadow: "0 6px 24px rgba(0, 0, 0, 0.03)",
          padding: "24px 28px",
          boxSizing: "border-box",
        }}
        className="top-rated-container-card"
      >
        {/* Section Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <h2
            style={{
              fontSize: "1.45rem",
              fontWeight: "800",
              color: "#18181B",
              margin: 0,
            }}
            className="top-rated-title"
          >
            {title}
          </h2>

          <Link
            href={seeAllLink}
            style={{
              color: "#FF6B00",
              fontSize: "0.95rem",
              fontWeight: "700",
              textDecoration: "none",
              transition: "color 0.2s ease",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            See all
          </Link>
        </div>

        {/* 2x3 Grid Layout (Desktop) / 1-col (Mobile) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            columnGap: "24px",
            rowGap: "16px",
            width: "100%",
          }}
          className="top-rated-grid"
        >
          {displayItems.slice(0, 6).map((item) => {
            const isSellerClosed = item.sellerIsOnline === false;
            const isItemUnavailable = item.isAvailable === false;
            const isClosed = isSellerClosed || isItemUnavailable;

            return (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: isClosed ? "#F8FAFC" : "#FFFFFF",
                borderRadius: "16px",
                padding: "12px 16px",
                border: isClosed ? "1px solid #E2E8F0" : "1px solid #F1F5F9",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
                boxSizing: "border-box",
                transition: "all 0.2s ease",
                gap: "12px",
                opacity: isClosed ? 0.85 : 1,
              }}
              className="top-rated-card"
            >
              {/* Left Column: Image + Info */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  minWidth: 0,
                  flex: 1,
                }}
              >
                {/* Food Image */}
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "14px",
                    overflow: "hidden",
                    flexShrink: 0,
                    backgroundColor: "#F8FAFC",
                    position: "relative",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      filter: isClosed ? "grayscale(100%)" : "none",
                    }}
                  />
                </div>

                {/* Name, Rating & Subtitle */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    minWidth: 0,
                  }}
                >
                  {/* Name + Star Rating Row */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "0.95rem",
                        fontWeight: "700",
                        color: isClosed ? "#64748B" : "#18181B",
                        margin: 0,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.name}
                    </h3>
                    <DietaryTag
                      itemType={
                        item.itemType ||
                        (item.name.toLowerCase().includes("chicken") ||
                        (item.name.toLowerCase().includes("burger") &&
                          !item.name.toLowerCase().includes("veg"))
                          ? "NON_VEG"
                          : "VEG")
                      }
                      size="xs"
                    />
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "3px",
                      }}
                    >
                      <Star size={13} fill={isClosed ? "#94A3B8" : "#F59E0B"} color={isClosed ? "#94A3B8" : "#F59E0B"} />
                      <span
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: "700",
                          color: isClosed ? "#94A3B8" : "#18181B",
                        }}
                      >
                        {item.rating}
                      </span>
                    </div>
                  </div>

                  {/* Category • Price • Time Subtitle */}
                  <span
                    style={{
                      fontSize: "0.78rem",
                      color: "#64748B",
                      fontWeight: "500",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.category} • ₹{item.price} {item.distanceText ? `• 📍 ${item.distanceText}` : ""} • {item.time}
                  </span>
                </div>
              </div>

              {/* Right Column: Order Button */}
              {isClosed ? (
                <span
                  style={{
                    backgroundColor: "#F1F5F9",
                    color: "#94A3B8",
                    fontSize: "0.82rem",
                    fontWeight: "700",
                    padding: "6px 14px",
                    borderRadius: "9999px",
                    border: "1px solid #E2E8F0",
                    cursor: "not-allowed",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {isSellerClosed ? "Closed" : "Unavailable"}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleOrder(item)}
                  style={{
                    backgroundColor: addedId === item.id ? "#10B981" : "#FF6B00",
                    color: "#FFFFFF",
                    fontSize: "0.82rem",
                    fontWeight: "700",
                    padding: "6px 16px",
                    borderRadius: "9999px",
                    border: "none",
                    cursor: "pointer",
                    boxShadow: addedId === item.id ? "0 3px 10px rgba(16, 185, 129, 0.25)" : "0 3px 10px rgba(255, 107, 0, 0.25)",
                    transition: "all 0.2s ease",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                  className="top-rated-order-btn"
                >
                  {addedId === item.id ? "Added! ✓" : "Order"}
                </button>
              )}
            </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .top-rated-card:hover {
          border-color: #CBD5E1;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
          transform: translateY(-2px);
        }
        .top-rated-order-btn:hover {
          background-color: #E65F00;
          transform: scale(1.03);
        }
        @media (max-width: 1024px) {
          .top-rated-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 768px) {
          .top-rated-card:nth-child(n+3) {
            display: none !important;
          }
        }
        @media (max-width: 640px) {
          .top-rated-card {
            padding: 8px 10px !important;
            gap: 8px !important;
            min-height: 74px !important;
          }
          .top-rated-thumb {
            width: 52px !important;
            height: 52px !important;
            min-width: 52px !important;
          }
          .top-rated-name {
            font-size: 0.86rem !important;
          }
          .top-rated-order-btn {
            padding: 5px 12px !important;
            font-size: 0.76rem !important;
          }
        }
      `}</style>
    </section>
  );
}
