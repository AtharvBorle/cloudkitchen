"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock } from "lucide-react";

interface PromoRowProps {
  titleHighlight?: string;
  titleRest?: string;
  code?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  badgeText?: string;
  imageSrc?: string;
}

export default function PromoRow({
  titleHighlight = "Save 30% OFF",
  titleRest = "First 2 Orders",
  code = "FOOD30",
  description = "Kickstart your meal plan with premium ingredients and fast delivery. Use code FOOD30 at checkout.",
  buttonText = "Order Now",
  buttonLink = "/explore/food",
  badgeText = "Hurry - ends soon",
  imageSrc = "/images/promo-img1.png",
}: PromoRowProps) {
  const [activeSlide, setActiveSlide] = useState(1);

  return (
    <section
      style={{
        width: "100%",
        padding: "24px 16px",
        backgroundColor: "#FFFFFF",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          width: "100%",
          minHeight: "292px",
          margin: "0 auto",
          backgroundColor: "#F7C08A",
          backgroundImage: "linear-gradient(105deg, #F8C38F 0%, #F5B67B 100%)",
          borderRadius: "28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "36px 48px",
          position: "relative",
          overflow: "hidden",
          boxSizing: "border-box",
          gap: "32px",
        }}
        className="promo-banner-container"
      >
        {/* Left Column: Text and Actions */}
        <div
          style={{
            flex: "1 1 580px",
            maxWidth: "640px",
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {/* Main Title */}
          <h2
            style={{
              fontSize: "clamp(1.8rem, 3.2vw, 2.35rem)",
              fontWeight: "800",
              lineHeight: 1.2,
              letterSpacing: "-0.5px",
              marginBottom: "8px",
            }}
          >
            <span style={{ color: "#FF5500", marginRight: "10px" }}>
              {titleHighlight}
            </span>
            <span style={{ color: "#5C2F16" }}>
              {titleRest}
            </span>
          </h2>

          {/* Coupon Code Callout */}
          <div
            style={{
              fontSize: "1.05rem",
              fontWeight: "700",
              color: "#3D2413",
              marginBottom: "12px",
            }}
          >
            Use code: <span style={{ fontWeight: "800" }}>{code}</span>
          </div>

          {/* Description */}
          <p
            style={{
              fontSize: "0.95rem",
              lineHeight: 1.5,
              color: "#8C4318",
              marginBottom: "24px",
              maxWidth: "520px",
              fontWeight: "500",
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
            }}
          >
            {/* CTA Button */}
            <Link
              href={buttonLink}
              style={{
                backgroundColor: "#FFFFFF",
                color: "#FF5500",
                fontSize: "0.95rem",
                fontWeight: "700",
                padding: "12px 28px",
                borderRadius: "9999px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 14px rgba(0, 0, 0, 0.08)",
                transition: "all 0.2s ease",
              }}
              className="promo-order-btn"
            >
              {buttonText}
            </Link>

            {/* Timer Badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                backgroundColor: "rgba(255, 255, 255, 0.28)",
                borderRadius: "9999px",
                color: "#FFFFFF",
                fontSize: "0.88rem",
                fontWeight: "600",
                backdropFilter: "blur(4px)",
              }}
            >
              <Clock size={16} strokeWidth={2.5} color="#FFFFFF" />
              <span>{badgeText}</span>
            </div>
          </div>
        </div>

        {/* Center-Bottom Pagination Indicator Dots */}
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            zIndex: 3,
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              cursor: "pointer",
            }}
            onClick={() => setActiveSlide(0)}
          />
          <span
            style={{
              width: "22px",
              height: "6px",
              borderRadius: "4px",
              backgroundColor: "#FF5500",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            onClick={() => setActiveSlide(1)}
          />
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              cursor: "pointer",
            }}
            onClick={() => setActiveSlide(2)}
          />
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              cursor: "pointer",
            }}
            onClick={() => setActiveSlide(3)}
          />
        </div>

        {/* Right Column: Scooty Rider Image */}
        <div
          style={{
            flex: "0 0 270px",
            height: "260px",
            position: "relative",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            zIndex: 2,
          }}
          className="promo-image-wrapper"
        >
          <Image
            src={imageSrc}
            alt="Fast Delivery Rider"
            width={262}
            height={261}
            priority
            style={{
              width: "100%",
              height: "auto",
              maxHeight: "260px",
              objectFit: "contain",
              filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.12))",
            }}
          />
        </div>
      </div>

      <style jsx>{`
        .promo-order-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15) !important;
          background-color: #FFFDF9 !important;
        }
        @media (max-width: 868px) {
          .promo-banner-container {
            flex-direction: column !important;
            height: auto !important;
            min-height: auto !important;
            padding: 32px 24px 44px 24px !important;
            text-align: left;
          }
          .promo-image-wrapper {
            margin-top: 16px;
            width: 220px !important;
            height: 220px !important;
          }
        }
      `}</style>
    </section>
  );
}
