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
  titleSuffix = "Your First 2",
  titleLine2 = "Orders",
  description = "Kickstart your meal plan with premium ingredients & fast delivery.",
  code = "FOOD30",
  orderNowLink = "/explore/food",
  imageSrc = "/images/promo-banner-food.png",
}: PromoRow2Props & { titleLine2?: string }) {
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
          {/* Eyebrow Badge: LIMITED WELCOME OFFER */}
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

          {/* Heading: Save 30% OFF Your First 2 Orders */}
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
            {titlePrefix}{" "}
            <span style={{ color: "#FF6B00" }}>{titleHighlight}</span>{" "}
            {titleSuffix}
            <br />
            {titleLine2}
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

          {/* Action Row: Order Now + USE CODE: FOOD30 + Hurry tag */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
              marginTop: "4px",
            }}
          >
            {/* Order Now Button */}
            <Link
              href={orderNowLink}
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
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(255, 107, 0, 0.35)",
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
                border: "1px solid #EAE1DB",
                borderRadius: "10px",
                padding: "9px 18px",
                fontSize: "13px",
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                color: "#785E54",
                fontWeight: 500,
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
              }}
            >
              <span>USE CODE:</span>
              <strong style={{ color: "#18181B", fontWeight: 700 }}>{code}</strong>
            </div>

            {/* Hurry Timer Tag */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                fontWeight: 600,
                color: "#FF6B00",
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
              }}
            >
              <Clock size={16} strokeWidth={2.4} color="#FF6B00" />
              <span>Hurry – ends soon</span>
            </div>
          </div>
        </div>

        {/* Right Food Image Layer (Seamlessly blends into #FFEADB) */}
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
            alt="Fresh gourmet ingredients and pasta meal box"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "right center",
              display: "block",
            }}
          />
        </div>

        {/* Pagination Dots at Bottom Center */}
        <div
          style={{
            position: "absolute",
            bottom: "12px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            zIndex: 3,
          }}
        >
          <span
            style={{
              width: "14px",
              height: "6px",
              borderRadius: "3px",
              backgroundColor: "#FF6B00",
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
          background-color: #E65F00 !important;
          box-shadow: 0 6px 20px rgba(255, 107, 0, 0.36) !important;
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
