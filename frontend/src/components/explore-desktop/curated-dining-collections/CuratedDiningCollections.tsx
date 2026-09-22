"use client";

import React, { useState } from "react";
import Image, { StaticImageData } from "next/image";
import { Heart } from "lucide-react";
import styles from "./CuratedDiningCollections.module.css";

import streetFoodImg from "./dining-street-food.jpg";
import comfortFoodImg from "./dining-comfort-food.jpg";
import freshSaladsImg from "./dining-fresh-salads.jpg";
import fineDiningImg from "./dining-fine-dining.jpg";
import sushiSashimiImg from "./dining-sushi-sashimi.jpg";
import mediterraneanMezzeImg from "./dining-mediterranean-mezze.jpg";
import morningFavouritesImg from "./dining-morning-favourites.jpg";
import steakhousePicksImg from "./dining-steakhouse-picks.jpg";

import { useRouter } from "next/navigation";

export interface DiningCollectionItem {
  id: string;
  badge: string;
  title: string;
  image: StaticImageData | string;
  kitchenId?: string;
}

export interface CuratedDiningCollectionsProps {
  heading?: string;
  items?: DiningCollectionItem[];
  onCardClick?: (item: DiningCollectionItem) => void;
  onWishlistToggle?: (itemId: string, isSaved: boolean) => void;
}

export const CuratedDiningCollections: React.FC<CuratedDiningCollectionsProps> = ({
  heading = "Featured Collections",
  items,
  onCardClick,
  onWishlistToggle,
}) => {
  const router = useRouter();
  const [savedItems, setSavedItems] = useState<{ [id: string]: boolean }>({});

  if (!items || items.length === 0) {
    return null;
  }

  const handleHeartClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSavedItems((prev) => {
      const nextState = !prev[id];
      if (onWishlistToggle) {
        onWishlistToggle(id, nextState);
      }
      return { ...prev, [id]: nextState };
    });
  };

  const handleItemClick = (item: DiningCollectionItem) => {
    if (onCardClick) {
      onCardClick(item);
    } else {
      const target = item.kitchenId || item.id;
      if (target.startsWith("SHOP-") || target.startsWith("shop-")) {
        router.push(`/shop/${target}`);
      } else {
        router.push(`/restaurant/${target}`);
      }
    }
  };

  return (
    <section className={styles.sectionContainer} aria-label={heading}>
      {/* Section Heading */}
      <h2 className={styles.heading}>{heading}</h2>

      {/* 4-Column x 2-Row Dining Cards Grid */}
      <div className={styles.cardsGrid}>
        {items.map((item) => {
          const isLiked = !!savedItems[item.id];
          return (
            <article
              key={item.id}
              className={styles.diningCard}
              onClick={() => handleItemClick(item)}
              tabIndex={0}
              role="button"
              aria-label={item.title}
            >
              {/* Background Food Image */}
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="(max-width: 1400px) 25vw, 350px"
                className={styles.cardBgImage}
              />

              {/* Dark Gradient Overlay for Contrast */}
              <div className={styles.gradientOverlay} />

              {/* Top Row: Pill Badge + Wishlist Heart */}
              <div className={styles.topRow}>
                <span className={styles.pillBadge}>{item.badge}</span>

                <button
                  type="button"
                  className={`${styles.wishlistBtn} ${
                    isLiked ? styles.wishlistBtnActive : ""
                  }`}
                  onClick={(e) => handleHeartClick(e, item.id)}
                  aria-label={`Save ${item.title} to wishlist`}
                >
                  <Heart
                    size={20}
                    color={isLiked ? "#ef4444" : "#ffffff"}
                    fill={isLiked ? "#ef4444" : "none"}
                    strokeWidth={2}
                  />
                </button>
              </div>

              {/* Bottom Row: Food Title */}
              <div className={styles.bottomArea}>
                <h3 className={styles.cardTitle}>{item.title}</h3>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default CuratedDiningCollections;
