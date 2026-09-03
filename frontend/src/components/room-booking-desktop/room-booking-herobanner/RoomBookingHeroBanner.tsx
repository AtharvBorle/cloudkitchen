"use client";

import React from "react";
import Image from "next/image";
import styles from "./RoomBookingHeroBanner.module.css";
import promoBg from "./promobanner.png";
import roomIllustration from "./Rectangle.png";

export interface RoomBookingHeroBannerProps {
  tagline?: string;
  heading?: string;
  description?: string;
}

export const RoomBookingHeroBanner: React.FC<RoomBookingHeroBannerProps> = ({
  tagline = "LIMITED TIME VERIFIED LISTINGS",
  heading = "Find Your Perfect Stay",
  description = "Browse over 200+ fully-furnished PGs & rooms near MIT & Kothrud colleges.",
}) => {
  return (
    <section
      className={styles.heroContainer}
      aria-label="Room Booking Hero Banner"
    >
      {/* 1. Main Background Image */}
      <Image
        src={promoBg}
        alt="Room Booking Background"
        fill
        priority
        className={styles.bgImage}
      />

      {/* 2. Gradient Overlay for readability */}
      <div className={styles.gradientOverlay} />

      {/* 3. Left Text Content */}
      <div className={styles.leftContent}>
        <span className={styles.tagline}>{tagline}</span>
        <h1 className={styles.heading}>{heading}</h1>
        <p className={styles.description}>{description}</p>
      </div>

      {/* 4. Right Side Illustration */}
      <div className={styles.rightShowcase}>
        <Image
          src={roomIllustration}
          alt="Room Preview"
          width={260}
          height={200}
          priority
          className={styles.rightImage}
        />
      </div>
    </section>
  );
};

export default RoomBookingHeroBanner;
