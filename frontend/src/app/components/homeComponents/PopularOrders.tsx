"use client";

import React from "react";
import Link from "next/link";
import { Ticket } from "lucide-react";

export interface OfferCardData {
  id: string;
  discount: string;
  title: string;
  code: string;
  imageUrl: string;
  link: string;
}

const OFFERS: OfferCardData[] = [
  {
    id: "offer-1",
    discount: "25% OFF",
    title: "Burger Bash",
    code: "Use code: BURGER25",
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80",
    link: "/explore/food?query=burger",
  },
  {
    id: "offer-2",
    discount: "30% OFF",
    title: "Pizza Party",
    code: "Use code: PIZZA30",
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80",
    link: "/explore/food?query=pizza",
  },
  {
    id: "offer-3",
    discount: "20% OFF",
    title: "Noodle Fest",
    code: "Use code: NOODLE20",
    imageUrl: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&auto=format&fit=crop&q=80",
    link: "/explore/food?query=noodles",
  },
  {
    id: "offer-4",
    discount: "30% OFF",
    title: "Pizza Party",
    code: "Use code: PIZZA30",
    imageUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&auto=format&fit=crop&q=80",
    link: "/explore/food?query=pizza",
  },
];

interface PopularOrdersProps {
  title?: string;
  seeAllLink?: string;
  offers?: OfferCardData[];
}

export default function PopularOrders({
  title = "Today's Special Offers",
  seeAllLink = "/explore/food?offers=true",
  offers = OFFERS,
}: PopularOrdersProps) {
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
          minHeight: "346px",
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

        {/* Offers Row: 4 Offer Banner Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "20px",
            width: "100%",
          }}
          className="offers-grid-layout"
        >
          {offers.map((offer) => (
            <div
              key={offer.id}
              style={{
                width: "100%",
                height: "302px",
                borderRadius: "20px",
                padding: "16px",
                background: "linear-gradient(135deg, #FFDEB1 0%, #EEB06A 100%)",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                boxSizing: "border-box",
                boxShadow: "0 6px 20px rgba(238, 176, 106, 0.25)",
                transition: "transform 0.25s ease, box-shadow 0.25s ease",
              }}
              className="offer-card"
            >
              {/* Top Row: Discount Badge & Coupon Icon */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#FFFFFF",
                    color: "#FF5500",
                    fontSize: "0.78rem",
                    fontWeight: "800",
                    padding: "4px 12px",
                    borderRadius: "9999px",
                    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)",
                  }}
                >
                  {offer.discount}
                </div>

                <Ticket size={20} color="#EA580C" strokeWidth={2.2} />
              </div>

              {/* Food Image */}
              <div
                style={{
                  width: "100%",
                  height: "125px",
                  borderRadius: "14px",
                  overflow: "hidden",
                  position: "relative",
                  backgroundColor: "#FFFFFF",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={offer.imageUrl}
                  alt={offer.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transition: "transform 0.3s ease",
                  }}
                  className="offer-img"
                />
              </div>

              {/* Info: Title & Coupon Code */}
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <h3
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: "800",
                    color: "#18181B",
                    margin: 0,
                  }}
                >
                  {offer.title}
                </h3>
                <span
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: "600",
                    color: "#475569",
                  }}
                >
                  {offer.code}
                </span>
              </div>

              {/* Action Button: Order Now */}
              <Link
                href={offer.link}
                style={{
                  marginTop: "auto",
                  backgroundColor: "#FF5500",
                  color: "#FFFFFF",
                  fontSize: "0.92rem",
                  fontWeight: "700",
                  padding: "9px 0",
                  borderRadius: "12px",
                  textAlign: "center",
                  textDecoration: "none",
                  boxShadow: "0 4px 12px rgba(255, 85, 0, 0.25)",
                  transition: "all 0.2s ease",
                  display: "block",
                }}
                className="offer-order-btn"
              >
                Order Now
              </Link>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .offer-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(238, 176, 106, 0.4) !important;
        }
        .offer-card:hover .offer-img {
          transform: scale(1.05);
        }
        .offer-order-btn:hover {
          background-color: #E64D00 !important;
        }
        @media (max-width: 1024px) {
          .offers-grid-layout {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 580px) {
          .offers-grid-layout {
            grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
          }
        }
      `}</style>
    </section>
  );
}
