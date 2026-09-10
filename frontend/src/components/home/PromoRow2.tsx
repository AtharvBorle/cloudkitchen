"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./PromoRow2.module.css";

export interface PromoSlide {
  id: string;
  titlePrefix: string;
  highlight: string;
  titleSuffix?: string;
  code: string;
  buttonText: string;
  link: string;
  imageSrc: string;
  imageType: "scooter" | "food";
}

const PROMO_SLIDES: PromoSlide[] = [
  {
    id: "promo-1",
    titlePrefix: "Save ",
    highlight: "30% OFF",
    titleSuffix: "First 2 Orders",
    code: "FOOD30",
    buttonText: "Order Now",
    link: "/explore-desktop",
    imageSrc: "/images/promo-scooter.png",
    imageType: "scooter",
  },
  {
    id: "promo-2",
    titlePrefix: "Mess Special – Flat ",
    highlight: "30% OFF",
    titleSuffix: "on First Thali",
    code: "THALI30",
    buttonText: "Order Now",
    link: "/explore-desktop?category=Mess/Tiffin",
    imageSrc:
      "https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?w=600&auto=format&fit=crop&q=80",
    imageType: "food",
  },
  {
    id: "promo-3",
    titlePrefix: "Fresh Bakes – Get ",
    highlight: "25% OFF",
    titleSuffix: "on Cakes",
    code: "CAKE25",
    buttonText: "Order Now",
    link: "/explore-desktop?category=Bakery",
    imageSrc:
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80",
    imageType: "food",
  },
  {
    id: "promo-4",
    titlePrefix: "Homemade – Flat ",
    highlight: "20% OFF",
    titleSuffix: "on Order",
    code: "HOME20",
    buttonText: "Explore Now",
    link: "/explore-desktop?category=Homemade",
    imageSrc:
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80",
    imageType: "food",
  },
];

export default function PromoRow2() {
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Auto-scroll every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % PROMO_SLIDES.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [currentSlideIndex]);

  const goToSlide = (index: number) => {
    setCurrentSlideIndex(index);
  };

  const currentSlide = PROMO_SLIDES[currentSlideIndex];

  // Touch Swipe Handlers for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 45) {
      // Swiped left -> Next slide
      setCurrentSlideIndex((prev) => (prev + 1) % PROMO_SLIDES.length);
    } else if (diff < -45) {
      // Swiped right -> Prev slide
      setCurrentSlideIndex((prev) =>
        prev === 0 ? PROMO_SLIDES.length - 1 : prev - 1
      );
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <section className={styles.promoWrapper}>
      <div
        className={styles.promoCard}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Animated Slide Content */}
        <div key={currentSlide.id} className={styles.slideContent}>
          {/* Left Text and CTA */}
          <div className={styles.leftContent}>
            <h2 className={styles.promoTitle}>
              {currentSlide.titlePrefix}
              <span className={styles.highlight}>{currentSlide.highlight}</span>
              {currentSlide.titleSuffix && (
                <>
                  <br />
                  {currentSlide.titleSuffix}
                </>
              )}
            </h2>

            <div className={styles.codeText}>
              Use code:{" "}
              <span className={styles.codeVal}>{currentSlide.code}</span>
            </div>

            <Link href={currentSlide.link} className={styles.orderBtn}>
              {currentSlide.buttonText}
            </Link>
          </div>

          {/* Right Image/Graphic Box */}
          <div className={styles.graphicBox}>
            {currentSlide.imageType === "scooter" ? (
              <div className={styles.scooterBox}>
                <Image
                  src={currentSlide.imageSrc}
                  alt="Delivery Rider"
                  width={220}
                  height={220}
                  priority
                  className={styles.scooterImg}
                />
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentSlide.imageSrc}
                alt={currentSlide.titlePrefix}
                className={styles.foodImg}
              />
            )}
          </div>
        </div>

        {/* Carousel Pagination Dots */}
        <div className={styles.dotsContainer}>
          {PROMO_SLIDES.map((slide, index) => {
            const isActive = currentSlideIndex === index;
            return (
              <button
                key={slide.id}
                type="button"
                className={`${styles.dotBtn} ${
                  isActive ? styles.dotActive : styles.dotInactive
                }`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
