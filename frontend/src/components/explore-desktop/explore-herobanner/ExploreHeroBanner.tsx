"use client";

import React from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import styles from "./ExploreHeroBanner.module.css";
import pizzaBg from "./explore-pizza-banner.jpg";

export interface ExploreHeroBannerProps {
  badgeText?: string;
  heading?: string;
  description?: string;
  buttonText?: string;
  onButtonClick?: () => void;
}

export const ExploreHeroBanner: React.FC<ExploreHeroBannerProps> = ({
  badgeText = "LIMITED OFFER",
  heading = "Find your favorite meals prepared live.",
  description = "Watch skilled local chefs craft gourmet dishes on stream, and get them delivered hot to your doorstep within 25 minutes.",
  buttonText = "Watch Kitchen Streams",
  onButtonClick,
}) => {
  return (
    <section className={styles.heroContainer} aria-label="Explore Hero Banner">
      {/* Background Pizza Image */}
      <Image
        src={pizzaBg}
        alt="Live Cloud Kitchen Pizza"
        fill
        priority
        className={styles.bgImage}
      />

      {/* Dark overlay for readability */}
      <div className={styles.gradientOverlay} />

      {/* Hero Content */}
      <div className={styles.contentArea}>
        {/* 1. Limited Offer Button (121px x 30px) */}
        <span className={styles.badge}>{badgeText}</span>

        {/* 2. Text and Description Box (580px x 156px) */}
        <div className={styles.textBlock}>
          <h1 className={styles.heading}>{heading}</h1>
          <p className={styles.description}>{description}</p>
        </div>

        {/* 3. Watch Kitchen Streams Button (252px x 51px, Rectangle Type Border) */}
        <button
          type="button"
          className={styles.streamBtn}
          onClick={onButtonClick}
          aria-label={buttonText}
        >
          <span>{buttonText}</span>
          <Play size={16} strokeWidth={2.4} fill="none" color="#ffffff" className={styles.playIcon} />
        </button>
      </div>
    </section>
  );
};

export default ExploreHeroBanner;
