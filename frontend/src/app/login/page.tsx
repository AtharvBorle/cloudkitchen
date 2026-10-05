"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { LoginHero } from "@/components/login-desktop/login-hero";
import { LoginForm } from "@/components/login-desktop/login-form";

import styles from "./LoginPage.module.css";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const [isExplicitLogout, setIsExplicitLogout] = React.useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isLoggedOut = new URLSearchParams(window.location.search).get("logged_out") === "true";
      if (isLoggedOut) {
        setIsExplicitLogout(true);
        return;
      }
    }

    if (status === "authenticated" && session?.user) {
      const role = ((session.user as any)?.role || "USER").toUpperCase();
      const target = role === "SELLER" ? "/seller/dashboard" : "/";
      window.location.replace(target);
    }
  }, [status, session]);

  if (!isExplicitLogout && status === "authenticated" && session?.user) {
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

