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
}

export const FoodHeroBanner: React.FC<FoodHeroBannerProps> = ({
  restaurantName = "7/12 Kitchen",
  location = "Near Kothrud, Maharishi Society, Pune",
  rating = 4.2,
  reviewsCount = "(240+ reviews)",
  deliveryTime = "25 min",
  deliveryFeeText = "Free Delivery",
  dietType = "Pure Veg",
  offerText = "30% OFF up to ₹150",
  initialVegOnly = true,
  onVegToggle,
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
      {/* Top Food Image Banner */}
      <div className={styles.imageWrapper}>
        <Image
          src={heroPhoto}
          alt={`${restaurantName} Food Spread`}
          fill
          priority
          sizes="(max-width: 1400px) 100vw, 1400px"
          className={styles.foodImage}
        />
        <div className={styles.imageOverlayGradient} />
      </div>

      {/* Restaurant Information Section */}
      <div className={styles.infoSection}>
        {/* Row 1: Restaurant Name & Location (Left) + Rating & Reviews (Right) */}
        <div className={styles.topRow}>
          <div className={styles.restaurantMain}>
            <h1 className={styles.restaurantName}>{restaurantName}</h1>
            <span className={styles.locationText}>{location}</span>
          </div>

          <div className={styles.ratingContainer}>
            <div className={styles.ratingBadge}>
              <Star size={13} fill="#16a34a" color="#16a34a" />
              <span>{rating}</span>
            </div>
            <span className={styles.reviewsCount}>{reviewsCount}</span>
          </div>
        </div>

        {/* Row 2: Badges / Chips Row */}
        <div className={styles.badgesRow}>
          <span className={styles.metaChip}>{deliveryTime}</span>
          <span className={`${styles.metaChip} ${styles.freeDeliveryChip}`}>
            {deliveryFeeText}
          </span>
          <span className={`${styles.metaChip} ${styles.pureVegChip}`}>
            <span className={styles.pureVegDot}>●</span>
            <span>{dietType}</span>
          </span>
          <span className={`${styles.metaChip} ${styles.offerChip}`}>
            {offerText}
          </span>
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
