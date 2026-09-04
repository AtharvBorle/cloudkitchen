"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock } from "lucide-react";

export interface PromoRow2Props {
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
  badge = "LIMITED WELCOME OFFER",
  titlePrefix = "Save",
  titleHighlight = "30% OFF",
  titleSuffix = "Your First 2 Orders",
  description = "Kickstart your meal plan with premium ingredients & fast delivery. Use code FOOD30 at checkout.",
  code = "FOOD30",
  orderNowLink = "/explore/food",
  imageSrc = "/images/promo-banner-food.png",
}: PromoRow2Props) {
  return (
    <section
      style={{
        width: "100%",
        padding: "0",
        background: "transparent",
      }}
      className="promo-banner-wrapper"
    >
      {/* PromoRow or promo-banner container: width 1280px, height 324px, radius 22px */}
      <div
        style={{
          width: "100%",
          maxWidth: "1280px",
          height: "324px",
          margin: "0 auto",
          borderRadius: "22px",
          backgroundImage: "linear-gradient(90deg, #FFF7F4 0%, #FFE8DC 100%)",
          backgroundColor: "#FFF7F4",
          position: "relative",
          overflow: "hidden",
          boxSizing: "border-box",
          border: "1px solid rgba(254, 215, 170, 0.4)",
          boxShadow: "0 10px 30px rgba(249, 115, 22, 0.06)",
        }}
        className="promo-banner PromoRow2"
      >
        {/* ambient-glow: width 350px, height 350px, left 649px, opacity 85%, layer blur 103.1px */}
        <div
          style={{
            position: "absolute",
            width: "350px",
            height: "350px",
            left: "649px",
            top: "-13px",
            backgroundColor: "#FFF0E9",
            opacity: 0.85,
            filter: "blur(103.1px)",
            WebkitFilter: "blur(103.1px)",
            borderRadius: "50%",
            pointerEvents: "none",
            zIndex: 1,
          }}
          className="ambient-glow"
        />

        {/* content-block-left: flow vertical, width fixed 680px, height hug 238px, top 43px, left 64px, gap 16px */}
        <div
          style={{
            position: "absolute",
            top: "43px",
            left: "64px",
            width: "680px",
            maxWidth: "680px",
            minHeight: "238px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            zIndex: 2,
            boxSizing: "border-box",
          }}
          className="content-block-left"
        >
          {/* Eyebrow Badge: LIMITED WELCOME OFFER */}
          <div
            style={{
              width: "fit-content",
              backgroundColor: "#FFEFE7",
              color: "#FF5421",
              padding: "4px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 700,
              lineHeight: "100%",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              fontFamily: "var(--font-figtree), 'Figtree', var(--font-poppins), 'Poppins', sans-serif",
            }}
          >
            {badge}
          </div>

          {/* Heading: Save 30% OFF Your First 2 Orders */}
          <h2
            style={{
              fontSize: "44px",
              fontWeight: 700,
              lineHeight: "110%",
              letterSpacing: "-1px",
              margin: 0,
              fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
              color: "#1F1610",
            }}
          >
            {titlePrefix}{" "}
            <span style={{ color: "#FF5421" }}>{titleHighlight}</span>{" "}
            {titleSuffix}
          </h2>

          {/* Description */}
          <p
            style={{
              width: "680px",
              maxWidth: "100%",
              minHeight: "23px",
              fontSize: "15px",
              fontWeight: 400,
              lineHeight: "150%",
              letterSpacing: "0%",
              color: "#6B524A",
              margin: 0,
              fontFamily: "var(--font-figtree), 'Figtree', var(--font-poppins), 'Poppins', sans-serif",
            }}
          >
            Kickstart your meal plan with premium ingredients &amp; fast delivery.
          </p>

          {/* Action Row: Order Now + USE CODE: FOOD30 + Hurry tag */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
              marginTop: "6px",
            }}
          >
            {/* Order Now Button */}
            <Link
              href={orderNowLink}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#FF5421",
                color: "#FFFFFF",
                fontSize: "15px",
                fontWeight: 700,
                padding: "12px 28px",
                borderRadius: "12px",
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(255, 84, 33, 0.32)",
                transition: "all 0.2s ease",
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                cursor: "pointer",
              }}
              className="promo2-order-btn"
            >
              Order Now
            </Link>

            {/* Code Chip */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "12px",
                padding: "10px 18px",
                fontSize: "13.5px",
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                color: "#6B524A",
                fontWeight: 500,
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
              }}
            >
              <span>USE CODE:</span>
              <strong style={{ color: "#0F172A", fontWeight: 700 }}>{code}</strong>
            </div>

            {/* Hurry Timer Tag */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "14px",
                fontWeight: 600,
                color: "#FF5421",
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
              }}
            >
              <Clock size={16} strokeWidth={2.4} color="#FF5421" />
              <span>Hurry – ends soon</span>
            </div>
          </div>
        </div>

        {/* imagery-wrapper: flow horizontal, width fixed 480px, height fixed 324px, left 800px */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "480px",
            height: "324px",
            zIndex: 2,
            overflow: "hidden",
            boxSizing: "border-box",
          }}
          className="imagery-wrapper"
        >
          <Image
            src={imageSrc}
            alt="Fresh gourmet ingredients and pasta meal box"
            fill
            sizes="480px"
            priority
            style={{
              objectFit: "cover",
              objectPosition: "center left",
            }}
          />
        </div>

        {/* Pagination Dots at Bottom Center */}
        <div
          style={{
            position: "absolute",
            bottom: "14px",
            left: "490px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            zIndex: 3,
          }}
        >
          <span
            style={{
              width: "16px",
              height: "6px",
              borderRadius: "3px",
              backgroundColor: "#FF5500",
              transition: "all 0.3s ease",
            }}
          />
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "#CBD5E1",
            }}
          />
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "#CBD5E1",
            }}
          />
        </div>
      </div>

      <style jsx>{`
        .promo2-order-btn:hover {
          transform: translateY(-2px);
          background-color: #E64D00 !important;
          box-shadow: 0 6px 20px rgba(255, 85, 0, 0.36) !important;
        }
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
            padding: 36px 32px !important;
          }
          .imagery-wrapper {
            display: none !important;
          }
        }
        @media (max-width: 640px) {
          .content-block-left {
            padding: 28px 20px !important;
          }
          .content-block-left h2 {
            font-size: 28px !important;
          }
        }
      `}</style>
    </section>
  );
}
