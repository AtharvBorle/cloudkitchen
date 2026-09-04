"use client";

import React from "react";
import { LoginHero } from "@/components/login-desktop/login-hero";
import { LoginForm } from "@/components/login-desktop/login-form";

export default function LoginDesktopPage() {
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        maxHeight: "100vh",
        width: "100vw",
        backgroundColor: "#FFF4E6",
        overflow: "hidden",
      }}
    >
      {/* Left Column: Visual Hero Banner with Logo & Testimonial */}
      <LoginHero />

      {/* Right Column: Sign In Card & Actions */}
      <LoginForm />
    </div>
  );
}
