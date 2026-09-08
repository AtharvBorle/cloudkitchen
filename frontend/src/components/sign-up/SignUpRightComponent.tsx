"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Phone,
  CheckCircle2,
  RefreshCw,
  Edit3,
} from "lucide-react";
import { fetchApi } from "@/lib/fetch-api";

export interface SignUpRightComponentProps {
  signInUrl?: string;
  onSuccessRedirect?: string;
}

export default function SignUpRightComponent({
  signInUrl = "/login",
  onSuccessRedirect = "/explore-desktop",
}: SignUpRightComponentProps) {
  const router = useRouter();

  // Form Fields State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP Verification State
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [otpError, setOtpError] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);

  // Overall Form State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Refs for 6 OTP input boxes
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Resend OTP countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  // Handle Mobile Number Input
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(raw);
    if (otpSent || otpVerified) {
      setOtpSent(false);
      setOtpVerified(false);
      setOtpDigits(["", "", "", "", "", ""]);
      setOtpError("");
    }
  };

  // Send 6-Digit OTP
  const handleSendOtp = () => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setError("");
    setOtpSending(true);
    setOtpError("");

    // Simulate sending OTP & generate 6-digit code
    setTimeout(() => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);
      setOtpSent(true);
      setOtpVerified(false);
      setOtpDigits(["", "", "", "", "", ""]);
      setResendTimer(30);
      setOtpSending(false);

      // Focus first OTP input after render
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    }, 400);
  };

  // Handle individual digit input
  const handleOtpDigitChange = (index: number, value: string) => {
    // If user pasted multi-digit text
    const numericChars = value.replace(/\D/g, "");
    if (numericChars.length > 1) {
      handlePasteDigits(numericChars);
      return;
    }

    const digit = numericChars.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);
    setOtpError("");

    // Move to next input if digit entered
    if (digit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // Auto verify if all 6 digits are entered
    if (digit && index === 5) {
      const fullCode = newDigits.join("");
      if (fullCode.length === 6) {
        verifyCode(fullCode);
      }
    }
  };

  // Handle Paste event for OTP
  const handlePasteDigits = (pastedText: string) => {
    const digits = pastedText.replace(/\D/g, "").slice(0, 6).split("");
    const newDigits = ["", "", "", "", "", ""];
    digits.forEach((d, i) => {
      newDigits[i] = d;
    });
    setOtpDigits(newDigits);
    setOtpError("");

    const lastFilledIndex = Math.min(digits.length, 5);
    otpInputsRef.current[lastFilledIndex]?.focus();

    if (digits.length === 6) {
      verifyCode(newDigits.join(""));
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    handlePasteDigits(pastedData);
  };

  // Handle Backspace / Navigation in OTP inputs
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        const newDigits = [...otpDigits];
        newDigits[index - 1] = "";
        setOtpDigits(newDigits);
        otpInputsRef.current[index - 1]?.focus();
      } else {
        const newDigits = [...otpDigits];
        newDigits[index] = "";
        setOtpDigits(newDigits);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  // Quick-fill helper for demo testing
  const handleQuickFill = () => {
    const code = generatedOtp || "123456";
    const digits = code.split("");
    setOtpDigits(digits);
    verifyCode(code);
  };

  // Verify the 6-Digit Code
  const verifyCode = (code: string) => {
    setOtpVerifying(true);
    setOtpError("");

    setTimeout(() => {
      if (code === generatedOtp || code === "123456") {
        setOtpVerified(true);
        setOtpError("");
      } else {
        setOtpError("Invalid 6-digit verification code. Please try again.");
      }
      setOtpVerifying(false);
    }, 300);
  };

  const handleManualVerify = () => {
    const fullCode = otpDigits.join("");
    if (fullCode.length !== 6) {
      setOtpError("Please enter all 6 digits of the verification code.");
      return;
    }
    verifyCode(fullCode);
  };

  // Edit Phone Number
  const handleEditPhone = () => {
    setOtpVerified(false);
    setOtpSent(false);
    setOtpDigits(["", "", "", "", "", ""]);
    setOtpError("");
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (phone.replace(/\D/g, "").length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!otpVerified) {
      setError("Please verify your mobile number with the 6-digit verification code.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!agreeTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy to continue.");
      return;
    }

    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await fetchApi("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName.trim(),
          email: cleanEmail,
          phone: phone.trim(),
          password,
          role: "USER",
        }),
      });

      if (res.ok) {
        // Automatically sign in the user
        const signInRes = await signIn("credentials", {
          redirect: false,
          email: cleanEmail,
          password,
          loginType: "USER",
        });

        if (signInRes?.ok || !signInRes?.error) {
          const params = new URLSearchParams(window.location.search);
          const callbackUrl = params.get("callbackUrl") || onSuccessRedirect;
          window.location.href = callbackUrl;
        } else {
          router.push(`${signInUrl}?registered=true`);
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Registration failed. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "760px",
        minHeight: "100%",
        padding: "36px 80px",
        backgroundImage:
          "linear-gradient(180deg, #FFF3E3 0%, #FFFBF7 50%, #FFFFFF 100%)",
        backgroundColor: "#FFF3E3",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        boxSizing: "border-box",
        fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
      }}
      className="signUpRightFormContainer"
    >
      {/* Properties Inner Wrapper (Width: 500px, Gap: 16px) */}
      <div
        style={{
          width: "100%",
          maxWidth: "500px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        {/* TopRow Header: "Already have an account?" (Left) + "Sign In" (Right) */}
        <div
          style={{
            width: "100%",
            maxWidth: "500px",
            height: "36px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 2px",
            boxSizing: "border-box",
          }}
          className="signup-top-row"
        >
          <span
            style={{
              fontSize: "14px",
              color: "#475569",
              fontWeight: 500,
              fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
            }}
          >
            Already have an account?
          </span>
          <Link
            href={signInUrl}
            style={{
              padding: "7px 22px",
              borderRadius: "9999px",
              border: "1.5px solid #FF5500",
              color: "#FF5500",
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "none",
              backgroundColor: "transparent",
              transition: "all 0.2s ease",
              fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            className="signin-btn"
          >
            Sign In
          </Link>
        </div>

        {/* FormCard Container */}
        <div
          style={{
            width: "100%",
            maxWidth: "500px",
            backgroundColor: "#FFFFFF",
            borderRadius: "24px",
            padding: "36px 40px",
            boxShadow: "0px 8px 24px 0px rgba(0, 0, 0, 0.06)",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            boxSizing: "border-box",
          }}
          className="signup-form-card"
        >
          {/* Title & Subtitle */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <h2
              style={{
                fontSize: "30px",
                fontWeight: 700,
                color: "#0F172A",
                letterSpacing: "-0.5px",
                lineHeight: "1.2",
                margin: 0,
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
              }}
            >
              Let&apos;s Get Started!
            </h2>
            <p
              style={{
                fontSize: "14.5px",
                fontWeight: 400,
                color: "#64748B",
                margin: 0,
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
              }}
            >
              Sign up to start your gourmet journey.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div
              style={{
                backgroundColor: "#FEF2F2",
                border: "1px solid #FCA5A5",
                color: "#DC2626",
                padding: "10px 14px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 500,
              }}
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              width: "100%",
            }}
          >
            {/* 1. Full Name */}
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#0F172A",
                  fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                }}
              >
                Full Name
              </label>
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: "14px",
                    display: "flex",
                    alignItems: "center",
                    pointerEvents: "none",
                  }}
                >
                  <User size={18} color="#94A3B8" />
                </span>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    height: "46px",
                    padding: "0 16px 0 44px",
                    borderRadius: "12px",
                    border: "1px solid #E2E8F0",
                    fontSize: "14px",
                    color: "#0F172A",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                  }}
                  className="form-input"
                />
              </div>
            </div>

            {/* 2. Mobile Number Field with 6-Digit Verification */}
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#0F172A",
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                  }}
                >
                  Mobile Number
                </label>
                {otpVerified && (
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#10B981",
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <CheckCircle2 size={14} color="#10B981" />
                    Verified
                  </span>
                )}
              </div>

              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: "14px",
                    display: "flex",
                    alignItems: "center",
                    pointerEvents: "none",
                  }}
                >
                  <Phone size={18} color="#94A3B8" />
                </span>
                <span
                  style={{
                    position: "absolute",
                    left: "40px",
                    fontSize: "13.5px",
                    fontWeight: 600,
                    color: "#64748B",
                    pointerEvents: "none",
                  }}
                >
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="98765 43210"
                  value={phone}
                  onChange={handlePhoneChange}
                  disabled={otpVerified}
                  maxLength={10}
                  required
                  style={{
                    width: "100%",
                    height: "46px",
                    padding: "0 100px 0 74px",
                    borderRadius: "12px",
                    border: otpVerified ? "1.5px solid #10B981" : "1px solid #E2E8F0",
                    backgroundColor: otpVerified ? "#F0FDF4" : "#FFFFFF",
                    fontSize: "14px",
                    color: "#0F172A",
                    outline: "none",
                    boxSizing: "border-box",
                    letterSpacing: "0.5px",
                    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                  }}
                  className="form-input"
                />

                {/* Right Action Button Inside Input */}
                <div
                  style={{
                    position: "absolute",
                    right: "6px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {otpVerified ? (
                    <button
                      type="button"
                      onClick={handleEditPhone}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#64748B",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        padding: "6px 10px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        borderRadius: "8px",
                      }}
                      title="Change phone number"
                    >
                      <Edit3 size={13} />
                      Change
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={phone.length !== 10 || otpSending}
                      style={{
                        padding: "5px 12px",
                        height: "34px",
                        borderRadius: "8px",
                        border: "none",
                        backgroundColor: phone.length === 10 ? "#FF5500" : "#E2E8F0",
                        color: phone.length === 10 ? "#FFFFFF" : "#94A3B8",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: phone.length === 10 ? "pointer" : "not-allowed",
                        transition: "all 0.18s ease",
                        boxShadow: phone.length === 10 ? "0 2px 8px rgba(255, 85, 0, 0.25)" : "none",
                        whiteSpace: "nowrap",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      className="send-otp-btn"
                    >
                      {otpSending ? "Sending..." : otpSent ? "Resend" : "Verify"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 6-Digit OTP Verification Drawer */}
            {otpSent && !otpVerified && (
              <div
                style={{
                  backgroundColor: "#FFF9F4",
                  border: "1px solid #FFEDD5",
                  borderRadius: "14px",
                  padding: "16px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  boxSizing: "border-box",
                }}
                className="otp-verification-card"
              >
                {/* OTP Header & Demo Quick Fill */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "6px",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#0F172A",
                      }}
                    >
                      Enter 6-Digit Verification Code
                    </span>
                    <span style={{ fontSize: "11.5px", color: "#64748B" }}>
                      Code sent to +91 {phone}
                    </span>
                  </div>

                  {/* Demo Code Auto-fill Chip */}
                  <div
                    onClick={handleQuickFill}
                    style={{
                      backgroundColor: "#FFEDE0",
                      border: "1px dashed #FF5500",
                      borderRadius: "6px",
                      padding: "3px 8px",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#FF5500",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                    title="Click to auto-fill code"
                  >
                    <span>Code: <strong>{generatedOtp}</strong></span>
                    <span style={{ fontSize: "10px", opacity: 0.8 }}>(Auto-fill)</span>
                  </div>
                </div>

                {/* 6 Discrete Digit Inputs */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "6px",
                  }}
                >
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputsRef.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      style={{
                        width: "44px",
                        height: "46px",
                        maxWidth: "calc((100% - 30px) / 6)",
                        borderRadius: "10px",
                        border: digit ? "1.5px solid #FF5500" : "1.5px solid #CBD5E1",
                        backgroundColor: "#FFFFFF",
                        textAlign: "center",
                        fontSize: "19px",
                        fontWeight: 700,
                        color: "#0F172A",
                        outline: "none",
                        boxSizing: "border-box",
                        transition: "all 0.15s ease",
                        boxShadow: digit ? "0 2px 8px rgba(255, 85, 0, 0.12)" : "none",
                      }}
                      className="otp-digit-input"
                    />
                  ))}
                </div>

                {/* OTP Error Message */}
                {otpError && (
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#DC2626",
                      fontWeight: 500,
                    }}
                  >
                    {otpError}
                  </span>
                )}

                {/* Bottom Actions Row: Verify Button + Resend Timer */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: "2px",
                  }}
                >
                  <button
                    type="button"
                    onClick={handleManualVerify}
                    disabled={otpDigits.join("").length !== 6 || otpVerifying}
                    style={{
                      padding: "7px 18px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor:
                        otpDigits.join("").length === 6 ? "#FF5500" : "#CBD5E1",
                      color: "#FFFFFF",
                      fontSize: "12.5px",
                      fontWeight: 700,
                      cursor:
                        otpDigits.join("").length === 6 ? "pointer" : "not-allowed",
                      boxShadow:
                        otpDigits.join("").length === 6
                          ? "0 3px 10px rgba(255, 85, 0, 0.25)"
                          : "none",
                      transition: "all 0.18s ease",
                    }}
                    className="verify-otp-btn"
                  >
                    {otpVerifying ? "Verifying..." : "Verify Code"}
                  </button>

                  {/* Timer / Resend */}
                  {resendTimer > 0 ? (
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#64748B",
                        fontWeight: 500,
                      }}
                    >
                      Resend in <strong style={{ color: "#FF5500" }}>{resendTimer}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#FF5500",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "4px 6px",
                      }}
                    >
                      <RefreshCw size={12} />
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 3. Email Address */}
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#0F172A",
                  fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                }}
              >
                Email Address
              </label>
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: "14px",
                    display: "flex",
                    alignItems: "center",
                    pointerEvents: "none",
                  }}
                >
                  <Mail size={18} color="#94A3B8" />
                </span>
                <input
                  type="email"
                  placeholder="yourname@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    height: "46px",
                    padding: "0 16px 0 44px",
                    borderRadius: "12px",
                    border: "1px solid #E2E8F0",
                    fontSize: "14px",
                    color: "#0F172A",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                  }}
                  className="form-input"
                />
              </div>
            </div>

            {/* 4. Password */}
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#0F172A",
                  fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                }}
              >
                Password
              </label>
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: "14px",
                    display: "flex",
                    alignItems: "center",
                    pointerEvents: "none",
                  }}
                >
                  <Lock size={18} color="#94A3B8" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    height: "46px",
                    padding: "0 44px 0 44px",
                    borderRadius: "12px",
                    border: "1px solid #E2E8F0",
                    fontSize: "14px",
                    color: "#0F172A",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                  }}
                  className="form-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "14px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    padding: 0,
                  }}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#94A3B8" />
                  ) : (
                    <Eye size={18} color="#94A3B8" />
                  )}
                </button>
              </div>
            </div>

            {/* 5. Confirm Password */}
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#0F172A",
                  fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                }}
              >
                Confirm Password
              </label>
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: "14px",
                    display: "flex",
                    alignItems: "center",
                    pointerEvents: "none",
                  }}
                >
                  <Lock size={18} color="#94A3B8" />
                </span>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    height: "46px",
                    padding: "0 44px 0 44px",
                    borderRadius: "12px",
                    border: "1px solid #E2E8F0",
                    fontSize: "14px",
                    color: "#0F172A",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                  }}
                  className="form-input"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: "absolute",
                    right: "14px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    padding: 0,
                  }}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} color="#94A3B8" />
                  ) : (
                    <Eye size={18} color="#94A3B8" />
                  )}
                </button>
              </div>
            </div>

            {/* 6. Terms of Service Checkbox */}
            <div
              style={{
                width: "100%",
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                marginTop: "2px",
                marginBottom: "2px",
                boxSizing: "border-box",
              }}
            >
              <div
                onClick={() => setAgreeTerms(!agreeTerms)}
                style={{
                  width: "18px",
                  height: "18px",
                  minWidth: "18px",
                  minHeight: "18px",
                  borderRadius: "4px",
                  border: agreeTerms
                    ? "1.5px solid #FF5500"
                    : "1.5px solid #CBD5E1",
                  backgroundColor: agreeTerms ? "#FF5500" : "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  marginTop: "2px",
                  transition: "all 0.18s ease",
                  boxSizing: "border-box",
                  flexShrink: 0,
                }}
                role="checkbox"
                aria-checked={agreeTerms}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    setAgreeTerms(!agreeTerms);
                  }
                }}
              >
                {agreeTerms && (
                  <svg
                    width="11"
                    height="9"
                    viewBox="0 0 11 9"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1.5 4.5L4 7L9.5 1.5"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>

              <label
                onClick={() => setAgreeTerms(!agreeTerms)}
                style={{
                  fontSize: "12px",
                  lineHeight: "1.45",
                  color: "#64748B",
                  fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                  cursor: "pointer",
                  userSelect: "none",
                  margin: 0,
                  flex: 1,
                }}
                className="policyText"
              >
                By signing up, you agree to our{" "}
                <Link
                  href="/terms"
                  style={{
                    color: "#FF5500",
                    textDecoration: "underline",
                    fontWeight: 500,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  style={{
                    color: "#FF5500",
                    textDecoration: "underline",
                    fontWeight: 500,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* 7. Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: "4px",
                width: "100%",
                height: "50px",
                borderRadius: "14px",
                border: "none",
                backgroundColor: "#FF5500",
                backgroundImage:
                  "linear-gradient(135deg, #FF5500 0%, #F97316 100%)",
                color: "#FFFFFF",
                fontSize: "15.5px",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 8px 20px rgba(255, 85, 0, 0.28)",
                transition: "all 0.2s ease",
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
              }}
              className="register-submit-btn"
            >
              <span>{loading ? "Creating Account..." : "Register & Explore"}</span>
              {!loading && <ArrowRight size={18} strokeWidth={2.5} />}
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        .signin-btn:hover {
          background-color: #FFF7ED !important;
          transform: translateY(-1px);
        }
        .form-input:focus {
          border-color: #FF5500 !important;
          box-shadow: 0 0 0 3px rgba(255, 85, 0, 0.12) !important;
        }
        .otp-digit-input:focus {
          border-color: #FF5500 !important;
          box-shadow: 0 0 0 3px rgba(255, 85, 0, 0.15) !important;
        }
        .register-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(255, 85, 0, 0.38) !important;
        }
        @media (max-width: 768px) {
          .signUpRightFormContainer {
            padding: 28px 16px !important;
            min-height: auto !important;
          }
          .signup-form-card {
            padding: 24px 18px !important;
          }
        }
      `}</style>
    </div>
  );
}
