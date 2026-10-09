"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Check } from "lucide-react";
import { PasswordInput } from "@/components/common/PasswordInput/PasswordInput";
import { fetchApi } from "@/lib/fetch-api";
import { updateCachedProfile } from "@/hooks/useSellerProfile";
import { clearAllAuthData } from "@/lib/logout";
import { validateEmail } from "@/lib/email-validation";
import styles from "./ResSellerLogin.module.css";

export interface ResSellerLoginProps {
  onSuccess?: () => void;
  onboardingHref?: string;
  forgotPasswordHref?: string;
  termsHref?: string;
  privacyHref?: string;
}

function getSafeSellerCallback(callbackUrl: string | null | undefined, defaultPath = "/seller/res/dashboard"): string {
  if (!callbackUrl) return defaultPath;
  try {
    const decoded = decodeURIComponent(callbackUrl);
    if (
      decoded.includes("/registration") ||
      decoded.includes("/account-information") ||
      decoded.includes("/business-information") ||
      decoded.includes("/verification-status") ||
      decoded.includes("/verification") ||
      decoded.includes("/confirm-registration") ||
      decoded.includes("/login")
    ) {
      return defaultPath;
    }
    if (decoded.startsWith("/seller") || decoded.startsWith("/dashboard")) {
      return decoded;
    }
  } catch {
    return defaultPath;
  }
  return defaultPath;
}

export const ResSellerLogin: React.FC<ResSellerLoginProps> = ({
  onSuccess,
  onboardingHref = "/seller/registration",
  forgotPasswordHref = "/auth/forgot-password?type=seller",
  termsHref = "/seller/tc",
  privacyHref = "/privacy",
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: authStatus } = useSession();

  useEffect(() => {
    if (authStatus === "authenticated" && session?.user?.role === "SELLER") {
      const explicitCallback = searchParams?.get("callbackUrl");
      const safeDestination = getSafeSellerCallback(explicitCallback, "/seller/res/dashboard");
      window.location.replace(safeDestination);
    }
  }, [authStatus, session, searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (authStatus === "loading") {
    return <div className={styles.pageContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#FFFBF7' }}>Loading...</div>;
  }

  if (authStatus === "authenticated" && session?.user?.role === "SELLER") {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setErrorMessage(emailValidation.error || "Please enter a valid email address.");
      return;
    }
    if (!password) {
      setErrorMessage("Password is required.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      clearAllAuthData();
      const res = await signIn("credentials", {
        redirect: false,
        email: emailValidation.normalizedEmail,
        password: password.trim(),
        loginType: "SELLER",
        callbackUrl: "/seller/res/dashboard",
      });

      if (res?.error) {
        if (res.error === "USER_NOT_FOUND" || res.error.includes("USER_NOT_FOUND")) {
          setErrorMessage("Owner account not found. Please start onboarding.");
        } else if (res.error.includes("ACCOUNT_DELETED")) {
          setErrorMessage("This seller account has been permanently deleted.");
        } else if (res.error === "INVALID_PASSWORD" || res.error.includes("INVALID_PASSWORD")) {
          setErrorMessage("Incorrect password. Please try again.");
        } else if (res.error.includes("ROLE_MISMATCH")) {
          setErrorMessage("Access denied. This portal is strictly for Seller/Owner accounts.");
        } else {
          setErrorMessage("Invalid credentials. Please verify your email and password.");
        }
      } else {
        if (onSuccess) {
          onSuccess();
        } else {
          try {
            const profRes = await fetchApi("/api/seller/profile");
            if (profRes.ok) {
              const profJson = await profRes.json();
              const user = profJson.data?.user || profJson.user;
              const profile = profJson.data?.profile || profJson.profile;

              updateCachedProfile({
                user,
                profile,
                isOnline: profile?.isOnline ?? true,
              });
            }
          } catch (routeErr) {
            console.warn("Post-login status check error:", routeErr);
          }

          const explicitCallback = searchParams?.get("callbackUrl");
          const safeDestination = getSafeSellerCallback(explicitCallback, "/seller/res/dashboard");
          window.location.replace(safeDestination);
        }
      }
    } catch (err) {
      setErrorMessage("An unexpected network error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.screenWrapper}>
      <div className={styles.mobileFrame}>
        {/* Top Header: Logo & Title */}
        <header className={styles.headerArea}>
          <Link href="/" className={styles.logoBadgeWrapper} aria-label="Neo Cloud Bites Home">
            <div className={styles.logoBadge}>
              <Image
                src="/images/seller-login-badge.png"
                alt="Neo Cloud Bites Logo"
                width={56}
                height={56}
                className={styles.badgeImage}
                priority
              />
            </div>
          </Link>
          <span className={styles.brandLabel}>Neo Cloud Bites</span>
          <h1 className={styles.title}>Owner Login</h1>
          <p className={styles.subtitle}>
            Sign in to manage your cloud kitchen, orders, and onboarding.
          </p>
        </header>

        {/* Login Form Card */}
        <form onSubmit={handleSubmit} className={styles.formCard}>
          {errorMessage && (
            <div className={styles.errorMessage} role="alert">
              {errorMessage}
            </div>
          )}

          {/* Owner Email Field */}
          <div className={styles.fieldGroup}>
            <label htmlFor="resOwnerEmail" className={styles.label}>
              Owner Email
            </label>
            <div className={styles.inputWrapper}>
              <Mail size={18} className={styles.fieldIcon} />
              <input
                id="resOwnerEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@cloudkitchen.com"
                className={styles.input}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className={styles.fieldGroup}>
            <PasswordInput
              id="resOwnerPassword"
              label="Password"
              required
              showLeftIcon
              placeholder="••••••••"
              value={password}
              onChange={(val) => setPassword(val)}
              autoComplete="current-password"
            />
          </div>

          {/* Forgot Password Link */}
          <div className={styles.optionsRow} style={{ justifyContent: "flex-end" }}>
            <Link href={forgotPasswordHref} className={styles.forgotPasswordLink}>
              Forgot Password?
            </Link>
          </div>

          {/* Submit Sign In Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={styles.loginBtn}
          >
            {isLoading ? (
              <div className={styles.spinner} aria-label="Loading" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={18} strokeWidth={2.4} />
              </>
            )}
          </button>
        </form>

        {/* Bottom Section: Divider & Onboarding CTA */}
        <div className={styles.bottomSection}>
          <div className={styles.dividerRow}>
            <div className={styles.dividerLine} />
            <span className={styles.dividerText}>New to Neo Cloud Room?</span>
          </div>

          <Link href={onboardingHref} className={styles.onboardingBtn}>
            Start Onboarding
          </Link>
        </div>

        {/* Footer Legal Terms */}
        <footer className={styles.footerArea}>
          <p className={styles.legalText}>
            By signing in, you agree to our{" "}
            <Link href={termsHref} className={styles.legalLink}>
              Owner Terms of Service
            </Link>{" "}
            and{" "}
            <Link href={privacyHref} className={styles.legalLink}>
              Privacy Policy
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default ResSellerLogin;
