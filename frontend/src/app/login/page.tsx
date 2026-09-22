"use client";

import React from "react";
import { LoginHero } from "@/components/login-desktop/login-hero";
import { LoginForm } from "@/components/login-desktop/login-form";

import styles from "./LoginPage.module.css";

export default function LoginPage() {
  return (
    <div className={styles.pageContainer}>
      {/* Left Column: Visual Hero Banner with Logo & Testimonial */}
      <LoginHero />

      {/* Right Column: Sign In Card & Actions */}
      <LoginForm />
    </div>
  );
}
