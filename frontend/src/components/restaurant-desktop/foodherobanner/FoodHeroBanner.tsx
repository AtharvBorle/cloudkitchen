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
  isVegOnly?: boolean;
  onVegToggle?: (vegOnly: boolean) => void;
  isOnline?: boolean;
  bannerImageUrl?: string;
}

export const FoodHeroBanner: React.FC<FoodHeroBannerProps> = ({
  restaurantName = "Cloud Kitchen",
  location = "",
  rating = 0,
  reviewsCount,
  deliveryTime = "20-30 min",
  deliveryFeeText,
  dietType = "Pure Veg",
  offerText,
  initialVegOnly,
  isVegOnly: controlledVegOnly,
  onVegToggle,
  isOnline = true,
  bannerImageUrl,
}) => {
  const [internalVegOnly, setInternalVegOnly] = useState<boolean>(
    controlledVegOnly !== undefined
      ? controlledVegOnly
      : initialVegOnly !== undefined
      ? initialVegOnly
      : false
  );

  const isVegOnly =
    controlledVegOnly !== undefined
      ? controlledVegOnly
      : initialVegOnly !== undefined
      ? initialVegOnly
      : internalVegOnly;

  const handleToggleVeg = () => {
    const nextState = !isVegOnly;
    setInternalVegOnly(nextState);
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
          src={bannerImageUrl || heroPhoto}
          alt={`${restaurantName} Food Spread`}
          fill
          priority
          unoptimized={Boolean(bannerImageUrl)}
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
            {(() => {
              const ratingNum = typeof rating === "number" ? rating : parseFloat(String(rating || "0")) || 0;
              const hasRating = ratingNum > 0;

              return (
                <div
                  className={styles.ratingBadge}
                  style={{
                    backgroundColor: hasRating ? "#DCFCE7" : "#F1F5F9",
                    borderColor: hasRating ? "#BBF7D0" : "#E2E8F0",
                    color: hasRating ? "#15803D" : "#64748B",
                  }}
                >
                  <Star
                    size={13}
                    fill={hasRating ? "#16a34a" : "#94A3B8"}
                    color={hasRating ? "#16a34a" : "#94A3B8"}
                  />
                  <span>{hasRating ? ratingNum.toFixed(1) : "New"}</span>
                </div>
              );
            })()}
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
            (() => {
              const lower = dietType.toLowerCase();
              const isBoth = lower.includes("&") || (lower.includes("veg") && lower.includes("non"));
              const isPureVeg = !isBoth && (lower.includes("pure") || lower === "veg" || lower.includes("pure veg") || lower.includes("🥦"));

              if (isBoth) {
                return (
                  <span
                    className={styles.metaChip}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      backgroundColor: "#FFFBEB",
                      border: "1px solid #FEF3C7",
                      padding: "5px 12px",
                      borderRadius: "6px",
                      fontWeight: "700",
                      fontSize: "0.82rem",
                    }}
                  >
                    <span style={{ color: "#16A34A", display: "inline-flex", alignItems: "center", gap: "3px", fontWeight: "800" }}>
                      <span style={{ fontSize: "0.65rem", lineHeight: 1 }}>●</span> Veg
                    </span>
                    <span style={{ color: "#D97706", fontWeight: "800", fontSize: "0.85rem", margin: "0 1px" }}>&</span>
                    <span style={{ color: "#DC2626", display: "inline-flex", alignItems: "center", gap: "3px", fontWeight: "800" }}>
                      <span style={{ fontSize: "0.65rem", lineHeight: 1 }}>●</span> Non-Veg
                    </span>
                  </span>
                );
              }

              if (isPureVeg) {
                return (
                  <span
                    className={styles.metaChip}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      backgroundColor: "#F0FDF4",
                      border: "1px solid #BBF7D0",
                      color: "#16A34A",
                      padding: "5px 12px",
                      borderRadius: "6px",
                      fontWeight: "700",
                      fontSize: "0.82rem",
                    }}
                  >
                    <span style={{ color: "#16A34A", fontSize: "0.75rem", lineHeight: 1 }}>●</span>
                    <span>Pure Veg</span>
                  </span>
                );
              }

              return (
                <span
                  className={styles.metaChip}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    backgroundColor: "#FEF2F2",
                    border: "1px solid #FECACA",
                    color: "#DC2626",
                    padding: "5px 12px",
                    borderRadius: "6px",
                    fontWeight: "700",
                    fontSize: "0.82rem",
                  }}
                >
                  <span style={{ color: "#DC2626", fontSize: "0.75rem", lineHeight: 1 }}>●</span>
                  <span>Non-Veg</span>
                </span>
              );
            })()
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
