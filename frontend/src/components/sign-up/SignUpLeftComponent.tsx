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
}: SignUpLeftComponentProps) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "48px 56px",
        overflow: "hidden",
        boxSizing: "border-box",
        fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
      }}
      className="signup-left-container"
    >
      {/* Background Image with Dark Contrast Overlay */}
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
          sizes="(max-width: 1024px) 100vw, 50vw"
          style={{
            objectFit: "cover",
            objectPosition: "center 70%",
          }}
        />
        {/* Dark Translucent Gradient Overlay for optimal readability */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(180deg, rgba(15, 23, 42, 0.45) 0%, rgba(15, 23, 42, 0.58) 45%, rgba(15, 23, 42, 0.82) 100%)",
          }}
        />
      </div>

      {/* Top Header: Logo + Brand Name */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "12px",
            textDecoration: "none",
          }}
        >
          {/* Circular Badge Icon */}
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              backgroundColor: "#E11D48",
              backgroundImage: "linear-gradient(135deg, #FF5500 0%, #DC2626 100%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(225, 29, 72, 0.35)",
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: "12px",
              lineHeight: 1,
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: "10px", opacity: 0.9 }}>Neo</span>
            <span style={{ fontSize: "11px", fontWeight: 900 }}>Cloud</span>
          </div>

          <span
            style={{
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: "18px",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
            }}
          >
            {logoText}
          </span>
        </Link>
      </div>

      {/* Middle Content: Heading + Subtitle + Testimonial Card */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          maxWidth: "540px",
          margin: "48px 0",
        }}
      >
        {/* Main Headline */}
        <h1
          style={{
            fontSize: "44px",
            fontWeight: 800,
            lineHeight: "1.16",
            letterSpacing: "-0.5px",
            color: "#FFFFFF",
            margin: 0,
            fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
            textShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
          }}
        >
          {heading}
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "16px",
            fontWeight: 400,
            lineHeight: "1.6",
            color: "rgba(255, 255, 255, 0.9)",
            margin: 0,
            fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
          }}
        >
          {subtitle}
        </p>

        {/* Frosted Testimonial Card */}
        <div
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.55)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            borderRadius: "20px",
            padding: "18px 22px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginTop: "8px",
            boxShadow: "0 12px 32px rgba(0, 0, 0, 0.3)",
          }}
          className="signup-testimonial-card"
        >
          {/* Avatar */}
          <div
            style={{
              position: "relative",
              width: "52px",
              height: "52px",
              minWidth: "52px",
              borderRadius: "50%",
              overflow: "hidden",
              border: "2px solid rgba(255, 255, 255, 0.8)",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            }}
          >
            <Image
              src={avatarSrc}
              alt={testimonialAuthor}
              fill
              sizes="52px"
              style={{ objectFit: "cover" }}
            />
          </div>

          {/* Testimonial Quote & Author */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <p
              style={{
                fontSize: "13.5px",
                fontWeight: 400,
                fontStyle: "italic",
                lineHeight: "1.48",
                color: "#FFFFFF",
                margin: 0,
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
              }}
            >
              &ldquo;{testimonialQuote}&rdquo;
            </p>
            <div
              style={{
                fontSize: "12.5px",
                fontWeight: 700,
                color: "#F97316",
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
              }}
            >
              {testimonialAuthor} • {testimonialRole}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer: Copyright */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          fontSize: "12.5px",
          color: "rgba(255, 255, 255, 0.55)",
          fontWeight: 400,
          fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
        }}
      >
        &copy; 2026 Neo Cloud Bites. All rights reserved.
      </div>

      <style jsx>{`
        @media (max-width: 900px) {
          .signup-left-container {
            padding: 36px 24px !important;
            min-height: 520px !important;
          }
          h1 {
            font-size: 32px !important;
          }
        }
      `}</style>
    </div>
  );
}
