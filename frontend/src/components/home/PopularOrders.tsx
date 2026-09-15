"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ticket } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { fetchApi } from "@/lib/fetch-api";

export interface OfferCardData {
  id: string;
  discount: string;
  title: string;
  code: string;
  imageUrl: string;
  link: string;
  price?: number;
  sellerId?: string;
  sellerName?: string;
  foodItemId?: string;
}

const OFFERS: OfferCardData[] = [
  {
    id: "fb-4",
    discount: "30% OFF",
    title: "Biryani Bonanza",
    code: "Use code: BIRYANI30",
    imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80",
    link: "/shop/urban-spice",
    price: 349,
    sellerId: "k-3",
    sellerName: "Urban Spice Cloud Kitchen",
    foodItemId: "fb-4",
  },
  {
    id: "fb-8",
    discount: "25% OFF",
    title: "Burger Bash",
    code: "Use code: BURGER25",
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80",
    link: "/shop/urban-spice",
    price: 149,
    sellerId: "k-3",
    sellerName: "Urban Spice Cloud Kitchen",
    foodItemId: "fb-8",
  },
  {
    id: "fb-1",
    discount: "30% OFF",
    title: "Pizza Party",
    code: "Use code: PIZZA30",
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80",
    link: "/shop/chef-anjali",
    price: 289,
    sellerId: "k-1",
    sellerName: "Chef Anjali's Gourmet Kitchen",
    foodItemId: "fb-1",
  },
  {
    id: "fb-5",
    discount: "20% OFF",
    title: "Noodle Fest",
    code: "Use code: NOODLE20",
    imageUrl: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&auto=format&fit=crop&q=80",
    link: "/shop/chef-anjali",
    price: 159,
    sellerId: "k-1",
    sellerName: "Chef Anjali's Gourmet Kitchen",
    foodItemId: "fb-5",
  },
];

interface PopularOrdersProps {
  title?: string;
  seeAllLink?: string;
  offers?: OfferCardData[];
}

export default function PopularOrders({
  title = "Today's Special Offers",
  seeAllLink = "/explore?offers=true",
  offers,
}: PopularOrdersProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [activeSeller, setActiveSeller] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    async function loadActiveSeller() {
      try {
        const res = await fetchApi("/api/public/explore");
        if (res.ok) {
          const data = await res.json();
          const sellers = data.data?.sellers || data.sellers || [];
          if (Array.isArray(sellers) && sellers.length > 0) {
            setActiveSeller({
              id: sellers[0].id || sellers[0].trackingId,
              name: sellers[0].name || sellers[0].businessName || "Verified Cloud Kitchen",
            });
          }
        }
      } catch {
        // Continue
      }
    }
    loadActiveSeller();
  }, []);

  const displayOffers = (offers && offers.length > 0 ? offers : OFFERS).map((off) => ({
    ...off,
    sellerId: off.sellerId && off.sellerId !== "k-1" && off.sellerId !== "k-3" ? off.sellerId : (activeSeller ? activeSeller.id : off.sellerId || "k-1"),
    sellerName: off.sellerName && off.sellerName !== "Chef Anjali's Gourmet Kitchen" && off.sellerName !== "Urban Spice Cloud Kitchen" ? off.sellerName : (activeSeller ? activeSeller.name : off.sellerName || "Verified Cloud Kitchen"),
  }));

  const handleOrderNow = (offer: OfferCardData) => {
    addToCart({
      id: offer.id,
      foodItemId: offer.foodItemId || offer.id,
      name: offer.title,
      price: offer.price || 199,
      quantity: 1,
      sellerId: offer.sellerId || (activeSeller ? activeSeller.id : "k-1"),
      sellerName: offer.sellerName || (activeSeller ? activeSeller.name : "Verified Cloud Kitchen"),
      image: offer.imageUrl,
    });
    router.push("/user/cart");
  };

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
          {displayOffers.map((offer) => (
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
                    color: "#FF6B00",
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
              <button
                type="button"
                onClick={() => handleOrderNow(offer)}
                style={{
                  marginTop: "auto",
                  backgroundColor: "#FF6B00",
                  color: "#FFFFFF",
                  fontSize: "0.92rem",
                  fontWeight: "700",
                  padding: "9px 0",
                  borderRadius: "12px",
                  textAlign: "center",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(255, 107, 0, 0.25)",
                  transition: "all 0.2s ease",
                  display: "block",
                  width: "100%",
                }}
                className="offer-order-btn"
              >
                Order Now
              </button>
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
          background-color: #E65F00 !important;
        }
        @media (max-width: 1024px) {
          .offers-grid-layout {
            display: flex !important;
            flex-direction: row !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            gap: 14px !important;
            padding-bottom: 6px !important;
            scroll-snap-type: x mandatory;
          }
          .offers-grid-layout::-webkit-scrollbar {
            display: none;
          }
          .offer-card {
            flex: 0 0 200px !important;
            width: 200px !important;
            min-width: 200px !important;
            scroll-snap-align: start;
          }
        }
      `}</style>
    </section>
  );
}
