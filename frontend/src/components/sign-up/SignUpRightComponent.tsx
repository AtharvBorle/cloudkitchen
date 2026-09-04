"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { fetchApi } from "@/lib/fetch-api";

export interface SignUpRightComponentProps {
  signInUrl?: string;
  onSuccessRedirect?: string;
}

export default function SignUpRightComponent({
  signInUrl = "/auth/login",
  onSuccessRedirect = "/explore/food",
}: SignUpRightComponentProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

    setLoading(true);
    try {
      const res = await fetchApi("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
          role: "USER",
        }),
      });

      if (res.ok) {
        router.push(onSuccessRedirect);
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
        padding: "48px 96px",
        backgroundImage:
          "linear-gradient(180deg, #FFF3E3 0%, #FFFBF7 50%, #FFFFFF 100%)",
        backgroundColor: "#FFF3E3",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "13px",
        boxSizing: "border-box",
        fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
      }}
      className="signUpRightFormContainer"
    >
      {/* Top Header: Already have an account? Sign In */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "14px",
        }}
      >
        <span
          style={{
            fontSize: "14px",
            color: "#64748B",
            fontWeight: 500,
            fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
          }}
        >
          Already have an account?
        </span>
        <Link
          href={signInUrl}
          style={{
            padding: "8px 24px",
            borderRadius: "9999px",
            border: "1.5px solid #FF5500",
            color: "#FF5500",
            fontSize: "14px",
            fontWeight: 600,
            textDecoration: "none",
            backgroundColor: "transparent",
            transition: "all 0.2s ease",
            fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
          }}
          className="signin-btn"
        >
          Sign In
        </Link>
      </div>

      {/* Center White Form Card */}
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          backgroundColor: "#FFFFFF",
          borderRadius: "28px",
          padding: "40px 36px",
          boxShadow: "0 14px 40px rgba(0, 0, 0, 0.04), 0 2px 8px rgba(0, 0, 0, 0.02)",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          boxSizing: "border-box",
        }}
        className="signup-form-card"
      >
        {/* Title & Subtitle */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <h2
            style={{
              fontSize: "32px",
              fontWeight: 800,
              color: "#0F172A",
              letterSpacing: "-0.5px",
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
                  padding: "0 16px 0 42px",
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
                  padding: "0 16px 0 42px",
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
                  padding: "0 42px 0 42px",
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
                  padding: "0 42px 0 42px",
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

          {/* 5. Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "8px",
              width: "100%",
              height: "52px",
              borderRadius: "14px",
              border: "none",
              backgroundColor: "#FF5500",
              backgroundImage: "linear-gradient(135deg, #FF5500 0%, #F97316 100%)",
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

      {/* Bottom Footer: Terms of Service & Privacy Policy */}
      <div
        style={{
          textAlign: "center",
          fontSize: "12.5px",
          color: "#64748B",
          fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
        }}
      >
        By signing up, you agree to our{" "}
        <Link
          href="/terms"
          style={{
            color: "#FF5500",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          style={{
            color: "#FF5500",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          Privacy Policy
        </Link>
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
