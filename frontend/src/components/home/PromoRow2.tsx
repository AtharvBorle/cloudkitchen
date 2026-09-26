"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

export default function PromoRow2({
  banners,
}: PromoRow2Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const hasDynamicBanners = banners && banners.length > 0;
  const bannerList = hasDynamicBanners ? banners : null;
  const totalCount = bannerList ? bannerList.length : 0;

  // Auto rotate if multiple dynamic banners
  useEffect(() => {
    if (!bannerList || bannerList.length <= 1 || isHovered) return;

    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % bannerList.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [bannerList, isHovered]);

  if (!hasDynamicBanners || !bannerList || bannerList.length === 0) {
    return null;
  }

  const nextSlide = () => {
    setActiveIdx((prev) => (prev + 1) % totalCount);
  };

  const prevSlide = () => {
    setActiveIdx((prev) => (prev === 0 ? totalCount - 1 : prev - 1));
  };

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
      nextSlide();
    } else if (diff < -45) {
      prevSlide();
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
          position: "relative",
          zIndex: 10,
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

          {/* Navigation Arrows */}
          {bannerList.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  prevSlide();
                }}
                aria-label="Previous banner"
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(255, 255, 255, 0.85)",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#0F172A",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  zIndex: 10,
                  transition: "all 0.2s ease",
                }}
              >
                <ChevronLeft size={20} strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  nextSlide();
                }}
                aria-label="Next banner"
                style={{
                  position: "absolute",
                  right: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(255, 255, 255, 0.85)",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#0F172A",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  zIndex: 10,
                  transition: "all 0.2s ease",
                }}
              >
                <ChevronRight size={20} strokeWidth={2.5} />
              </button>
            </>
          )}

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

  return null;
}

