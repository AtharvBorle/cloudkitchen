"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

export interface SignUpLeftComponentProps {
  logoText?: string;
  heading?: string;
  subtitle?: string;
  testimonialQuote?: string;
  testimonialAuthor?: string;
  testimonialRole?: string;
  avatarSrc?: string;
  bgImageSrc?: string;
  logoSrc?: string;
}

export default function SignUpLeftComponent({
  logoText = "NEO CLOUD BITES",
  heading = "Join the table for premium healthy meals.",
  subtitle = "Create an account to gain access to exclusive member-only recipes, 25-minute lightning delivery, and tailored meal subscription plans.",
  testimonialQuote = "The weekly salad subscription completely fixed my diet. Unbelievable taste and top-notch quality ingredients.",
  testimonialAuthor = "Karan M.",
  testimonialRole = "Health & Fitness Coach",
  avatarSrc = "/images/auth/coach-avatar.png",
  bgImageSrc = "/images/auth/signup-bg.jpg",
  logoSrc = "/images/auth/neo-cloud-logo.png",
}: SignUpLeftComponentProps) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "680px",
        minHeight: "900px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px",
        overflow: "hidden",
        boxSizing: "border-box",
        fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
      }}
      className="signup-left-container"
    >
      {/* Background Image */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
      >
        <Image
          src={bgImageSrc}
          alt="Premium healthy meal salad bowl"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 680px"
          style={{
            objectFit: "cover",
            objectPosition: "center",
          }}
        />
        {/* Background Overlay (#1A1A2E73) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(26, 26, 46, 0.45)",
          }}
        />
      </div>

      {/* 1. Top Logo Section (Width: ~256px, Height: 66px, Gap: 12px) */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          height: "66px",
        }}
      >
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "12px",
            textDecoration: "none",
            height: "100%",
          }}
        >
          {/* Logo Graphic Image */}
          <div
            style={{
              position: "relative",
              width: "56px",
              height: "56px",
              minWidth: "56px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Image
              src={logoSrc}
              alt="Neo Cloud Bites Logo"
              width={56}
              height={56}
              style={{ objectFit: "contain" }}
              priority
            />
          </div>

          <span
            style={{
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: "22px",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
              whiteSpace: "nowrap",
            }}
          >
            {logoText}
          </span>
        </Link>
      </div>

      {/* 2. Hero Content Section (Width: 552px, Gap: 24px) */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          width: "100%",
          maxWidth: "552px",
          margin: "32px 0",
        }}
      >
        {/* Main Headline */}
        <h1
          style={{
            width: "100%",
            maxWidth: "552px",
            fontSize: "48px",
            fontWeight: 600,
            lineHeight: "56px",
            letterSpacing: "0%",
            color: "#FFFFFF",
            margin: 0,
            fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
          }}
        >
          {heading}
        </h1>

        {/* Subtitle */}
        <p
          style={{
            width: "100%",
            maxWidth: "552px",
            fontSize: "18px",
            fontWeight: 400,
            lineHeight: "28px",
            letterSpacing: "0%",
            color: "#FFF9F5",
            opacity: 0.9,
            margin: 0,
            fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
          }}
        >
          {subtitle}
        </p>

        {/* Frosted Testimonial Card (Width: 552px, Height: 104px, Padding: 20px, Gap: 16px, Blur: 12px) */}
        <div
          style={{
            width: "100%",
            maxWidth: "552px",
            minHeight: "104px",
            backgroundColor: "#00000040",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderRadius: "20px",
            padding: "20px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            boxSizing: "border-box",
          }}
          className="signup-testimonial-card"
        >
          {/* Avatar */}
          <div
            style={{
              position: "relative",
              width: "56px",
              height: "56px",
              minWidth: "56px",
              borderRadius: "50%",
              overflow: "hidden",
              border: "2px solid rgba(255, 255, 255, 0.85)",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            }}
          >
            <Image
              src={avatarSrc}
              alt={testimonialAuthor}
              fill
              sizes="56px"
              style={{ objectFit: "cover" }}
            />
          </div>

          {/* Testimonial Quote & Author */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              maxWidth: "448px",
            }}
          >
            <p
              style={{
                width: "100%",
                maxWidth: "448px",
                fontSize: "14px",
                fontWeight: 500,
                fontStyle: "italic",
                lineHeight: "1.4",
                letterSpacing: "0%",
                color: "#FFFFFF",
                margin: 0,
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
              }}
            >
              &ldquo;{testimonialQuote}&rdquo;
            </p>
            <div
              style={{
                fontSize: "12px",
                fontWeight: 600,
                lineHeight: "100%",
                letterSpacing: "0%",
                color: "#F97316",
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
              }}
            >
              {testimonialAuthor} • {testimonialRole}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Footer (Width: 275px, Height: 20px, Font: 13px, Color: #FFFFFF80) */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: "275px",
          height: "20px",
          fontSize: "13px",
          fontWeight: 400,
          lineHeight: "100%",
          letterSpacing: "0%",
          color: "rgba(255, 255, 255, 0.5)",
          fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
        }}
      >
        &copy; 2026 Neo Cloud Bites. All rights reserved.
      </div>

      <style jsx>{`
        @media (max-width: 1024px) {
          .signup-left-container {
            padding: 40px 24px !important;
            min-height: 520px !important;
            max-width: 100% !important;
          }
          h1 {
            font-size: 34px !important;
            line-height: 42px !important;
          }
          p {
            font-size: 16px !important;
            line-height: 24px !important;
          }
        }
      `}</style>
    </div>
  );
}
