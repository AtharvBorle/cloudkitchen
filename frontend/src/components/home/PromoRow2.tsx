"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DynamicPromoBanner } from "@/lib/useHomeData";

export interface PromoRow2Props {
  banners?: DynamicPromoBanner[];
  // Legacy fallback props if no dynamic banner exists
  badge?: string;
  titlePrefix?: string;
  titleHighlight?: string;
  titleSuffix?: string;
  description?: string;
  code?: string;
  orderNowLink?: string;
  imageSrc?: string;
}

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

  const hasDynamicBanners = banners && banners.length > 0;
  const bannerList = hasDynamicBanners ? banners : null;

  // Auto rotate if multiple banners
  useEffect(() => {
    if (!bannerList || bannerList.length <= 1 || isHovered) return;

    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % bannerList.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [bannerList, isHovered]);

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
      >
        {/* Promo banner container: width 100%, maxWidth 1280px, height 324px, radius 22px */}
        <div
          style={{
            width: "100%",
            maxWidth: "1280px",
            height: "324px",
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
          className="promo-banner PromoRow2"
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
            {/* Desktop Graphic Image (Default / md+) */}
            <picture style={{ display: "block", width: "100%", height: "100%" }}>
              {currentBanner.mobileImageUrl && (
                <source
                  media="(max-width: 640px)"
                  srcSet={currentBanner.mobileImageUrl}
                />
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentBanner.desktopImageUrl}
                alt={currentBanner.title || "Promotional Banner"}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center",
                  display: "block",
                  transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                className="banner-graphic-img"
              />
            </picture>
          </Link>

          {/* Carousel Pagination Dots if multiple banners */}
          {bannerList.length > 1 && (
            <div
              style={{
                position: "absolute",
                bottom: "14px",
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
          .PromoRow2:hover .banner-graphic-img {
            transform: scale(1.015);
          }
          @media (max-width: 768px) {
            .PromoRow2 {
              height: 220px !important;
              border-radius: 18px !important;
            }
          }
          @media (max-width: 480px) {
            .PromoRow2 {
              height: 180px !important;
              border-radius: 16px !important;
            }
          }
        `}</style>
      </section>
    );
  }

  // Fallback: When no dynamic banners are created yet, render the clean full graphic banner layout
  return (
    <section
      style={{
        width: "100%",
        padding: "0",
        background: "transparent",
      }}
      className="promo-banner-wrapper"
    >
      {/* Promo banner container: width 1280px, height 324px, radius 22px */}
      <div
        style={{
          width: "100%",
          maxWidth: "1280px",
          height: "324px",
          margin: "0 auto",
          borderRadius: "22px",
          backgroundColor: "#FFEADB",
          position: "relative",
          overflow: "hidden",
          boxSizing: "border-box",
          boxShadow: "0 10px 30px rgba(249, 115, 22, 0.05)",
          border: "1px solid rgba(254, 215, 170, 0.4)",
        }}
        className="promo-banner PromoRow2"
      >
        <Link
          href={orderNowLink}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            position: "relative",
            textDecoration: "none",
          }}
        >
          {/* content-block-left: Left side content */}
          <div
            style={{
              position: "absolute",
              top: "38px",
              left: "56px",
              width: "600px",
              maxWidth: "600px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              zIndex: 2,
              boxSizing: "border-box",
            }}
            className="content-block-left"
          >
            {/* Eyebrow Badge */}
            <div
              style={{
                width: "fit-content",
                backgroundColor: "#FFDFCE",
                color: "#FF6B00",
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "11.5px",
                fontWeight: 800,
                lineHeight: "100%",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
              }}
            >
              {badge}
            </div>

            {/* Heading */}
            <h2
              style={{
                fontSize: "42px",
                fontWeight: 800,
                lineHeight: "1.15",
                letterSpacing: "-0.5px",
                margin: 0,
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                color: "#231F20",
              }}
            >
              {titlePrefix} <span style={{ color: "#FF6B00" }}>{titleHighlight}</span> {titleSuffix}
              <br />
              Orders
            </h2>

            {/* Description */}
            <p
              style={{
                fontSize: "14.5px",
                fontWeight: 400,
                lineHeight: "1.4",
                color: "#785E54",
                margin: "2px 0 6px 0",
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
              }}
            >
              {description}
            </p>

            {/* Action Row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap",
                marginTop: "4px",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#FF6B00",
                  color: "#FFFFFF",
                  fontSize: "14.5px",
                  fontWeight: 700,
                  padding: "11px 26px",
                  borderRadius: "10px",
                  boxShadow: "0 4px 14px rgba(255, 107, 0, 0.35)",
                  fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                }}
              >
                Order Now
              </span>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #EAE1DB",
                  borderRadius: "10px",
                  padding: "9px 18px",
                  fontSize: "13px",
                  fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                  color: "#785E54",
                  fontWeight: 500,
                }}
              >
                <span>USE CODE:</span>
                <strong style={{ color: "#18181B", fontWeight: 700 }}>{code}</strong>
              </div>
            </div>
          </div>

          {/* Right Food Image Layer */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "706px",
              height: "324px",
              zIndex: 1,
              pointerEvents: "none",
              boxSizing: "border-box",
            }}
            className="imagery-wrapper"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt="Promotional Banner Food"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "right center",
                display: "block",
              }}
            />
          </div>
        </Link>
      </div>

      <style jsx>{`
        @media (max-width: 1200px) {
          .PromoRow2 {
            height: auto !important;
            min-height: 324px !important;
          }
          .content-block-left {
            position: relative !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 36px 28px !important;
          }
          .imagery-wrapper {
            opacity: 0.25;
            width: 100% !important;
          }
        }
        @media (max-width: 640px) {
          .content-block-left {
            padding: 28px 18px !important;
          }
          .content-block-left h2 {
            font-size: 28px !important;
          }
        }
      `}</style>
    </section>
  );
}

