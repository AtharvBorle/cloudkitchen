"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Image, { StaticImageData } from "next/image";
import styles from "./WhatsOnYourMind.module.css";
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
  activeCategory?: string;
  onMomentClick?: (moment: MealMomentItem) => void;
}

export const WhatsOnYourMind: React.FC<WhatsOnYourMindProps> = ({
  heading = "What's on Your Mind?",
  subheading = "Pick a meal moment to explore curated options.",
  moments,
  activeCategory,
  onMomentClick,
}) => {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);

  const checkScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = Math.max(0, scrollWidth - clientWidth);

    setCanScrollLeft(scrollLeft > 12);
    setCanScrollRight(scrollLeft < maxScroll - 12);
    setIsAtEnd(maxScroll > 0 && scrollLeft >= maxScroll - 16);
  }, []);

  useEffect(() => {
    checkScrollState();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener("scroll", checkScrollState, { passive: true });
    window.addEventListener("resize", checkScrollState);

    const timer = setTimeout(checkScrollState, 300);

    return () => {
      el.removeEventListener("scroll", checkScrollState);
      window.removeEventListener("resize", checkScrollState);
      clearTimeout(timer);
    };
  }, [checkScrollState, moments]);

  if (!moments || moments.length === 0) {
    return null;
  }

  const handleScrollRight = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (isAtEnd) {
      el.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      const scrollStep = Math.max(el.clientWidth * 0.72, 320);
      el.scrollBy({ left: scrollStep, behavior: "smooth" });
    }
  };

  const handleScrollLeft = () => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollStep = Math.max(el.clientWidth * 0.72, 320);
    el.scrollBy({ left: -scrollStep, behavior: "smooth" });
  };

  const handleResetToStart = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: 0, behavior: "smooth" });
  };

  const handleCardClick = (moment: MealMomentItem) => {
    if (onMomentClick) {
      onMomentClick(moment);
    } else if (moment.categoryQuery) {
      const q = moment.categoryQuery.toLowerCase().trim();
      const currentActive = (activeCategory || "").toLowerCase().trim();
      if (currentActive === q) {
        router.push("/explore-desktop");
      } else {
        router.push(`/explore-desktop?category=${encodeURIComponent(q)}`);
      }
      setTimeout(() => {
        const el = document.getElementById("search-results-section");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
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
      {/* Header Row with Heading & Navigation Controls */}
      <div className={styles.headerRow}>
        <div className={styles.headerTextGroup}>
          <h2 className={styles.heading}>{heading}</h2>
          <p className={styles.subheading}>{subheading}</p>
        </div>

        <div className={styles.headerControls}>
          {canScrollLeft && (
            <button
              type="button"
              className={styles.resetBtn}
              onClick={handleResetToStart}
              title="Return to first position"
              aria-label="Return to first category"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              First Item
            </button>
          )}

          <button
            type="button"
            className={styles.headerArrowBtn}
            onClick={handleScrollLeft}
            disabled={!canScrollLeft}
            aria-label="Scroll categories left"
            title="Previous categories"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <button
            type="button"
            className={`${styles.headerArrowBtn} ${!canScrollLeft ? styles.pulseNextBtn : ""}`}
            onClick={handleScrollRight}
            aria-label={isAtEnd ? "Back to start" : "Scroll categories right"}
            title={isAtEnd ? "Back to start" : "More categories"}
          >
            {isAtEnd ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Carousel Track Wrapper */}
      <div className={styles.carouselWrapper}>
        {/* Single Horizontal Line Track of Category Cards */}
        <div
          ref={scrollRef}
          className={styles.cardsTrack}
          role="region"
          aria-label="Meal Moments Carousel"
          tabIndex={0}
        >
          {moments.map((moment) => {
            const q = (moment.categoryQuery || moment.title).toLowerCase().trim();
            const currentActive = (activeCategory || "").toLowerCase().trim();
            const isActive = Boolean(currentActive && currentActive === q);

            return (
              <article
                key={moment.id}
                className={`${styles.momentCard} ${moment.bgClass} ${isActive ? styles.activeCard : ""}`}
                onClick={() => handleCardClick(moment)}
                tabIndex={0}
                role="button"
                aria-label={`${moment.title} - ${moment.badge}`}
                aria-pressed={isActive}
              >
                {/* Top Pill Badge */}
                <div className={styles.topRow}>
                  <span className={`${styles.pillBadge} ${isActive ? styles.activeBadge : ""}`}>
                    {isActive ? "Selected" : moment.badge}
                  </span>
                </div>

                {/* Bottom Icon + Title */}
                <div className={styles.bottomRow}>
                  <div className={styles.iconWrapper}>
                    <Image
                      src={moment.icon || "/images/categories/cat-food.png"}
                      alt={moment.title}
                      fill
                      sizes="44px"
                      className={styles.foodIconImg}
                      unoptimized
                    />
                  </div>
                  <h3 className={styles.cardTitle} title={moment.title}>
                    {moment.title}
                  </h3>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhatsOnYourMind;
