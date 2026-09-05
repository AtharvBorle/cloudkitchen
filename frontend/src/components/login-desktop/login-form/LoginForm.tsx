"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import styles from "./LoginForm.module.css";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Check } from "lucide-react";

export interface LoginFormProps {
  onSubmit?: (e: React.FormEvent) => void;
  onCreateAccount?: () => void;
  onForgotPassword?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  onCreateAccount,
  onForgotPassword,
}) => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successNotice, setSuccessNotice] = useState("");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("registered") === "true") {
        setSuccessNotice("Account created successfully! Please sign in to continue.");
      }
    }
  }, []);

  const handleCreateAccount = () => {
    if (onCreateAccount) {
      onCreateAccount();
    } else {
      const params = new URLSearchParams(window.location.search);
      const callbackUrl = params.get("callbackUrl");
      router.push(callbackUrl ? `/signup?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/signup");
    }
  };

  const handleForgotPassword = () => {
    if (onForgotPassword) {
      onForgotPassword();
    } else {
      router.push("/auth/forgot-password");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(e);
      return;
    }

    if (!email.trim() || !password) {
      setError("Please provide both email and password.");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccessNotice("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: email.trim().toLowerCase(),
        password,
        loginType: "USER",
      });

      if (res?.error) {
        if (res.error === "USER_NOT_FOUND" || res.error.includes("USER_NOT_FOUND")) {
          setError("Account not found. Please create an account first.");
        } else if (res.error === "INVALID_PASSWORD" || res.error.includes("INVALID_PASSWORD")) {
          setError("Incorrect password. Please try again.");
        } else if (res.error.includes("ROLE_MISMATCH")) {
          setError("Access denied. Business accounts must use their specific portal.");
        } else {
          setError("Invalid email or password.");
        }
      } else {
        const params = new URLSearchParams(window.location.search);
        const callbackUrl = params.get("callbackUrl") || "/";
        window.location.href = callbackUrl;
      }
    } catch (err) {
      window.location.href = "/";
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      {/* Center Content Wrapper */}
      <div className={styles.centerWrapper}>
        {/* 1. Top Bar aligned with card edges */}
        <div className={styles.topBar}>
          <span className={styles.newToText}>New to Neo Cloud Bites?</span>
          <button
            type="button"
            className={styles.createAccountBtn}
            onClick={handleCreateAccount}
          >
            Create Account
          </button>
        </div>

        {/* 2. Main Login Card */}
        <div className={styles.loginCard}>
          <h2 className={styles.cardHeading}>Welcome Back!</h2>
          <p className={styles.cardSubheading}>
            Sign in to continue ordering delicious meals.
          </p>

          {error && <div className={styles.errorMessage}>{error}</div>}
          {successNotice && (
            <div
              style={{
                backgroundColor: "#F0FDF4",
                border: "1px solid #86EFAC",
                color: "#166534",
                padding: "10px 14px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 500,
                marginBottom: "12px",
              }}
            >
              {successNotice}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Email Field */}
            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.inputLabel}>
                Email Address
              </label>
              <div className={styles.inputWrapper}>
                <Mail size={18} className={styles.fieldIcon} />
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.textInput}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.inputLabel}>
                Password
              </label>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.fieldIcon} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.textInput}
                  required
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <Eye size={18} className={styles.eyeIcon} />
                  ) : (
                    <EyeOff size={18} className={styles.eyeIcon} />
                  )}
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

              <button
                type="button"
                className={styles.forgotBtn}
                onClick={handleForgotPassword}
              >
                Forgot Password?
              </button>
            </div>

            {/* Sign In Button */}
            <button type="submit" className={styles.signInBtn} disabled={isLoading}>
              <span>{isLoading ? "Signing In..." : "Sign In"}</span>
              <ArrowRight size={18} strokeWidth={2.4} />
            </button>
          </form>
        </div>

        {/* 3. Bottom Security Note */}
        <div className={styles.securityNote}>
          <ShieldCheck size={16} className={styles.securityIcon} />
          <span>Secure 256-bit SSL encrypted connection</span>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
