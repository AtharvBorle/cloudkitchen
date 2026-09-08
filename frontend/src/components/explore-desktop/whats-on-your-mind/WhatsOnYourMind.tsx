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
  hasWhiteBadge?: boolean;
}

const DEFAULT_MOMENTS: MealMomentItem[] = [
  {
    id: "moment-1",
    badge: "Morning Favorites",
    title: "Breakfast",
    icon: breakfastIcon,
    bgClass: styles.bgBreakfast,
    kitchenId: "baker-delight",
  },
  {
    id: "moment-2",
    badge: "Midday Boost",
    title: "Lunch",
    icon: lunchIcon,
    bgClass: styles.bgLunch,
    kitchenId: "7-12-kitchen",
  },
  {
    id: "moment-3",
    badge: "Evening Comfort",
    title: "Dinner",
    icon: dinnerIcon,
    bgClass: styles.bgDinner,
    kitchenId: "chef-arjun",
  },
  {
    id: "moment-4",
    badge: "Anytime Nibbles",
    title: "Snacks",
    icon: snacksIcon,
    bgClass: styles.bgSnacks,
    kitchenId: "street-food-specials",
  },
  {
    id: "moment-5",
    badge: "Midnight Cravings",
    title: "Late Night",
    icon: lateNightIcon,
    bgClass: styles.bgLateNight,
    kitchenId: "pizza-palace",
  },
  {
    id: "moment-6",
    badge: "Chilled Refreshments",
    title: "Drinks",
    icon: drinksIcon,
    bgClass: styles.bgDrinks,
    kitchenId: "dessert-bar",
  },
  {
    id: "moment-7",
    badge: "Sweet Indulgences",
    title: "Desserts",
    icon: dessertsIcon,
    bgClass: styles.bgDesserts,
    kitchenId: "baker-delight",
  },
  {
    id: "moment-8",
    badge: "Macro Friendly",
    title: "Super Healthy",
    icon: healthyIcon,
    bgClass: styles.bgHealthy,
    kitchenId: "fresh-salads",
  },
];

export interface WhatsOnYourMindProps {
  heading?: string;
  subheading?: string;
  moments?: MealMomentItem[];
  onMomentClick?: (moment: MealMomentItem) => void;
}

export const WhatsOnYourMind: React.FC<WhatsOnYourMindProps> = ({
  heading = "What's on Your Mind?",
  subheading = "Pick a meal moment to explore curated options.",
  moments = DEFAULT_MOMENTS,
  onMomentClick,
}) => {
  const router = useRouter();

  const handleCardClick = (moment: MealMomentItem) => {
    if (onMomentClick) {
      onMomentClick(moment);
    } else {
      router.push(`/restaurant/${moment.kitchenId || "7-12-kitchen"}`);
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
