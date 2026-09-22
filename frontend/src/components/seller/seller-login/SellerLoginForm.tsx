"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Check } from "lucide-react";
import { PasswordInput } from "@/components/common/PasswordInput/PasswordInput";
import { fetchApi } from "@/lib/fetch-api";
import { updateCachedProfile } from "@/hooks/useSellerProfile";
import { discardExistingSession } from "@/lib/logout";
import styles from "./SellerLogin.module.css";

export interface SellerLoginFormProps {
  onSuccess?: () => void;
  onboardingHref?: string;
  forgotPasswordHref?: string;
  termsHref?: string;
  privacyHref?: string;
}

export const SellerLoginForm: React.FC<SellerLoginFormProps> = ({
  onSuccess,
  onboardingHref = "/seller/registration",
  forgotPasswordHref = "/auth/forgot-password?type=seller",
  termsHref = "/terms",
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
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      await discardExistingSession();
      const res = await signIn("credentials", {
        redirect: false,
        email: email.trim().toLowerCase(),
        password: password.trim(),
        loginType: "SELLER",
      });

      if (res?.error) {
        if (res.error === "USER_NOT_FOUND" || res.error.includes("USER_NOT_FOUND")) {
          setErrorMessage("Seller account not found. Please start onboarding.");
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
              const vStatus = profile?.verificationStatus;

              updateCachedProfile({
                user,
                profile,
                isOnline: profile?.isOnline ?? true,
              });

              const explicitCallback = searchParams?.get("callbackUrl");

              if (vStatus === "APPROVED") {
                router.push(explicitCallback || "/seller/dashboard");
              } else if (vStatus === "REVISION") {
                router.push(
                  explicitCallback && explicitCallback.startsWith("/seller/revision")
                    ? explicitCallback
                    : "/seller/revision"
                );
              } else if (vStatus === "REJECTED" || vStatus === "PENDING") {
                router.push(
                  explicitCallback &&
                    (explicitCallback.startsWith("/seller/verification") ||
                      explicitCallback.startsWith("/seller/registration"))
                    ? explicitCallback
                    : "/seller/verification-status"
                );
              } else {
                router.push(explicitCallback || "/seller/verification-status");
              }
            } else {
              router.push("/seller/registration");
            }
          } catch (routeErr) {
            console.error("Post-login status check error:", routeErr);
            router.push("/seller/verification-status");
          }
        }
      }
    } catch (err) {
      setErrorMessage("An unexpected network error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className={styles.formColumn} aria-label="Owner sign in form">
      {/* Top Header Row */}
      <div className={styles.topNav}>
        <span className={styles.topNavText}>New to Neo Cloud Room?</span>
        <Link href={onboardingHref} className={styles.onboardingBtn}>
          Start Onboarding
        </Link>
      </div>

      {/* Center Login Card */}
      <div className={styles.formCenterArea}>
        <div className={styles.loginCard}>
          <h2 className={styles.cardTitle}>Owner Login</h2>
          <p className={styles.cardSubtitle}>
            Sign in to manage your cloud kitchen, orders, and onboarding.
          </p>

          <form onSubmit={handleSubmit} className={styles.form}>
            {errorMessage && (
              <div className={styles.errorMessage} role="alert">
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Owner Email Field */}
            <div className={styles.inputGroup}>
              <label htmlFor="ownerEmail" className={styles.inputLabel}>
                Owner Email
              </label>
              <div className={styles.inputWrapper}>
                <Mail size={18} className={styles.inputIcon} />
                <input
                  id="ownerEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@cloudkitchen.com"
                  className={styles.textInput}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className={styles.inputGroup}>
              <PasswordInput
                id="ownerPassword"
                label="Password"
                required
                showLeftIcon
                placeholder="••••••••"
                value={password}
                onChange={(val) => setPassword(val)}
                autoComplete="current-password"
              />
            </div>

            {/* Options Row: Remember Me & Forgot Password */}
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
              className={styles.submitBtn}
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
        </div>
      </div>

      {/* Bottom Terms & Privacy Policy Note */}
      <footer className={styles.formFooter}>
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
    </section>
  );
};

export default SellerLoginForm;
