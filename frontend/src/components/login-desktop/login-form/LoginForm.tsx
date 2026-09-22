"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { discardExistingSession } from "@/lib/logout";
import styles from "./LoginForm.module.css";
import { PhoneInput } from "@/components/common/PhoneInput/PhoneInput";
import { PasswordInput } from "@/components/common/PasswordInput/PasswordInput";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Check,
  Phone,
  Store,
} from "lucide-react";

export interface LoginFormProps {
  onSubmit?: (e: React.FormEvent) => void;
  onCreateAccount?: () => void;
  onForgotPassword?: () => void;
  onLoginWithOtp?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  onCreateAccount,
  onForgotPassword,
  onLoginWithOtp,
}) => {
  const router = useRouter();

  // Login Mode: "password" | "otp"
  const [loginMode, setLoginMode] = useState<"password" | "otp">("password");

  // Password Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // OTP Login State
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(0);

  // Form Status State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successNotice, setSuccessNotice] = useState("");

  // Refs for 6 OTP boxes
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check URL query params for registered success notice
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("registered") === "true") {
        setSuccessNotice("Account created successfully! Please sign in to continue.");
      }
    }
  }, []);

  // Timer countdown effect for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleCreateAccount = () => {
    if (onCreateAccount) {
      onCreateAccount();
    } else {
      const params = new URLSearchParams(window.location.search);
      const callbackUrl = params.get("callbackUrl");
      router.push(
        callbackUrl
          ? `/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`
          : "/signup"
      );
    }
  };

  const handleForgotPassword = () => {
    if (onForgotPassword) {
      onForgotPassword();
    } else {
      router.push("/auth/forgot-password");
    }
  };

  const handleSendOtp = () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setError("");
    setOtpSent(true);
    setResendTimer(60);
    // Focus first OTP box automatically
    setTimeout(() => {
      otpInputRefs.current[0]?.focus();
    }, 100);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-advance to next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    const nextIndex = Math.min(pastedData.length, 5);
    otpInputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(e);
      return;
    }

    setError("");
    setSuccessNotice("");

    if (loginMode === "password") {
      if (!email.trim() || !password) {
        setError("Please provide both email and password.");
        return;
      }

      setIsLoading(true);
      try {
        await discardExistingSession();
        const res = await signIn("credentials", {
          redirect: false,
          email: email.trim().toLowerCase(),
          password,
          loginType: "USER",
        });

        if (res?.error) {
          if (
            res.error === "USER_NOT_FOUND" ||
            res.error.includes("USER_NOT_FOUND")
          ) {
            setError("Account not found. Please create an account first.");
          } else if (
            res.error === "INVALID_PASSWORD" ||
            res.error.includes("INVALID_PASSWORD")
          ) {
            setError("Incorrect password. Please try again.");
          } else if (res.error.includes("ROLE_MISMATCH")) {
            setError(
              "Access denied. Business accounts must use their specific portal."
            );
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
    } else {
      // OTP mode submission
      if (!phoneNumber || phoneNumber.length < 10) {
        setError("Please enter a valid 10-digit mobile number.");
        return;
      }
      const fullOtp = otp.join("");
      if (fullOtp.length !== 6) {
        setError("Please enter the complete 6-digit verification code.");
        return;
      }

      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        const params = new URLSearchParams(window.location.search);
        const callbackUrl = params.get("callbackUrl") || "/";
        window.location.href = callbackUrl;
      }, 500);
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
            {loginMode === "password"
              ? "Sign in to continue ordering delicious meals."
              : "Enter your mobile number to receive a one-time login OTP."}
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
            {/* Smooth animated slider container */}
            <div className={styles.formContentSlider}>
              {loginMode === "password" ? (
                <div key="password-fields" className={styles.slideRight}>
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
                    <PasswordInput
                      id="password"
                      label="Password"
                      required
                      showLeftIcon
                      placeholder="Enter your password"
                      value={password}
                      onChange={(val) => setPassword(val)}
                      autoComplete="current-password"
                    />
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
                        {rememberMe && (
                          <Check
                            size={12}
                            strokeWidth={3.5}
                            color="#FFFFFF"
                          />
                        )}
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
                </div>
              ) : (
                <div key="otp-fields" className={styles.slideLeft}>
                  {/* Mobile Number Field with Send OTP Button */}
                  <div className={styles.inputGroup}>
                    <PhoneInput
                      id="phone"
                      label="Enter Mobile Number"
                      required
                      placeholder="98765 43210"
                      value={phoneNumber}
                      onChange={(val) => setPhoneNumber(val)}
                      rightAction={
                        <button
                          type="button"
                          className={styles.sendOtpBtn}
                          onClick={handleSendOtp}
                          disabled={
                            phoneNumber.length < 10 ||
                            (otpSent && resendTimer > 0)
                          }
                        >
                          {otpSent
                            ? resendTimer > 0
                              ? `Resend (${resendTimer}s)`
                              : "Resend OTP"
                            : "Send OTP"}
                        </button>
                      }
                    />
                  </div>

                  {/* 6-box OTP Input */}
                  {otpSent && (
                    <div className={`${styles.inputGroup} ${styles.slideLeft}`}>
                      <label className={styles.inputLabel}>
                        Enter 6-Digit OTP
                      </label>
                      <div
                        className={styles.otpContainer}
                        onPaste={handleOtpPaste}
                      >
                        {otp.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={(el) => {
                              otpInputRefs.current[idx] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) =>
                              handleOtpChange(idx, e.target.value)
                            }
                            onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                            className={`${styles.otpDigitInput} ${
                              digit ? styles.otpDigitFilled : ""
                            }`}
                            autoFocus={idx === 0}
                          />
                        ))}
                      </div>

                      <div className={styles.otpTimerRow}>
                        <span className={styles.otpTimerText}>
                          Didn&apos;t receive code?
                        </span>
                        <button
                          type="button"
                          className={styles.resendBtn}
                          onClick={handleSendOtp}
                          disabled={resendTimer > 0}
                        >
                          {resendTimer > 0
                            ? `Resend code in ${resendTimer}s`
                            : "Resend OTP"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              className={styles.signInBtn}
              disabled={isLoading}
            >
              <span>
                {isLoading
                  ? "Signing In..."
                  : loginMode === "password"
                  ? "Sign In"
                  : "Verify & Sign In"}
              </span>
              <ArrowRight size={18} strokeWidth={2.4} />
            </button>

            {/* Or Divider */}
            <div className={styles.orDivider}>
              <span className={styles.orText}>or</span>
            </div>

            {/* Login with OTP / Login with Password toggle */}
            <div className={styles.loginWithOtpWrapper}>
              {loginMode === "password" ? (
                <button
                  type="button"
                  className={styles.loginWithOtpBtn}
                  onClick={() => {
                    setLoginMode("otp");
                    setError("");
                    if (onLoginWithOtp) onLoginWithOtp();
                  }}
                >
                  Login with OTP
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.loginWithOtpBtn}
                  onClick={() => {
                    setLoginMode("password");
                    setError("");
                  }}
                >
                  Login with Password
                </button>
              )}
            </div>

            {/* Seller Portal Link */}
            <div
              style={{
                marginTop: "16px",
                paddingTop: "14px",
                borderTop: "1px dashed #E2E8F0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                fontSize: "12.5px",
                color: "#64748B",
              }}
            >
              <Store size={14} color="#EA580C" />
              <span>Partner with us?</span>
              <Link
                href="/seller/login"
                style={{
                  color: "#EA580C",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Seller Portal
              </Link>
              <span>or</span>
              <Link
                href="/seller/registration"
                style={{
                  color: "#EA580C",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Register
              </Link>
            </div>
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
