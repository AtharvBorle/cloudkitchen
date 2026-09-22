"use client";

import React from "react";
import Image from "next/image";
import styles from "./LoginHero.module.css";

export interface LoginHeroProps {
  title?: string;
  subtitle?: string;
  quote?: string;
  quoteAuthor?: string;
}

export const LoginHero: React.FC<LoginHeroProps> = ({
  title = "Your favorite meals,\ncrafted with passion.",
  subtitle = "From hot brick-oven pizzas to custom healthy bowls, satisfy your cravings in just a few clicks. Fast, fresh, and delivered hot.",
  quote = "“Neo Cloud Bites is my absolute go-to! The food always arrives piping hot and beautifully packaged.”",
  quoteAuthor = "Prisha S. • Kothrud Resident",
}) => {
  return (
    <div className={styles.heroContainer}>
      {/* Background Cover Image */}
      <Image
        src="/images/login-page-image3.png"
        alt="Delicious meal spread"
        fill
        priority
        className={styles.bgImage}
        sizes="(max-width: 1024px) 100vw, 50vw"
      />

      {/* Dark Overlay Gradient */}
      <div className={styles.overlay} />

      {/* Content Container */}
      <div className={styles.contentWrapper}>
        {/* Top Logo */}
        <div className={styles.logoHeader}>
          <div className={styles.logoBadge}>
            <Image
              src="/images/logo-nav.png"
              alt="Neo Cloud Bites Logo"
              width={64}
              height={64}
              className={styles.logoImg}
            />
          </div>
          <span className={styles.brandTitle}>NEO CLOUD BITES</span>
        </div>

        {/* Center Hero Heading & Subtitle */}
        <div className={styles.heroTextGroup}>
          <h1 className={styles.heroHeading}>{title}</h1>
          <p className={styles.heroSubtitle}>{subtitle}</p>

          {/* Testimonial Glass Card */}
          <div className={styles.testimonialCard}>
            <div className={styles.avatarWrapper}>
              <Image
                src="/images/prisha-avatar.png"
                alt="Prisha S."
                width={48}
                height={48}
                className={styles.avatarImg}
              />
            </div>
            <div className={styles.quoteInfo}>
              <p className={styles.quoteText}>{quote}</p>
              <p className={styles.authorText}>{quoteAuthor}</p>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className={styles.heroFooter}>
          <p className={styles.copyrightText}>
            © 2026 Neo Cloud Bites. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginHero;
