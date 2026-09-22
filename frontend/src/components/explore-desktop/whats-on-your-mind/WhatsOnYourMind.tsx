"use client";

import React from "react";
import Image, { StaticImageData } from "next/image";
import styles from "./WhatsOnYourMind.module.css";

import breakfastIcon from "./icon-breakfast.png";
import lunchIcon from "./icon-lunch.png";
import dinnerIcon from "./icon-dinner.png";
import snacksIcon from "./icon-snacks.png";
import lateNightIcon from "./icon-latenight.png";
import drinksIcon from "./icon-drinks.png";
import dessertsIcon from "./icon-desserts.png";
import healthyIcon from "./icon-healthy.png";
import { useRouter } from "next/navigation";

export interface MealMomentItem {
  id: string;
  badge: string;
  title: string;
  icon: StaticImageData | string;
  bgClass: string;
  kitchenId?: string;
  categoryQuery?: string;
  hasWhiteBadge?: boolean;
}

export interface WhatsOnYourMindProps {
  heading?: string;
  subheading?: string;
  moments?: MealMomentItem[];
  onMomentClick?: (moment: MealMomentItem) => void;
}

export const WhatsOnYourMind: React.FC<WhatsOnYourMindProps> = ({
  heading = "What's on Your Mind?",
  subheading = "Pick a meal moment to explore curated options.",
  moments,
  onMomentClick,
}) => {
  const router = useRouter();

  if (!moments || moments.length === 0) {
    return null;
  }

  const handleCardClick = (moment: MealMomentItem) => {
    if (onMomentClick) {
      onMomentClick(moment);
    } else if (moment.categoryQuery) {
      router.push(`/explore-desktop?category=${encodeURIComponent(moment.categoryQuery.toLowerCase())}`);
    } else {
      const target = moment.kitchenId || "7-12-kitchen";
      if (target.startsWith("SHOP-") || target.startsWith("shop-")) {
        router.push(`/shop/${target}`);
      } else {
        router.push(`/restaurant/${target}`);
      }
    }
  };

  return (
    <section className={styles.sectionContainer} aria-label={heading}>
      <h2 className={styles.heading}>{heading}</h2>
      <p className={styles.subheading}>{subheading}</p>

      <div className={styles.cardsGrid} role="region" aria-label="Meal Moments">
        {moments.map((moment) => (
          <article
            key={moment.id}
            className={`${styles.momentCard} ${moment.bgClass}`}
            onClick={() => handleCardClick(moment)}
            tabIndex={0}
            role="button"
            aria-label={`${moment.title} - ${moment.badge}`}
          >
            {/* Top Pill Badge */}
            <div className={styles.topRow}>
              <span className={styles.pillBadge}>{moment.badge}</span>
            </div>

            {/* Bottom Icon + Title */}
            <div className={styles.bottomRow}>
              <div className={styles.iconWrapper}>
                <Image
                  src={moment.icon}
                  alt={moment.title}
                  fill
                  sizes="44px"
                  className={styles.foodIconImg}
                />
              </div>
              <h3 className={styles.cardTitle}>{moment.title}</h3>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default WhatsOnYourMind;
