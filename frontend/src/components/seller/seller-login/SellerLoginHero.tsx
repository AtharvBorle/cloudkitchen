"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./SellerLogin.module.css";

export interface SellerLoginHeroProps {
  heroImageSrc?: string;
  badgeImageSrc?: string;
  avatarImageSrc?: string;
  heading?: string;
  subtitle?: string;
  quote?: string;
  author?: string;
  copyrightYear?: number;
}

export const SellerLoginHero: React.FC<SellerLoginHeroProps> = ({
  heroImageSrc = "/images/seller-login-hero.jpg",
  badgeImageSrc = "/images/seller-login-badge.png",
  avatarImageSrc = "/images/prisha-avatar.png",
  heading = "Your kitchen,\nmanaged your way.",
  subtitle = "From daily meals and inventory to orders and operations, keep everything under control from one place. Plan smarter, track supplies, and keep your kitchen running smoothly.",
  quote = "“Neo Cloud Bites helps me manage orders, inventory, and staff in one place. It makes running my cloud kitchen much easier.”",
  author = "Prisha S. • Kothrud Resident",
  copyrightYear = 2026,
}) => {
  return (
    <aside className={styles.heroColumn} aria-label="Brand narrative and testimonial">
      {/* Background Image & Overlay */}
      <div className={styles.heroBackground}>
        <Image
          src={heroImageSrc}
          alt="Chef cooking in cloud kitchen"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className={styles.heroBackgroundImage}
        />
        <div className={styles.heroOverlay} />
      </div>

      {/* Hero Content */}
      <div className={styles.heroContent}>
        {/* Top: Brand Header */}
        <Link href="/" className={styles.brandHeader} aria-label="Neo Cloud Bites Homepage">
          <div className={styles.brandBadge}>
            <Image
              src={badgeImageSrc}
              alt="Neo Cloud Bites logo badge"
              fill
              sizes="44px"
              className={styles.badgeImg}
            />
          </div>
          <span className={styles.brandName}>NEO CLOUD BITES</span>
        </Link>

        {/* Center: Narrative & Testimonial */}
        <div className={styles.narrativeSection}>
          <h1 className={styles.heroHeading}>
            {heading.split("\n").map((line, index) => (
              <React.Fragment key={index}>
                {line}
                {index < heading.split("\n").length - 1 && <br />}
              </React.Fragment>
            ))}
          </h1>

          <p className={styles.heroSubtitle}>{subtitle}</p>

          {/* Testimonial Glass Card */}
          <div className={styles.testimonialCard}>
            <div className={styles.avatarWrapper}>
              <Image
                src={avatarImageSrc}
                alt={author}
                fill
                sizes="48px"
                className={styles.avatarImg}
              />
            </div>
            <div className={styles.testimonialText}>
              <blockquote className={styles.quote}>{quote}</blockquote>
              <span className={styles.author}>{author}</span>
            </div>
          </div>
        </div>

        {/* Bottom: Footer Copyright */}
        <div className={styles.heroFooter}>
          <p className={styles.copyright}>
            © {copyrightYear} Neo Cloud Bites. All rights reserved.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default SellerLoginHero;
