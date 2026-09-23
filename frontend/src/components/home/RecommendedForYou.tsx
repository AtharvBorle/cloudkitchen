"use client";

import React from "react";
import Link from "next/link";
import { DietaryTag } from "@/components/common/DietaryTag";

export interface RecommendedDish {
  id: string;
  name: string;
  time: string;
  imageUrl: string;
  link?: string;
  itemType?: string;
  sellerIsOnline?: boolean;
  isAvailable?: boolean;
}

interface RecommendedForYouProps {
  title?: string;
  seeAllLink?: string;
  items?: RecommendedDish[];
}

export default function RecommendedForYou({
  title = "Recommended For You",
  seeAllLink = "/explore-desktop",
  items,
}: RecommendedForYouProps) {
  if (!items || items.length === 0) {
    return null;
  }
  return (
    <section
      style={{
        width: "100%",
        background: "transparent",
        padding: "0",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          width: "100%",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          boxSizing: "border-box",
        }}
      >
        {/* Header Row: Title + See All with distinct spacing */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "14px",
            width: "100%",
          }}
        >
          <h2
            style={{
              fontSize: "clamp(1.15rem, 2.3vw, 1.45rem)",
              fontWeight: "800",
              color: "#18181B",
              margin: 0,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            {title}
          </h2>

          <Link
            href={seeAllLink}
            style={{
              color: "#FF5500",
              fontSize: "0.92rem",
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
            gap: "16px",
            width: "100%",
            boxSizing: "border-box",
          }}
          className="rec-dishes-grid"
        >
          {items.slice(0, 4).map((dish) => {
            const isSellerClosed = dish.sellerIsOnline === false;
            const isItemUnavailable = dish.isAvailable === false;
            const isClosed = isSellerClosed || isItemUnavailable;

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
                  border: isClosed ? "1px solid #E2E8F0" : "1px solid #E2E8F0",
                  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
                  display: "flex",
                  flexDirection: "column",
                  cursor: "pointer",
                  transition: "transform 0.25s ease, box-shadow 0.25s ease",
                }}
                className="rec-card"
              >
                {/* Card Image */}
                <div
                  style={{
                    width: "100%",
                    height: "140px",
                    position: "relative",
                    overflow: "hidden",
                    backgroundColor: "#F8FAFC",
                  }}
                  className="rec-img-box"
                >
                  <div style={{ position: "absolute", top: "8px", left: "8px", zIndex: 2 }}>
                    <DietaryTag
                      itemType={
                        dish.itemType ||
                        (dish.name.toLowerCase().includes("chicken") ||
                        dish.name.toLowerCase().includes("wings") ||
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
                    className="rec-card-img"
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
                          fontSize: "9px",
                          fontWeight: "800",
                          letterSpacing: "0.6px",
                          padding: "3px 8px",
                          borderRadius: "10px",
                          textTransform: "uppercase",
                        }}
                      >
                        {isSellerClosed ? "CLOSED" : "UNAVAILABLE"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Info */}
                <div
                  style={{
                    padding: "10px 12px 12px 12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
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
                    className="rec-dish-name"
                  >
                    {dish.name}
                  </h3>

                  {/* Price & Delivery Time */}
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: isClosed ? "#94A3B8" : "#64748B",
                      fontWeight: "500",
                    }}
                  >
                    {dish.time}
                  </span>
                </div>
              </div>
            </Link>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .rec-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08) !important;
          border-color: #CBD5E1 !important;
        }
        .rec-card:hover .rec-card-img {
          transform: scale(1.05);
        }
        @media (max-width: 1024px) {
          .rec-dishes-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 14px !important;
          }
        }
        @media (max-width: 640px) {
          .rec-dishes-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 12px !important;
          }
          .rec-img-box {
            height: 110px !important;
          }
          .rec-dish-name {
            font-size: 0.88rem !important;
          }
        }
      `}</style>
    </section>
  );
}
