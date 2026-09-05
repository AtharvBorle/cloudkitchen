"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
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
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Please enter your full name.");
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
        minHeight: "900px",
        height: "100%",
        padding: "48px 96px",
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
          gap: "16px",
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

        {/* FormCard Container (Width: 500px, Padding: 40px, Gap: 24px, Radius: 24px, Shadow: 0px 8px 24px 0px #0000000F) */}
        <div
          style={{
            width: "100%",
            maxWidth: "500px",
            backgroundColor: "#FFFFFF",
            borderRadius: "24px",
            padding: "40px",
            boxShadow: "0px 8px 24px 0px rgba(0, 0, 0, 0.06)",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            boxSizing: "border-box",
          }}
          className="signup-form-card"
        >
          {/* Title & Subtitle */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <h2
              style={{
                fontSize: "32px",
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
                fontSize: "15px",
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
              gap: "16px",
              width: "100%",
            }}
          >
            {/* 1. Full Name */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label
                style={{
                  fontSize: "13.5px",
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
                    height: "48px",
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

            {/* 2. Email Address */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label
                style={{
                  fontSize: "13.5px",
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
                    height: "48px",
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

            {/* 3. Password */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label
                style={{
                  fontSize: "13.5px",
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
                    height: "48px",
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

            {/* 4. Confirm Password */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label
                style={{
                  fontSize: "13.5px",
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
                    height: "48px",
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

            {/* 5. Terms of Service Checkbox (Inside FormCard - Perfectly Fit & Styled) */}
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
              {/* Custom Styled Checkbox */}
              <div
                onClick={() => setAgreeTerms(!agreeTerms)}
                style={{
                  width: "18px",
                  height: "18px",
                  minWidth: "18px",
                  minHeight: "18px",
                  borderRadius: "4px",
                  border: agreeTerms ? "1.5px solid #FF5500" : "1.5px solid #CBD5E1",
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

              {/* Policy Text Label */}
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

            {/* 6. Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: "6px",
                width: "100%",
                height: "52px",
                borderRadius: "14px",
                border: "none",
                backgroundColor: "#FF5500",
                backgroundImage: "linear-gradient(135deg, #FF5500 0%, #F97316 100%)",
                color: "#FFFFFF",
                fontSize: "16px",
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
        .register-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(255, 85, 0, 0.38) !important;
        }
        @media (max-width: 768px) {
          .signUpRightFormContainer {
            padding: 36px 20px !important;
            min-height: auto !important;
          }
          .signup-form-card {
            padding: 28px 20px !important;
          }
        }
      `}</style>
    </div>
  );
}
