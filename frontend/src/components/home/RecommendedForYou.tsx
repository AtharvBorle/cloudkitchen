"use client";

import React from "react";
import Link from "next/link";

export interface RecommendedDish {
  id: string;
  name: string;
  time: string;
  imageUrl: string;
  link?: string;
}

const RECOMMENDED_DISHES: RecommendedDish[] = [
  {
    id: "rec-1",
    name: "Creamy Pasta",
    time: "₹329 • 20 min",
    imageUrl: "https://images.unsplash.com/photo-1621996346565-e3adc6d6d1b9?w=500&auto=format&fit=crop&q=80",
    link: "/explore-desktop",
  },
  {
    id: "rec-2",
    name: "Chicken Wings",
    time: "₹119 • 20 min",
    imageUrl: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=500&auto=format&fit=crop&q=80",
    link: "/explore-desktop",
  },
  {
    id: "rec-3",
    name: "Iced Latte",
    time: "₹135 • 10 min",
    imageUrl: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&auto=format&fit=crop&q=80",
    link: "/explore-desktop",
  },
  {
    id: "rec-4",
    name: "Chocolate Brownie",
    time: "₹150 • 15 min",
    imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=80",
    link: "/explore-desktop",
  },
];

interface RecommendedForYouProps {
  title?: string;
  seeAllLink?: string;
  items?: RecommendedDish[];
}

export default function RecommendedForYou({
  title = "Recommended For You",
  seeAllLink = "/explore-desktop",
  items = RECOMMENDED_DISHES,
}: RecommendedForYouProps) {
  return (
    <section
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
          minHeight: "303px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          boxSizing: "border-box",
        }}
      >
        {/* Header Row: Title + See All */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2
            style={{
              fontSize: "1.55rem",
              fontWeight: "800",
              color: "#18181B",
              margin: 0,
              letterSpacing: "-0.3px",
            }}
          >
            {title}
          </h2>

          <Link
            href={seeAllLink}
            style={{
              color: "#FF5500",
              fontSize: "0.95rem",
              fontWeight: "700",
              textDecoration: "none",
              transition: "color 0.2s ease",
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
          className="rec-dishes-grid"
        >
          {items.slice(0, 4).map((dish) => (
            <Link
              key={dish.id}
              href={dish.link || "/explore-desktop"}
              style={{
                textDecoration: "none",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  width: "100%",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: "1px solid #F1F5F9",
                  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
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
                    height: "150px",
                    position: "relative",
                    overflow: "hidden",
                    backgroundColor: "#F8FAFC",
                  }}
                  className="rec-img-box"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={dish.imageUrl}
                    alt={dish.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "transform 0.3s ease",
                    }}
                    className="rec-card-img"
                  />
                </div>

                {/* Card Info */}
                <div
                  style={{
                    padding: "12px 14px 14px 14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "0.98rem",
                      fontWeight: "700",
                      color: "#18181B",
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
                      fontSize: "0.82rem",
                      color: "#64748B",
                      fontWeight: "500",
                    }}
                  >
                    {dish.time}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <style jsx>{`
        .rec-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08) !important;
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
