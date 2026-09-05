"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import styles from "./LoginForm.module.css";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Check, Phone, KeyRound } from "lucide-react";

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

  // Refs for 6 OTP boxes
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  const handleSendOtp = () => {
    if (!phoneNumber || phoneNumber.length < 10) return;
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
    // Take only last character typed
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-advance to next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    const nextIndex = Math.min(pastedData.length, 5);
    otpInputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(e);
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
            onClick={onCreateAccount}
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
                      onClick={onForgotPassword}
                    >
                      Forgot Password?
                    </button>
                  </div>
                </div>
              ) : (
                <div key="otp-fields" className={styles.slideLeft}>
                  {/* Mobile Number Field with Send OTP Button */}
                  <div className={styles.inputGroup}>
                    <label htmlFor="phone" className={styles.inputLabel}>
                      Enter Mobile Number
                    </label>
                    <div className={styles.phoneInputWrapper}>
                      <Phone size={18} className={styles.fieldIcon} />
                      <span className={styles.countryCode}>+91</span>
                      <input
                        id="phone"
                        type="tel"
                        maxLength={10}
                        placeholder="Enter 10-digit number"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                        className={`${styles.textInput} ${styles.phoneTextInput}`}
                        required
                      />
                      <button
                        type="button"
                        className={styles.sendOtpBtn}
                        onClick={handleSendOtp}
                        disabled={phoneNumber.length < 10 || (otpSent && resendTimer > 0)}
                      >
                        {otpSent ? (resendTimer > 0 ? `Resend (${resendTimer}s)` : "Resend OTP") : "Send OTP"}
                      </button>
                    </div>
                  </div>

                  {/* 6-box OTP Input */}
                  {otpSent && (
                    <div className={`${styles.inputGroup} ${styles.slideLeft}`}>
                      <label className={styles.inputLabel}>Enter 6-Digit OTP</label>
                      <div className={styles.otpContainer} onPaste={handleOtpPaste}>
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
                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                            className={`${styles.otpDigitInput} ${digit ? styles.otpDigitFilled : ""}`}
                            autoFocus={idx === 0}
                          />
                        ))}
                      </div>

                      <div className={styles.otpTimerRow}>
                        <span className={styles.otpTimerText}>Didn't receive code?</span>
                        <button
                          type="button"
                          className={styles.resendBtn}
                          onClick={handleSendOtp}
                          disabled={resendTimer > 0}
                        >
                          {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend OTP"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sign In Button */}
            <button type="submit" className={styles.signInBtn}>
              <span>{loginMode === "password" ? "Sign In" : "Verify & Sign In"}</span>
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
                    if (onLoginWithOtp) onLoginWithOtp();
                  }}
                >
                  Login with OTP
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.loginWithOtpBtn}
                  onClick={() => setLoginMode("password")}
                >
                  Login with Password
                </button>
              )}
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
