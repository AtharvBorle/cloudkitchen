"use client";

import React from "react";
import Link from "next/link";
import { Star } from "lucide-react";

export interface TopRatedItem {
  id: string;
  name: string;
  rating: number;
  category: string;
  price: number;
  time: string;
  imageUrl: string;
  link?: string;
}

const TOP_RATED_ITEMS: TopRatedItem[] = [
  {
    id: "tr-1",
    name: "Green Leaf Salad",
    rating: 4.9,
    category: "Healthy",
    price: 199,
    time: "20-30 min",
    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&auto=format&fit=crop&q=80",
    link: "/restaurant/fresh-salads",
  },
  {
    id: "tr-2",
    name: "Classic Chicken Burger",
    rating: 4.8,
    category: "Burgers",
    price: 249,
    time: "25-35 min",
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80",
    link: "/restaurant/burger-bistro",
  },
  {
    id: "tr-3",
    name: "Green Leaf Salad",
    rating: 4.9,
    category: "Healthy",
    price: 199,
    time: "20-30 min",
    imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80",
    link: "/restaurant/fresh-salads",
  },
  {
    id: "tr-4",
    name: "Classic Chicken Burger",
    rating: 4.8,
    category: "Burgers",
    price: 249,
    time: "25-35 min",
    imageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&auto=format&fit=crop&q=80",
    link: "/restaurant/burger-bistro",
  },
  {
    id: "tr-5",
    name: "Green Leaf Salad",
    rating: 4.9,
    category: "Healthy",
    price: 199,
    time: "20-30 min",
    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&auto=format&fit=crop&q=80",
    link: "/restaurant/fresh-salads",
  },
  {
    id: "tr-6",
    name: "Classic Chicken Burger",
    rating: 4.8,
    category: "Burgers",
    price: 249,
    time: "25-35 min",
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80",
    link: "/restaurant/burger-bistro",
  },
];

interface DashboardBodyProps {
  title?: string;
  seeAllLink?: string;
  items?: TopRatedItem[];
}

export default function DashboardBody({
  title = "Top Rated",
  seeAllLink = "/explore-desktop?sort=top_rated",
  items,
}: DashboardBodyProps) {
  const displayItems = items && items.length > 0 ? items : TOP_RATED_ITEMS;

  return (
    <section
      style={{
        width: "100%",
        background: "transparent",
        padding: "0",
        boxSizing: "border-box",
      }}
      className="dashboard-body-wrapper"
    >
      <div
        style={{
          maxWidth: "1280px",
          width: "100%",
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
              color: "#FF6B00",
              fontSize: "0.95rem",
              fontWeight: "700",
              textDecoration: "none",
              transition: "color 0.2s ease",
            }}
          >
            See all
          </Link>
        </div>

        {/* Top Rated 2-Column Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "16px",
            width: "100%",
          }}
          className="top-rated-grid"
        >
          {displayItems.map((item) => (
            <div
              key={item.id}
              style={{
                width: "100%",
                minHeight: "101px",
                borderRadius: "16px",
                border: "1px solid #E2E8F0",
                backgroundColor: "#FFFFFF",
                padding: "12px 16px 12px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "14px",
                boxSizing: "border-box",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
                transition: "all 0.2s ease",
              }}
              className="top-rated-card"
            >
              {/* Left Column: Food Thumbnail + Info */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  flex: "1 1 auto",
                  overflow: "hidden",
                }}
              >
                {/* Thumbnail Image */}
                <div
                  style={{
                    width: "76px",
                    height: "76px",
                    minWidth: "76px",
                    borderRadius: "12px",
                    overflow: "hidden",
                    backgroundColor: "#F1F5F9",
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
                    }}
                  />
                </div>

                {/* Details */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    overflow: "hidden",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1rem",
                      fontWeight: "700",
                      color: "#18181B",
                      margin: 0,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.name}
                  </h3>

                  {/* Stars, Category & Price */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={13}
                          fill="#F59E0B"
                          color="#F59E0B"
                        />
                      ))}
                    </div>

                    <span
                      style={{
                        fontSize: "0.82rem",
                        color: "#64748B",
                        fontWeight: "500",
                      }}
                    >
                      {item.rating} • {item.category} • ₹{item.price}
                    </span>
                  </div>

                  {/* Delivery Time */}
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "#94A3B8",
                      fontWeight: "500",
                    }}
                  >
                    {item.time}
                  </span>
                </div>
              </div>

              {/* Right Column: Order Button */}
              <Link
                href={item.link || "/explore-desktop"}
                style={{
                  backgroundColor: "#FF6B00",
                  color: "#FFFFFF",
                  fontSize: "0.88rem",
                  fontWeight: "700",
                  padding: "8px 24px",
                  borderRadius: "9999px",
                  textDecoration: "none",
                  boxShadow: "0 3px 10px rgba(255, 107, 0, 0.25)",
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
                className="top-rated-order-btn"
              >
                Order
              </Link>
            </div>
          ))}
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
          .dashboard-body-wrapper {
            padding: 32px 24px !important;
          }
          .top-rated-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 640px) {
          .dashboard-body-wrapper {
            padding: 24px 16px !important;
          }
          .top-rated-card {
            padding: 10px !important;
          }
        }
      `}</style>
    </section>
  );
}
