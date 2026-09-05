"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock } from "lucide-react";

export interface PromoCardData {
  id: string;
  title: string;
  code: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  badgeText: string;
  imageSrc: string;
}

const DEFAULT_PROMOS: PromoCardData[] = [
  {
    id: "promo-1",
    title: "Save 30% OFF  First 2 Orders",
    code: "FOOD30",
    description: "Kickstart your meal plan with premium ingredients & fast delivery. Use code FOOD30 at checkout.",
    buttonText: "Order Now",
    buttonLink: "/explore/food",
    badgeText: "Hurry - ends soon",
    imageSrc: "/images/promo-scooter.png",
  },
  {
    id: "promo-2",
    title: "Save 30% OFF  First 2 Orders",
    code: "FOOD30",
    description: "Kickstart your meal plan with premium ingredients & fast delivery. Use code FOOD30 at checkout.",
    buttonText: "Order Now",
    buttonLink: "/explore/food",
    badgeText: "Hurry - ends soon",
    imageSrc: "/images/promo-scooter.png",
  },
];

interface PromoRowProps {
  promos?: PromoCardData[];
}

export default function PromoRow({ promos = DEFAULT_PROMOS }: PromoRowProps) {
  return (
    <section
      style={{
        width: "100%",
        padding: "0",
        background: "transparent",
      }}
      className="promo-row-section"
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1280px",
          height: "324px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "40px",
          boxSizing: "border-box",
        }}
        className="promo-row-container"
      >
        {promos.slice(0, 2).map((promo, idx) => (
          <div
            key={promo.id || idx}
            style={{
              width: "620px",
              flex: "1 1 620px",
              maxWidth: "620px",
              height: "324px",
              backgroundColor: "#F7C08A",
              backgroundImage: "linear-gradient(108deg, #FDE6CE 0%, #F8C38F 50%, #F5B67B 100%)",
              borderRadius: "28px",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "24px 24px 24px 32px",
              position: "relative",
              overflow: "hidden",
              boxSizing: "border-box",
              boxShadow: "0 8px 24px rgba(245, 182, 123, 0.22)",
            }}
            className="promo-card promoRow1"
          >
            {/* Left Content Area */}
            <div
              style={{
                flex: "1 1 350px",
                maxWidth: "355px",
                zIndex: 2,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                boxSizing: "border-box",
              }}
            >
              {/* Heading: Save 30% OFF First 2 Orders */}
              <h2
                style={{
                  width: "100%",
                  maxWidth: "360px",
                  minHeight: "64px",
                  fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                  fontWeight: 600,
                  fontSize: "28px",
                  lineHeight: "33px",
                  letterSpacing: "0px",
                  background: "linear-gradient(90deg, #F97316 0%, #93440D 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  margin: "0 0 6px 0",
                  display: "flex",
                  alignItems: "center",
                  boxSizing: "border-box",
                }}
              >
                {promo.title}
              </h2>

              {/* Code: Use code: FOOD30 */}
              <div
                style={{
                  width: "100%",
                  height: "24px",
                  fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                  fontWeight: 600,
                  fontSize: "15px",
                  lineHeight: "100%",
                  letterSpacing: "0%",
                  color: "#0F172A",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  boxSizing: "border-box",
                }}
              >
                Use code: <span style={{ marginLeft: "4px" }}>{promo.code}</span>
              </div>

              {/* Description body */}
              <p
                style={{
                  width: "100%",
                  maxWidth: "350px",
                  minHeight: "44px",
                  fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                  fontWeight: 500,
                  fontSize: "14.5px",
                  lineHeight: "145%",
                  letterSpacing: "0%",
                  color: "#F97316",
                  margin: "0 0 16px 0",
                  boxSizing: "border-box",
                }}
              >
                {promo.description}
              </p>

              {/* Actions: Order Now + Hurry Badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  flexWrap: "nowrap",
                }}
              >
                {/* Order Now button */}
                <Link
                  href={promo.buttonLink}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "auto",
                    minWidth: "120px",
                    height: "44px",
                    borderRadius: "99px",
                    padding: "10px 22px",
                    backgroundColor: "#FFFFFF",
                    color: "#FF6B00",
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                    fontWeight: 600,
                    fontSize: "14.5px",
                    textDecoration: "none",
                    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.06)",
                    transition: "all 0.2s ease",
                    boxSizing: "border-box",
                    whiteSpace: "nowrap",
                  }}
                  className="promo-order-btn"
                >
                  {promo.buttonText}
                </Link>

                {/* Hurry - ends soon badge */}
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "auto",
                    minWidth: "155px",
                    height: "40px",
                    borderRadius: "999px",
                    border: "1px solid rgba(255, 255, 255, 0.149)",
                    padding: "10px 12px",
                    gap: "8px",
                    backgroundColor: "rgba(255, 255, 255, 0.0784)",
                    backdropFilter: "blur(6px)",
                    WebkitBackdropFilter: "blur(6px)",
                    color: "#FFFFFF",
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                    fontWeight: 500,
                    fontSize: "12.5px",
                    boxSizing: "border-box",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Clock size={15} strokeWidth={2.2} color="#FFFFFF" />
                  <span>{promo.badgeText}</span>
                </div>
              </div>
            </div>

            {/* Pagination Dots */}
            <div
              style={{
                position: "absolute",
                bottom: "12px",
                left: "38%",
                transform: "translateX(-50%)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                zIndex: 3,
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                }}
              />
              <span
                style={{
                  width: "18px",
                  height: "6px",
                  borderRadius: "3px",
                  backgroundColor: "#FF6B00",
                  transition: "all 0.3s ease",
                }}
              />
            </div>

            {/* Right Graphic: 3D Scooter Rider (Fitted securely in frame) */}
            <div
              style={{
                flex: "0 0 190px",
                width: "190px",
                height: "270px",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2,
                boxSizing: "border-box",
              }}
              className="promo-scooter-wrapper"
            >
              <Image
                src={promo.imageSrc}
                alt="Delivery Rider on Scooter"
                width={190}
                height={260}
                priority
                style={{
                  width: "auto",
                  height: "100%",
                  maxHeight: "260px",
                  maxWidth: "100%",
                  objectFit: "contain",
                  filter: "drop-shadow(0 10px 20px rgba(0, 0, 0, 0.12))",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .promo-order-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12) !important;
          background-color: #FFFDF9 !important;
        }
        @media (max-width: 1200px) {
          .promo-row-container {
            flex-direction: column !important;
            height: auto !important;
            gap: 24px !important;
          }
          .promo-card {
            width: 100% !important;
            max-width: 100% !important;
          }
        }
        @media (max-width: 640px) {
          .promo-card {
            flex-direction: column !important;
            height: auto !important;
            padding: 24px 20px 32px 20px !important;
            text-align: left;
          }
          .promo-scooter-wrapper {
            margin-top: 16px;
            width: 160px !important;
            height: 160px !important;
          }
        }
      `}</style>
    </section>
  );
}
