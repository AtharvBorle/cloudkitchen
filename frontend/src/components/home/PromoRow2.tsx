"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { DynamicPromoBanner } from "@/lib/useHomeData";
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

export interface PromoRow2Props {
  banners?: DynamicPromoBanner[];
  // Legacy fallback props if no dynamic banner exists
  badge?: string;
  titlePrefix?: string;
  titleHighlight?: string;
  titleSuffix?: string;
  code?: string;
  description?: string;
  orderNowLink?: string;
  imageSrc?: string;
}

const DEFAULT_PROMO_SLIDES: PromoSlide[] = [
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

export default function PromoRow2({
  banners,
  badge = "LIMITED WELCOME OFFER",
  titlePrefix = "Save",
  titleHighlight = "30% OFF",
  titleSuffix = "Your First 2",
  description = "Kickstart your meal plan with premium ingredients & fast delivery.",
  code = "FOOD30",
  orderNowLink = "/explore-desktop",
  imageSrc = "/images/promo-banner-food.png",
}: PromoRow2Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const hasDynamicBanners = banners && banners.length > 0;
  const bannerList = hasDynamicBanners ? banners : null;

  // Auto rotate if multiple dynamic banners
  useEffect(() => {
    if (!bannerList || bannerList.length <= 1 || isHovered) return;

    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % bannerList.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [bannerList, isHovered]);

  // Auto-scroll default slides if no dynamic banners
  useEffect(() => {
    if (hasDynamicBanners || isHovered) return;

    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % DEFAULT_PROMO_SLIDES.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [hasDynamicBanners, isHovered]);

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
    const totalCount = bannerList ? bannerList.length : DEFAULT_PROMO_SLIDES.length;
    if (diff > 45) {
      setActiveIdx((prev) => (prev + 1) % totalCount);
    } else if (diff < -45) {
      setActiveIdx((prev) => (prev === 0 ? totalCount - 1 : prev - 1));
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // If dynamic banners exist
  if (hasDynamicBanners && bannerList) {
    const currentBanner = bannerList[activeIdx] || bannerList[0];
    const destinationLink = currentBanner.redirectUrl || "/explore-desktop";

    return (
      <section
        style={{
          width: "100%",
          padding: "0",
          background: "transparent",
        }}
        className="promo-banner-wrapper"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "1280px",
            margin: "0 auto",
            borderRadius: "22px",
            backgroundColor: "#FFEADB",
            position: "relative",
            overflow: "hidden",
            boxSizing: "border-box",
            boxShadow: "0 10px 30px rgba(249, 115, 22, 0.05)",
            border: "1px solid rgba(254, 215, 170, 0.4)",
            cursor: "pointer",
          }}
          className={`promo-banner PromoRow2 ${currentBanner.mobileImageUrl ? "has-mobile-img" : ""}`}
        >
          <Link
            href={destinationLink}
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              position: "relative",
              textDecoration: "none",
            }}
          >
            <picture style={{ display: "block", width: "100%", height: "100%" }}>
              <source
                media="(max-width: 768px)"
                srcSet={currentBanner.mobileImageUrl || "/images/promo-welcome-mobile-3d.png"}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentBanner.desktopImageUrl || "/images/promo-banner-full.png"}
                alt={currentBanner.title || "Limited Welcome Offer"}
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  objectFit: "cover",
                  objectPosition: "center",
                  transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                className="banner-graphic-img"
              />
            </picture>
          </Link>

          {bannerList.length > 1 && (
            <div
              style={{
                position: "absolute",
                bottom: "10px",
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                zIndex: 5,
                backgroundColor: "rgba(0, 0, 0, 0.25)",
                padding: "4px 10px",
                borderRadius: "9999px",
                backdropFilter: "blur(4px)",
              }}
            >
              {bannerList.map((b, idx) => (
                <button
                  key={b.id || idx}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveIdx(idx);
                  }}
                  style={{
                    width: activeIdx === idx ? "18px" : "7px",
                    height: "7px",
                    borderRadius: "4px",
                    backgroundColor: activeIdx === idx ? "#FF6B00" : "#FFFFFF",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    transition: "all 0.25s ease",
                  }}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        <style jsx>{`
          .PromoRow2 {
            aspect-ratio: 1280 / 324;
          }
          .PromoRow2:hover .banner-graphic-img {
            transform: scale(1.015);
          }
          @media (max-width: 768px) {
            .PromoRow2 {
              border-radius: 20px !important;
              aspect-ratio: 16 / 9 !important;
              max-height: 220px !important;
              height: auto !important;
            }
            .banner-graphic-img {
              width: 100% !important;
              height: 100% !important;
              object-fit: cover !important;
              object-position: center !important;
            }
          }
          @media (max-width: 640px) {
            .PromoRow2 {
              border-radius: 18px !important;
              aspect-ratio: 16 / 9 !important;
              max-height: 205px !important;
              height: auto !important;
            }
            .banner-graphic-img {
              width: 100% !important;
              height: 100% !important;
              object-fit: cover !important;
              object-position: center !important;
            }
          }
        `}</style>
      </section>
    );
  }

  // Fallback slider
  const currentSlide = DEFAULT_PROMO_SLIDES[activeIdx] || DEFAULT_PROMO_SLIDES[0];

  return (
    <section className={styles.promoWrapper}>
      <div
        className={styles.promoCard}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div key={currentSlide.id} className={styles.slideContent}>
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

        <div className={styles.dotsContainer}>
          {DEFAULT_PROMO_SLIDES.map((slide, index) => {
            const isActive = activeIdx === index;
            return (
              <button
                key={slide.id}
                type="button"
                className={`${styles.dotBtn} ${
                  isActive ? styles.dotActive : styles.dotInactive
                }`}
                onClick={() => setActiveIdx(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

