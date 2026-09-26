"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ticket } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { fetchApi } from "@/lib/fetch-api";
import { DietaryTag } from "@/components/common/DietaryTag";

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
  itemType?: string;
  sellerIsOnline?: boolean;
  isAvailable?: boolean;
}

interface PopularOrdersProps {
  title?: string;
  seeAllLink?: string;
  offers?: OfferCardData[];
}

export default function PopularOrders({
  title = "Today's Special Offers",
  seeAllLink = "/food-explore?offers=true",
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

  if (!offers || offers.length === 0) {
    return null;
  }

  const displayOffers = offers.map((off) => ({
    ...off,
    sellerId: off.sellerId && off.sellerId !== "k-1" && off.sellerId !== "k-3" ? off.sellerId : (activeSeller ? activeSeller.id : off.sellerId || "k-1"),
    sellerName: off.sellerName && off.sellerName !== "Chef Anjali's Gourmet Kitchen" && off.sellerName !== "Urban Spice Cloud Kitchen" ? off.sellerName : (activeSeller ? activeSeller.name : off.sellerName || "Verified Cloud Kitchen"),
  }));

  const [addedId, setAddedId] = useState<string | null>(null);

  const handleOrderNow = (offer: OfferCardData) => {
    if (offer.sellerIsOnline === false || offer.isAvailable === false) return;

    const rawStock = (offer as any).maxStock !== undefined ? (offer as any).maxStock : (offer as any).stockQuantity;
    const stockLimit = rawStock !== undefined && rawStock !== null && !isNaN(Number(rawStock)) ? Number(rawStock) : -1;

    addToCart({
      id: offer.id,
      foodItemId: offer.foodItemId || offer.id,
      name: offer.title,
      price: offer.price || 199,
      quantity: 1,
      sellerId: offer.sellerId || (activeSeller ? activeSeller.id : "k-1"),
      sellerName: offer.sellerName || (activeSeller ? activeSeller.name : "Verified Cloud Kitchen"),
      image: offer.imageUrl,
      imageUrl: offer.imageUrl,
      stockQuantity: stockLimit,
      maxStock: stockLimit,
    });
    setAddedId(offer.id);
    setTimeout(() => setAddedId(null), 1800);
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
          {displayOffers.map((offer) => {
            const isSellerClosed = offer.sellerIsOnline === false;
            const isItemUnavailable = offer.isAvailable === false;
            const isClosed = isSellerClosed || isItemUnavailable;

            return (
            <div
              key={offer.id}
              style={{
                width: "100%",
                height: "302px",
                borderRadius: "20px",
                padding: "16px",
                background: isClosed
                  ? "#F8FAFC"
                  : "linear-gradient(135deg, #FFDEB1 0%, #EEB06A 100%)",
                border: isClosed ? "1px solid #E2E8F0" : undefined,
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                boxSizing: "border-box",
                boxShadow: isClosed
                  ? "0 4px 12px rgba(0, 0, 0, 0.03)"
                  : "0 6px 20px rgba(238, 176, 106, 0.25)",
                transition: "transform 0.25s ease, box-shadow 0.25s ease",
                opacity: isClosed ? 0.85 : 1,
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
                    backgroundColor: isClosed ? "#E2E8F0" : "#FFFFFF",
                    color: isClosed ? "#64748B" : "#FF6B00",
                    fontSize: "0.78rem",
                    fontWeight: "800",
                    padding: "4px 12px",
                    borderRadius: "9999px",
                    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)",
                  }}
                >
                  {offer.discount}
                </div>

                <Ticket size={20} color={isClosed ? "#94A3B8" : "#EA580C"} strokeWidth={2.2} />
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
                <div style={{ position: "absolute", top: "8px", left: "8px", zIndex: 2 }}>
                  <DietaryTag
                    itemType={
                      offer.itemType ||
                      (offer.title.toLowerCase().includes("biryani") ||
                      offer.title.toLowerCase().includes("chicken")
                        ? "NON_VEG"
                        : "VEG")
                    }
                    size="xs"
                  />
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={offer.imageUrl}
                  alt={offer.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transition: "transform 0.3s ease",
                    filter: isClosed ? "grayscale(100%)" : "none",
                  }}
                  className="offer-img"
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
                      zIndex: 3,
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

              {/* Info: Title & Coupon Code */}
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <h3
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: "800",
                    color: isClosed ? "#64748B" : "#18181B",
                    margin: 0,
                  }}
                >
                  {offer.title}
                </h3>
                <span
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: "600",
                    color: isClosed ? "#94A3B8" : "#475569",
                  }}
                >
                  {offer.code}
                </span>
              </div>

              {/* Action Button: Order Now */}
              <button
                type="button"
                onClick={() => handleOrderNow(offer)}
                disabled={isClosed}
                style={{
                  marginTop: "auto",
                  backgroundColor: isClosed
                    ? "#F1F5F9"
                    : addedId === offer.id
                    ? "#10B981"
                    : "#FF6B00",
                  color: isClosed ? "#94A3B8" : "#FFFFFF",
                  border: isClosed ? "1px solid #E2E8F0" : "none",
                  borderRadius: "12px",
                  padding: "10px",
                  fontSize: "0.92rem",
                  fontWeight: "700",
                  cursor: isClosed ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: isClosed ? "none" : "0 4px 12px rgba(255, 107, 0, 0.25)",
                }}
              >
                {isClosed ? (isSellerClosed ? "Closed" : "Unavailable") : addedId === offer.id ? "Added to Cart! ✓" : "Order Now"}
              </button>
            </div>
            );
          })}
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
