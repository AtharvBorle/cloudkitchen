"use client";

import React from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { DietaryTag } from "@/components/common/DietaryTag";

export interface DishItem {
  id: string;
  name: string;
  rating: number;
  time: string;
  imageUrl: string;
  link?: string;
  itemType?: string;
  sellerIsOnline?: boolean;
  isOnline?: boolean;
  distanceText?: string;
}

interface BestPlacesProps {
  title?: string;
  seeAllLink?: string;
  dishes?: DishItem[];
}

export default function BestPlaces({
  title = "Popular Dishes",
  seeAllLink = "/explore-desktop",
  dishes,
}: BestPlacesProps) {
  if (!dishes || dishes.length === 0) {
    return null;
  }

  const displayDishes = dishes;

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
        className="popular-dishes-container-card"
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
            className="popular-dishes-title"
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

        {/* Place Grid: 4 Cards Row / 2x2 mobile */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "20px",
            width: "100%",
          }}
          className="popular-dishes-grid"
        >
          {displayDishes.slice(0, 4).map((dish) => {
            const isClosed = dish.sellerIsOnline === false || dish.isOnline === false;
            return (
            <Link
              key={dish.id}
              href={dish.link || "/explore-desktop"}
              style={{
                textDecoration: "none",
                display: "flex",
                flexDirection: "column",
                opacity: isClosed ? 0.85 : 1,
              }}
            >
              <div
                style={{
                  width: "100%",
                  backgroundColor: isClosed ? "#F8FAFC" : "#FFFFFF",
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: isClosed ? "1px solid #E2E8F0" : "1px solid #F1F5F9",
                  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
                  display: "flex",
                  flexDirection: "column",
                  cursor: "pointer",
                  transition: "transform 0.25s ease, box-shadow 0.25s ease",
                }}
                className="dish-card"
              >
                {/* Card Image */}
                <div
                  style={{
                    width: "100%",
                    height: "150px",
                    position: "relative",
                    overflow: "hidden",
                    backgroundColor: "#F8FAFC",
                  }}
                  className="dish-img-box"
                >
                  <div style={{ position: "absolute", top: "8px", left: "8px", zIndex: 2 }}>
                    <DietaryTag
                      itemType={
                        dish.itemType ||
                        (dish.name.toLowerCase().includes("chicken") ||
                        dish.name.toLowerCase().includes("mutton") ||
                        dish.name.toLowerCase().includes("fish") ||
                        dish.name.toLowerCase().includes("meat")
                          ? "NON_VEG"
                          : "VEG")
                      }
                      size="xs"
                    />
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={dish.imageUrl}
                    alt={dish.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "transform 0.3s ease",
                      filter: isClosed ? "grayscale(100%)" : "none",
                    }}
                    className="dish-card-img"
                  />
                  {isClosed && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(15, 23, 42, 0.4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 2,
                      }}
                    >
                      <span
                        style={{
                          backgroundColor: "#0F172A",
                          color: "#FFFFFF",
                          fontSize: "10.5px",
                          fontWeight: "800",
                          letterSpacing: "0.8px",
                          padding: "4px 10px",
                          borderRadius: "12px",
                          textTransform: "uppercase",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                          border: "1px solid rgba(255,255,255,0.2)",
                        }}
                      >
                        🔴 CLOSED
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Info */}
                <div
                  style={{
                    padding: "12px 14px 14px 14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    backgroundColor: isClosed ? "#F1F5F9" : "#FFFFFF",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                    <h3
                      style={{
                        fontSize: "0.98rem",
                        fontWeight: "700",
                        color: isClosed ? "#475569" : "#18181B",
                        margin: 0,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      className="dish-name"
                    >
                      {dish.name}
                    </h3>
                    {isClosed && (
                      <span style={{ fontSize: "9.5px", fontWeight: "700", color: "#64748B", backgroundColor: "#E2E8F0", padding: "1px 5px", borderRadius: "4px" }}>
                        CLOSED
                      </span>
                    )}
                  </div>

                  {/* Price, Distance & Delivery Time */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "4px" }}>
                    <span
                      style={{
                        fontSize: "0.82rem",
                        color: isClosed ? "#94A3B8" : "#64748B",
                        fontWeight: "500",
                      }}
                    >
                      {isClosed ? "Currently not accepting orders" : dish.time}
                    </span>
                    {dish.distanceText && !isClosed && (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: "700",
                          color: "#FF6B00",
                          backgroundColor: "#FFF3EB",
                          padding: "2px 6px",
                          borderRadius: "6px",
                        }}
                      >
                        📍 {dish.distanceText}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .dish-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08) !important;
        }
        .dish-card:hover .dish-card-img {
          transform: scale(1.05);
        }
        @media (max-width: 1024px) {
          .popular-dishes-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 14px !important;
          }
        }
        @media (max-width: 640px) {
          .popular-dishes-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 12px !important;
          }
          .dish-img-box {
            height: 110px !important;
          }
          .dish-name {
            font-size: 0.88rem !important;
          }
        }
      `}</style>
    </section>
  );
}
