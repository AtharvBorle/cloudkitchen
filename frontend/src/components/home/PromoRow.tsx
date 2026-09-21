"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock, ChevronLeft, ChevronRight } from "lucide-react";

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

interface PromoRowProps {
  promos?: PromoCardData[];
}

export default function PromoRow({ promos = [] }: PromoRowProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const displayPromos = promos || [];
  const totalSlides = displayPromos.length;

  if (totalSlides === 0) return null;

  const nextSlide = () => {
    setActiveIdx((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setActiveIdx((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  };

  // Auto-scroll every 5 seconds (pauses when hovered)
  useEffect(() => {
    if (totalSlides <= 1 || isHovered) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % totalSlides);
    }, 5000);
    return () => clearInterval(timer);
  }, [totalSlides, isHovered]);

  // Touch Swipe Handlers
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

  const currentPromo = displayPromos[activeIdx] || displayPromos[0];

  return (
    <section
      style={{
        width: "100%",
        padding: "0",
        background: "transparent",
        position: "relative",
      }}
      className="promo-row-section"
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
          minHeight: "324px",
          margin: "0 auto",
          position: "relative",
          boxSizing: "border-box",
        }}
        className="promo-row-container"
      >
        <div
          key={currentPromo.id || activeIdx}
          style={{
            width: "100%",
            minHeight: "324px",
            backgroundColor: "#F7C08A",
            backgroundImage: "linear-gradient(108deg, #FDE6CE 0%, #F8C38F 50%, #F5B67B 100%)",
            borderRadius: "28px",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "28px 36px 36px 36px",
            position: "relative",
            overflow: "hidden",
            boxSizing: "border-box",
            boxShadow: "0 8px 24px rgba(245, 182, 123, 0.22)",
            transition: "all 0.4s ease-in-out",
          }}
          className="promo-card promoRow1"
        >
          {/* Left Content Area */}
          <div
            style={{
              flex: "1 1 450px",
              maxWidth: "520px",
              zIndex: 2,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
              boxSizing: "border-box",
            }}
          >
            {/* Heading */}
            <h2
              style={{
                width: "100%",
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                fontWeight: 700,
                fontSize: "30px",
                lineHeight: "36px",
                letterSpacing: "-0.02em",
                background: "linear-gradient(90deg, #F97316 0%, #93440D 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                margin: "0 0 8px 0",
                display: "flex",
                alignItems: "center",
                boxSizing: "border-box",
              }}
            >
              {currentPromo.title}
            </h2>

            {/* Code */}
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
                marginBottom: "10px",
                display: "flex",
                alignItems: "center",
                boxSizing: "border-box",
              }}
            >
              Use code: <span style={{ marginLeft: "6px", fontWeight: 800, color: "#EA580C" }}>{currentPromo.code}</span>
            </div>

            {/* Description body */}
            <p
              style={{
                width: "100%",
                maxWidth: "420px",
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                fontWeight: 500,
                fontSize: "14.5px",
                lineHeight: "150%",
                color: "#7C2D12",
                margin: "0 0 20px 0",
                boxSizing: "border-box",
              }}
            >
              {currentPromo.description}
            </p>

            {/* Actions: Order Now + Hurry Badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <Link
                href={currentPromo.buttonLink}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "auto",
                  minWidth: "130px",
                  height: "44px",
                  borderRadius: "99px",
                  padding: "10px 24px",
                  backgroundColor: "#FFFFFF",
                  color: "#FF6B00",
                  fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                  fontWeight: 700,
                  fontSize: "14.5px",
                  textDecoration: "none",
                  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.08)",
                  transition: "all 0.2s ease",
                  boxSizing: "border-box",
                  whiteSpace: "nowrap",
                }}
                className="promo-order-btn"
              >
                {currentPromo.buttonText}
              </Link>

              {currentPromo.badgeText && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "auto",
                    height: "40px",
                    borderRadius: "999px",
                    border: "1px solid rgba(255, 255, 255, 0.4)",
                    padding: "8px 14px",
                    gap: "6px",
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    backdropFilter: "blur(6px)",
                    WebkitBackdropFilter: "blur(6px)",
                    color: "#7C2D12",
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                    fontWeight: 600,
                    fontSize: "12.5px",
                    boxSizing: "border-box",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Clock size={15} strokeWidth={2.2} color="#EA580C" />
                  <span>{currentPromo.badgeText}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Graphic: 3D Scooter Rider */}
          <div
            style={{
              flex: "0 0 240px",
              width: "240px",
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
              src={currentPromo.imageSrc}
              alt="Delivery Rider on Scooter"
              width={240}
              height={260}
              priority
              style={{
                width: "auto",
                height: "100%",
                maxHeight: "260px",
                maxWidth: "100%",
                objectFit: "contain",
                filter: "drop-shadow(0 10px 20px rgba(0, 0, 0, 0.15))",
              }}
            />
          </div>

          {/* Navigation Arrows */}
          {totalSlides > 1 && (
            <>
              <button
                type="button"
                onClick={prevSlide}
                aria-label="Previous Promo"
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(255, 255, 255, 0.85)",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#0F172A",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                  zIndex: 10,
                  transition: "all 0.2s ease",
                }}
                className="promo-arrow-btn"
              >
                <ChevronLeft size={20} strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={nextSlide}
                aria-label="Next Promo"
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(255, 255, 255, 0.85)",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#0F172A",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                  zIndex: 10,
                  transition: "all 0.2s ease",
                }}
                className="promo-arrow-btn"
              >
                <ChevronRight size={20} strokeWidth={2.5} />
              </button>
            </>
          )}

          {/* Interactive Pagination Dots */}
          {totalSlides > 1 && (
            <div
              style={{
                position: "absolute",
                bottom: "14px",
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                zIndex: 4,
                backgroundColor: "rgba(0, 0, 0, 0.15)",
                padding: "4px 10px",
                borderRadius: "999px",
                backdropFilter: "blur(4px)",
              }}
            >
              {displayPromos.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={() => setActiveIdx(dotIdx)}
                  aria-label={`Go to slide ${dotIdx + 1}`}
                  style={{
                    width: activeIdx === dotIdx ? "20px" : "8px",
                    height: "8px",
                    borderRadius: "4px",
                    backgroundColor: activeIdx === dotIdx ? "#FF5500" : "rgba(255, 255, 255, 0.85)",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .promo-order-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12) !important;
          background-color: #FFFDF9 !important;
        }
        .promo-arrow-btn:hover {
          background-color: #FFFFFF !important;
          color: #FF5500 !important;
          transform: translateY(-50%) scale(1.1) !important;
        }
        @media (max-width: 900px) {
          .promo-card {
            flex-direction: column !important;
            height: auto !important;
            padding: 28px 20px 48px 20px !important;
            text-align: left;
          }
          .promo-scooter-wrapper {
            margin-top: 16px;
            width: 180px !important;
            height: 180px !important;
          }
        }
      `}</style>
    </section>
  );
}
