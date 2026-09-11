"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Check } from "lucide-react";
import styles from "./ResSellerLogin.module.css";

export interface ResSellerLoginProps {
  onSuccess?: () => void;
  onboardingHref?: string;
  forgotPasswordHref?: string;
  termsHref?: string;
  privacyHref?: string;
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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage("Please enter your email and password.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: email.trim().toLowerCase(),
        password: password.trim(),
        loginType: "SELLER",
      });

      if (res?.error) {
        if (res.error === "USER_NOT_FOUND" || res.error.includes("USER_NOT_FOUND")) {
          setErrorMessage("Owner account not found. Please start onboarding.");
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
          const callbackUrl = searchParams?.get("callbackUrl") || "/seller/res/dashboard";
          router.push(callbackUrl);
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
            <label htmlFor="resOwnerPassword" className={styles.label}>
              Password
            </label>
            <div className={styles.inputWrapper}>
              <Lock size={18} className={styles.fieldIcon} />
              <input
                id="resOwnerPassword"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={styles.input}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className={styles.togglePasswordBtn}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password Row */}
          <div className={styles.optionsRow}>
            <label className={styles.checkboxContainer}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className={styles.hiddenCheckbox}
              />
              <div
                className={`${styles.customCheckbox} ${
                  rememberMe ? styles.checkboxChecked : ""
                }`}
              >
                {rememberMe && <Check size={12} strokeWidth={3.5} color="#FFFFFF" />}
              </div>
              <span className={styles.checkboxLabel}>Remember me</span>
            </label>

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
