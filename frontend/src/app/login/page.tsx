"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { LoginHero } from "@/components/login-desktop/login-hero";
import { LoginForm } from "@/components/login-desktop/login-form";

import styles from "./LoginPage.module.css";

export default function LoginPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const role = ((session.user as any)?.role || "USER").toUpperCase();
      const target = role === "SELLER" ? "/seller/dashboard" : "/";
      window.location.replace(target);
    }
  }, [status, session]);

  if (status === "authenticated" && session?.user) {
    return null;
  }

  return (
    <div className={styles.pageContainer}>
      {/* Left Column: Visual Hero Banner with Logo & Testimonial */}
      <LoginHero />

      {/* Right Column: Sign In Card & Actions */}
      <LoginForm />
    </div>
  );
}

