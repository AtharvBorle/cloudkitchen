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
        <span className={styles.badge}>{badgeText}</span>
        <h1 className={styles.heading}>{heading}</h1>
        <p className={styles.description}>{description}</p>

        <button
          type="button"
          className={styles.streamBtn}
          onClick={onButtonClick}
          aria-label={buttonText}
        >
          <span>{buttonText}</span>
          <Play size={14} fill="#ffffff" color="#ffffff" className={styles.playIcon} />
        </button>
      </div>
    </section>
  );
};

export default ExploreHeroBanner;
