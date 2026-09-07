"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { signIn } from "next-auth/react";
import styles from "./SellerLogin.module.css";

export interface SellerLoginProps {
  onSuccess?: () => void;
  forgotPasswordHref?: string;
  createAccountHref?: string;
}

export const SellerLogin: React.FC<SellerLoginProps> = ({
  onSuccess,
  forgotPasswordHref = "/auth/forgot-password?type=seller",
  createAccountHref = "/seller/registration",
}) => {
  const router = useRouter();
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setErrorMessage("Please enter your email/phone and password.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: identifier.trim(),
        password: password.trim(),
        loginType: "SELLER",
      });

      if (res?.error) {
        if (res.error === "USER_NOT_FOUND" || res.error.includes("USER_NOT_FOUND")) {
          setErrorMessage("Account not found. Please create an account.");
        } else if (res.error === "INVALID_PASSWORD" || res.error.includes("INVALID_PASSWORD")) {
          setErrorMessage("Incorrect password. Please try again.");
        } else if (res.error.includes("ROLE_MISMATCH_SELLER")) {
          setErrorMessage("Access denied. Only Seller accounts can log in here.");
        } else {
          setErrorMessage("Invalid login credentials.");
        }
      } else {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/seller/dashboard");
        }
      }
    } catch (err) {
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.screenWrapper}>
      <div className={styles.mobileFrame}>
        {/* Top Content: Logo & Title */}
        <div className={styles.headerArea}>
          <div className={styles.logoBadge}>
            <Image
              src="/images/seller-login-badge.png"
              alt="Neo Cloud Bite Logo Badge"
              width={64}
              height={64}
              className={styles.badgeImage}
              priority
            />
          </div>
          <h1 className={styles.title}>Owner Login</h1>
        </div>


        {/* Form Card */}
        <form onSubmit={handleSubmit} className={styles.formCard}>
          {errorMessage && (
            <div className={styles.errorMessage} role="alert">
              {errorMessage}
            </div>
          )}

          {/* Email or Phone Field */}
          <div className={styles.fieldGroup}>
            <label htmlFor="identifierInput" className={styles.label}>
              Email or Phone Number <span className={styles.requiredStar}>*</span>
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="identifierInput"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter your email or phone"
                className={styles.input}
                required
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className={styles.fieldGroup}>
            <label htmlFor="passwordInput" className={styles.label}>
              Password <span className={styles.requiredStar}>*</span>
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="passwordInput"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className={`${styles.input} ${styles.inputWithIcon}`}
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

          {/* Forgot Password Link */}
          <div className={styles.forgotPasswordRow}>
            <Link href={forgotPasswordHref} className={styles.forgotPasswordLink}>
              Forgot password?
            </Link>
          </div>

          {/* Submit Log in Button */}
          <button
            type="submit"
            disabled={loading}
            className={styles.loginBtn}
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        {/* Bottom Section: Divider & Create Account */}
        <div className={styles.bottomSection}>
          <div className={styles.dividerRow}>
            <div className={styles.dividerLine} />
            <span className={styles.dividerText}>New seller?</span>
          </div>


          <Link href={createAccountHref} className={styles.createAccountBtn}>
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SellerLogin;
