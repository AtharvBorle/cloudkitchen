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
    name: "Pizza Palace",
    rating: 4.8,
    time: "25-35 min",
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80",
    link: "/explore/food?query=pizza",
  },
  {
    id: "dish-2",
    name: "Spice Biryani",
    rating: 4.7,
    time: "20-30 min",
    imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80",
    link: "/explore/food?query=biryani",
  },
  {
    id: "dish-3",
    name: "Sushi Hub",
    rating: 4.9,
    time: "30-40 min",
    imageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&auto=format&fit=crop&q=80",
    link: "/explore/food?query=sushi",
  },
  {
    id: "dish-4",
    name: "Baker Delight",
    rating: 4.6,
    time: "15-25 min",
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80",
    link: "/explore/food?query=bakery",
  },
];

interface BestPlacesProps {
  title?: string;
  seeAllLink?: string;
  dishes?: DishItem[];
}

export default function BestPlaces({
  title = "Popular Dishes",
  seeAllLink = "/explore/food",
  dishes = POPULAR_DISHES,
}: BestPlacesProps) {
  return (
    <section
      style={{
        width: "100%",
        backgroundColor: "#FFFFFF",
        padding: "24px 16px 48px 16px",
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

        {/* Place Grid: 4 Cards Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "24px",
            width: "100%",
          }}
          className="popular-dishes-grid"
        >
          {dishes.map((dish) => (
            <Link
              key={dish.id}
              href={dish.link || "/explore/food"}
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
                    height: "160px",
                    position: "relative",
                    overflow: "hidden",
                    backgroundColor: "#F8FAFC",
                  }}
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
                    padding: "14px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1.05rem",
                      fontWeight: "700",
                      color: "#18181B",
                      margin: 0,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {dish.name}
                  </h3>

                  {/* Rating & Delivery Time Meta Row */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    {/* Green Star Rating Pill */}
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        backgroundColor: "#ECFDF5",
                        color: "#10B981",
                        border: "1px solid rgba(16, 185, 129, 0.2)",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "0.82rem",
                        fontWeight: "700",
                      }}
                    >
                      <Star size={13} fill="#10B981" color="#10B981" />
                      <span>{dish.rating.toFixed(1)}</span>
                    </div>

                    {/* Delivery Time */}
                    <span
                      style={{
                        fontSize: "0.85rem",
                        color: "#64748B",
                        fontWeight: "500",
                      }}
                    >
                      {dish.time}
                    </span>
                  </div>
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
          }
        }
        @media (max-width: 580px) {
          .popular-dishes-grid {
            grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
          }
        }
      `}</style>
    </section>
  );
}
