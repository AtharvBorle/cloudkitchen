"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Star } from "lucide-react";
import styles from "./FoodHeroBanner.module.css";
import heroPhoto from "./FoodHeroPhoto.jpg";

export interface FoodHeroBannerProps {
  restaurantName?: string;
  location?: string;
  rating?: number;
  reviewsCount?: string;
  deliveryTime?: string;
  deliveryFeeText?: string;
  dietType?: string;
  offerText?: string;
  initialVegOnly?: boolean;
  onVegToggle?: (vegOnly: boolean) => void;
  isOnline?: boolean;
}

export const FoodHeroBanner: React.FC<FoodHeroBannerProps> = ({
  restaurantName = "Cloud Kitchen",
  location = "",
  rating = 4.5,
  reviewsCount,
  deliveryTime = "20-30 min",
  deliveryFeeText,
  dietType = "Pure Veg",
  offerText,
  initialVegOnly = false,
  onVegToggle,
  isOnline = true,
}) => {
  const [isVegOnly, setIsVegOnly] = useState<boolean>(initialVegOnly);

  const handleToggleVeg = () => {
    const nextState = !isVegOnly;
    setIsVegOnly(nextState);
    if (onVegToggle) {
      onVegToggle(nextState);
    }
  };

  return (
    <section className={styles.heroContainer} aria-label="Restaurant Hero Banner">
      {/* Closed Restaurant Alert Banner */}
      {!isOnline && (
        <div
          style={{
            width: "100%",
            backgroundColor: "#FEF2F2",
            border: "1.5px solid #FECACA",
            borderRadius: "16px",
            padding: "16px 22px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            boxShadow: "0 4px 16px rgba(239, 68, 68, 0.08)",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "24px" }}>🔴</span>
            <div>
              <h3 style={{ margin: "0 0 2px 0", fontSize: "1.05rem", fontWeight: "800", color: "#991B1B" }}>
                Store is Currently Closed
              </h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#DC2626" }}>
                This cloud kitchen is currently not accepting online orders. You can browse the menu items below.
              </p>
            </div>
          </div>
          <span
            style={{
              backgroundColor: "#DC2626",
              color: "#FFFFFF",
              fontSize: "0.78rem",
              fontWeight: "800",
              letterSpacing: "0.8px",
              padding: "6px 14px",
              borderRadius: "12px",
              textTransform: "uppercase",
            }}
          >
            Not Accepting Orders
          </span>
        </div>
      )}

      {/* Top Food Image Banner */}
      <div className={styles.imageWrapper}>
        <Image
          src={heroPhoto}
          alt={`${restaurantName} Food Spread`}
          fill
          priority
          sizes="(max-width: 1400px) 100vw, 1400px"
          className={styles.foodImage}
          style={{
            filter: !isOnline ? "grayscale(100%)" : "none",
          }}
        />
        <div className={styles.imageOverlayGradient} />
        {!isOnline && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.35)",
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
                fontSize: "14px",
                fontWeight: "800",
                letterSpacing: "1px",
                padding: "8px 20px",
                borderRadius: "20px",
                textTransform: "uppercase",
                boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              🔴 STORE CLOSED
            </span>
          </div>
        )}
      </div>

      {/* Restaurant Information Section */}
      <div className={styles.infoSection}>
        {/* Row 1: Restaurant Name & Location (Left) + Rating & Reviews (Right) */}
        <div className={styles.topRow}>
          <div className={styles.restaurantMain}>
            <h1 className={styles.restaurantName} style={{ color: !isOnline ? "#475569" : undefined }}>{restaurantName}</h1>
            {location && <span className={styles.locationText}>{location}</span>}
          </div>

          <div className={styles.ratingContainer}>
            <div className={styles.ratingBadge}>
              <Star size={13} fill="#16a34a" color="#16a34a" />
              <span>{rating}</span>
            </div>
            {reviewsCount && <span className={styles.reviewsCount}>{reviewsCount}</span>}
          </div>
        </div>

        {/* Row 2: Badges / Chips Row */}
        <div className={styles.badgesRow}>
          {!isOnline && (
            <span
              className={styles.metaChip}
              style={{
                backgroundColor: "#FEF2F2",
                color: "#DC2626",
                borderColor: "#FECACA",
                fontWeight: "800",
              }}
            >
              🔴 Closed
            </span>
          )}
          {deliveryTime && <span className={styles.metaChip}>{deliveryTime}</span>}
          {deliveryFeeText && (
            <span className={`${styles.metaChip} ${styles.freeDeliveryChip}`}>
              {deliveryFeeText}
            </span>
          )}
          {dietType && (
            <span className={`${styles.metaChip} ${styles.pureVegChip}`}>
              <span className={styles.pureVegDot}>●</span>
              <span>{dietType}</span>
            </span>
          )}
          {offerText && (
            <span className={`${styles.metaChip} ${styles.offerChip}`}>
              {offerText}
            </span>
          )}
        </div>

        {/* Row 3: Veg Toggle (Right-aligned) */}
        <div className={styles.bottomRow}>
          {/* Veg Toggle */}
          <div
            className={styles.vegToggleWrapper}
            onClick={handleToggleVeg}
            role="switch"
            aria-checked={isVegOnly}
            tabIndex={0}
            onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleToggleVeg();
              }
            }}
          >
            <span className={styles.vegLabel}>Veg</span>
            <div
              className={`${styles.switchTrack} ${
                isVegOnly ? styles.switchTrackActive : ""
              }`}
            >
              <div
                className={`${styles.switchThumb} ${
                  isVegOnly ? styles.switchThumbActive : ""
                }`}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FoodHeroBanner;
