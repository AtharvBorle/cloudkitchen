"use client";

import React from "react";
import Link from "next/link";
import { Star } from "lucide-react";

export interface DishItem {
  id: string;
  name: string;
  rating: number;
  time: string;
  imageUrl: string;
  link?: string;
}

const POPULAR_DISHES: DishItem[] = [
  {
    id: "dish-1",
    name: "Chicken Tikka Masala",
    rating: 4.8,
    time: "₹120 • 25 min",
    imageUrl: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&auto=format&fit=crop&q=80",
    link: "/restaurant/spice-biryani",
  },
  {
    id: "dish-2",
    name: "Veg Momos",
    rating: 4.7,
    time: "₹125 • 15 min",
    imageUrl: "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=500&auto=format&fit=crop&q=80",
    link: "/restaurant/spice-biryani",
  },
  {
    id: "dish-3",
    name: "Garlic Butter Naan",
    rating: 4.9,
    time: "₹20 • 10 min",
    imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80",
    link: "/restaurant/spice-biryani",
  },
  {
    id: "dish-4",
    name: "Chicken Biryani",
    rating: 4.6,
    time: "₹170 • 20 min",
    imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80",
    link: "/restaurant/spice-biryani",
  },
];

interface BestPlacesProps {
  title?: string;
  seeAllLink?: string;
  dishes?: DishItem[];
}

export default function BestPlaces({
  title = "Popular Dishes",
  seeAllLink = "/explore-desktop",
  dishes = POPULAR_DISHES,
}: BestPlacesProps) {
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
            gap: "12px",
          }}
        >
          <h2
            style={{
              fontSize: "clamp(1.2rem, 2.5vw, 1.55rem)",
              fontWeight: "800",
              color: "#18181B",
              margin: 0,
              letterSpacing: "-0.02em",
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
            gap: "20px",
            width: "100%",
          }}
          className="popular-dishes-grid"
        >
          {dishes.slice(0, 4).map((dish) => (
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
                    className="dish-card-img"
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
                    className="dish-name"
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
