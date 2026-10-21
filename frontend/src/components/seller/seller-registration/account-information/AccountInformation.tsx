"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Check,
  RotateCw,
} from "lucide-react";
import { PasswordInput } from "@/components/common/PasswordInput/PasswordInput";
import { saveSellerDraft } from "@/lib/seller-registration-store";
import { validateEmail } from "@/lib/email-validation";
import { fetchApi } from "@/lib/fetch-api";
import styles from "./AccountInformation.module.css";

export interface AccountStepData {
  ownerName: string;
  email: string;
  phone: string;
  password: string;
  sellerRole: string;
  isEmailVerified?: boolean;
  verifiedEmail?: string;
  isPhoneVerified?: boolean;
  verifiedPhone?: string;
}

export type AccountInformationData = AccountStepData;

export interface AccountInformationProps {
  initialData?: Partial<AccountStepData>;
  onContinue?: (data: AccountStepData) => void;
}

export const AccountInformation: React.FC<AccountInformationProps> = ({
  initialData,
  onContinue,
}) => {
  const initialPhoneDigits = (initialData?.phone || "")
    .replace(/\D/g, "")
    .slice(-10);

  const [formData, setFormData] = useState<AccountStepData>({
    ownerName: initialData?.ownerName || "",
    email: initialData?.email || "",
    phone: initialPhoneDigits,
    password: initialData?.password || "",
    sellerRole: "Owner",
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // ---------------------------------------------------------------------------
  // Email Verification States
  // ---------------------------------------------------------------------------
  const initialVerifiedEmail =
    initialData?.verifiedEmail ||
    (initialData?.isEmailVerified && initialData?.email
      ? initialData.email.trim().toLowerCase()
      : "");
  const [verifiedEmail, setVerifiedEmail] = useState<string>(initialVerifiedEmail);
  const [verificationStatus, setVerificationStatus] = useState<
    "idle" | "verifying" | "verified" | "taken" | "error"
  >(
    initialVerifiedEmail &&
      initialData?.email &&
      initialData.email.trim().toLowerCase() === initialVerifiedEmail
      ? "verified"
      : "idle"
  );
  const [emailCheckError, setEmailCheckError] = useState<string | null>(null);

  const [emailOtpSent, setEmailOtpSent] = useState<boolean>(false);
  const [emailOtpSending, setEmailOtpSending] = useState<boolean>(false);
  const [emailOtpVerifying, setEmailOtpVerifying] = useState<boolean>(false);
  const [emailOtpDigits, setEmailOtpDigits] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [emailOtpError, setEmailOtpError] = useState<string | null>(null);
  const [emailResendTimer, setEmailResendTimer] = useState<number>(0);
  const [emailGeneratedOtp, setEmailGeneratedOtp] = useState<string | null>(null);
  const emailOtpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // ---------------------------------------------------------------------------
  // Phone Verification States
  // ---------------------------------------------------------------------------
  const initialVerifiedPhone =
    initialData?.verifiedPhone ||
    (initialData?.isPhoneVerified && initialData?.phone
      ? initialData.phone.replace(/\D/g, "").slice(-10)
      : "");
  const [verifiedPhone, setVerifiedPhone] = useState<string>(initialVerifiedPhone);
  const [phoneVerificationStatus, setPhoneVerificationStatus] = useState<
    "idle" | "verifying" | "verified" | "taken" | "error"
  >(
    initialVerifiedPhone &&
      initialPhoneDigits &&
      initialPhoneDigits === initialVerifiedPhone
      ? "verified"
      : "idle"
  );
  const [phoneCheckError, setPhoneCheckError] = useState<string | null>(null);

  const [phoneOtpSent, setPhoneOtpSent] = useState<boolean>(false);
  const [phoneOtpSending, setPhoneOtpSending] = useState<boolean>(false);
  const [phoneOtpVerifying, setPhoneOtpVerifying] = useState<boolean>(false);
  const [phoneOtpDigits, setPhoneOtpDigits] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [phoneOtpError, setPhoneOtpError] = useState<string | null>(null);
  const [phoneResendTimer, setPhoneResendTimer] = useState<number>(0);
  const [phoneGeneratedOtp, setPhoneGeneratedOtp] = useState<string | null>(null);
  const phoneOtpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // ---------------------------------------------------------------------------
  // Resend Countdown Timers
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (emailResendTimer <= 0) return;
    const interval = setInterval(() => {
      setEmailResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [emailResendTimer]);

  useEffect(() => {
    if (phoneResendTimer <= 0) return;
    const interval = setInterval(() => {
      setPhoneResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [phoneResendTimer]);

  // ---------------------------------------------------------------------------
  // Form Field Validation
  // ---------------------------------------------------------------------------
  const isNameValid = formData.ownerName.trim().length >= 2;
  const isNameError = touched.ownerName && !isNameValid;

  const emailCheck = validateEmail(formData.email);
  const isEmailFormatValid = emailCheck.isValid;
  const isEmailEmpty = formData.email.trim().length === 0;
  const isEmailVerified = Boolean(
    isEmailFormatValid &&
      verifiedEmail &&
      formData.email.trim().toLowerCase() === verifiedEmail.toLowerCase() &&
      verificationStatus === "verified"
  );
  const isEmailError = !isEmailEmpty
    ? !isEmailFormatValid ||
      verificationStatus === "taken" ||
      verificationStatus === "error"
    : Boolean(touched.email && !isEmailFormatValid);

  const phoneDigits = formData.phone;
  const phoneLength = phoneDigits.length;
  const isPhoneComplete = phoneLength === 10;
  const isPhoneIncomplete = phoneLength > 0 && phoneLength < 10;
  const isPhoneEmpty = phoneLength === 0;
  const isPhoneVerified = Boolean(
    isPhoneComplete &&
      verifiedPhone &&
      phoneDigits === verifiedPhone &&
      phoneVerificationStatus === "verified"
  );
  const isPhoneError = !isPhoneEmpty
    ? !isPhoneComplete ||
      phoneVerificationStatus === "taken" ||
      phoneVerificationStatus === "error"
    : Boolean(touched.phone);

  const isPasswordValid = formData.password.length >= 8;
  const isPasswordError = touched.password && !isPasswordValid;

  // ---------------------------------------------------------------------------
  // Field Change Handlers
  // ---------------------------------------------------------------------------
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      saveSellerDraft({ [name]: value });
      return next;
    });
    setTouched((prev) => ({ ...prev, [name]: true }));

    if (name === "email") {
      const cleanVal = value.trim().toLowerCase();
      if (cleanVal !== verifiedEmail.toLowerCase()) {
        setVerificationStatus("idle");
        setEmailCheckError(null);
        setEmailOtpSent(false);
        setEmailOtpDigits(["", "", "", "", "", ""]);
        setEmailOtpError(null);
        setEmailGeneratedOtp(null);
        saveSellerDraft({ isEmailVerified: false, verifiedEmail: "" });
      }
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
    setFormData((prev) => {
      const next = { ...prev, phone: digitsOnly };
      saveSellerDraft({ phone: digitsOnly });
      return next;
    });
    setTouched((prev) => ({ ...prev, phone: true }));

    if (digitsOnly !== verifiedPhone) {
      setPhoneVerificationStatus("idle");
      setPhoneCheckError(null);
      setPhoneOtpSent(false);
      setPhoneOtpDigits(["", "", "", "", "", ""]);
      setPhoneOtpError(null);
      setPhoneGeneratedOtp(null);
      saveSellerDraft({ isPhoneVerified: false, verifiedPhone: "" });
    }
  };

  const handlePasswordChange = (val: string) => {
    setFormData((prev) => {
      const next = { ...prev, password: val };
      saveSellerDraft({ password: val });
      return next;
    });
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // ---------------------------------------------------------------------------
  // Email OTP Flow
  // ---------------------------------------------------------------------------
  const handleSendEmailOtp = async () => {
    setTouched((prev) => ({ ...prev, email: true }));
    const cleanEmail = formData.email.trim();
    const formatCheck = validateEmail(cleanEmail);

    if (!formatCheck.isValid) {
      setEmailCheckError(formatCheck.error || "Please enter a valid email address.");
      setVerificationStatus("error");
      return;
    }

    setEmailOtpSending(true);
    setVerificationStatus("verifying");
    setEmailCheckError(null);
    setEmailOtpError(null);

    try {
      const res = await fetchApi("/api/auth/send-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          purpose: "seller_onboarding",
          name: formData.ownerName.trim() || undefined,
        }),
      });

      const json = await res.json().catch(() => ({}));
      const data =
        json && typeof json === "object" && "data" in json && json.data
          ? json.data
          : json;

      if (res.ok && (data?.success || json?.success)) {
        setEmailOtpSent(true);
        setVerificationStatus("idle");
        setEmailResendTimer(30);
        setEmailOtpDigits(["", "", "", "", "", ""]);
        if (data?.otp || json?.otp) {
          setEmailGeneratedOtp(data?.otp || json?.otp);
        } else {
          setEmailGeneratedOtp(null);
        }
        setTimeout(() => {
          emailOtpInputsRef.current[0]?.focus();
        }, 100);
      } else {
        const isTaken = res.status === 409 || data?.exists || json?.exists;
        const msg =
          data?.message ||
          json?.message ||
          (isTaken
            ? "An account with this email address already exists. Please sign in or use a different email."
            : "Failed to send email verification code. Please try again.");
        setVerificationStatus(isTaken ? "taken" : "error");
        setEmailCheckError(msg);
        setEmailOtpSent(false);
      }
    } catch (err: any) {
      console.error("Email send OTP error:", err);
      setVerificationStatus("error");
      setEmailCheckError(
        err?.message || "Failed to send verification code. Please try again."
      );
      setEmailOtpSent(false);
    } finally {
      setEmailOtpSending(false);
    }
  };

  const handleVerifyEmailOtp = async (codeToVerify?: string) => {
    const code = (codeToVerify ?? emailOtpDigits.join("")).trim();
    if (code.length !== 6) {
      setEmailOtpError("Please enter all 6 digits of the verification code.");
      return;
    }

    const cleanEmail = formData.email.trim().toLowerCase();
    setEmailOtpVerifying(true);
    setEmailOtpError(null);

    try {
      const res = await fetchApi("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          otp: code,
          purpose: "seller_onboarding",
        }),
      });

      const json = await res.json().catch(() => ({}));
      const data =
        json && typeof json === "object" && "data" in json && json.data
          ? json.data
          : json;

      if (
        res.ok &&
        (data?.verified || json?.verified || data?.success || json?.success)
      ) {
        setVerificationStatus("verified");
        setVerifiedEmail(cleanEmail);
        setEmailOtpSent(false);
        setEmailCheckError(null);
        setEmailOtpError(null);
        saveSellerDraft({
          email: formData.email.trim(),
          isEmailVerified: true,
          verifiedEmail: cleanEmail,
        });
      } else {
        const msg =
          data?.message ||
          json?.message ||
          "Invalid or expired verification code. Please check and try again.";
        setEmailOtpError(msg);
      }
    } catch (err: any) {
      console.error("Email verify OTP error:", err);
      setEmailOtpError(err?.message || "Verification failed. Please try again.");
    } finally {
      setEmailOtpVerifying(false);
    }
  };

  const handleEmailDigitChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const updated = [...emailOtpDigits];
    updated[idx] = digit;
    setEmailOtpDigits(updated);
    setEmailOtpError(null);

    if (digit && idx < 5) {
      emailOtpInputsRef.current[idx + 1]?.focus();
    }

    if (updated.every((d) => d.length === 1)) {
      handleVerifyEmailOtp(updated.join(""));
    }
  };

  const handleEmailKeyDown = (
    idx: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !emailOtpDigits[idx] && idx > 0) {
      emailOtpInputsRef.current[idx - 1]?.focus();
    }
  };

  const handleEmailPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!paste) return;

    const updated = [...emailOtpDigits];
    for (let i = 0; i < 6; i++) {
      updated[i] = paste[i] || "";
    }
    setEmailOtpDigits(updated);
    setEmailOtpError(null);

    const focusIdx = Math.min(paste.length, 5);
    emailOtpInputsRef.current[focusIdx]?.focus();

    if (paste.length === 6) {
      handleVerifyEmailOtp(paste);
    }
  };

  const handleEmailQuickFill = () => {
    if (!emailGeneratedOtp) return;
    const digits = emailGeneratedOtp.split("").slice(0, 6);
    setEmailOtpDigits(digits);
    setEmailOtpError(null);
    handleVerifyEmailOtp(emailGeneratedOtp);
  };

  // ---------------------------------------------------------------------------
  // Phone OTP Flow
  // ---------------------------------------------------------------------------
  const handleSendPhoneOtp = async () => {
    setTouched((prev) => ({ ...prev, phone: true }));
    const digitsOnly = formData.phone.replace(/\D/g, "").slice(-10);

    if (digitsOnly.length !== 10) {
      setPhoneCheckError("Please enter a valid 10-digit mobile number.");
      setPhoneVerificationStatus("error");
      return;
    }

    setPhoneOtpSending(true);
    setPhoneVerificationStatus("verifying");
    setPhoneCheckError(null);
    setPhoneOtpError(null);

    try {
      const res = await fetchApi("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: digitsOnly,
          purpose: "seller_onboarding",
        }),
      });

      const json = await res.json().catch(() => ({}));
      const data =
        json && typeof json === "object" && "data" in json && json.data
          ? json.data
          : json;

      if (res.ok && (data?.success || json?.success)) {
        setPhoneOtpSent(true);
        setPhoneVerificationStatus("idle");
        setPhoneResendTimer(30);
        setPhoneOtpDigits(["", "", "", "", "", ""]);
        if (data?.otp || json?.otp) {
          setPhoneGeneratedOtp(data?.otp || json?.otp);
        } else {
          setPhoneGeneratedOtp(null);
        }
        setTimeout(() => {
          phoneOtpInputsRef.current[0]?.focus();
        }, 100);
      } else {
        const isTaken = res.status === 409 || data?.exists || json?.exists;
        const msg =
          data?.message ||
          json?.message ||
          (isTaken
            ? "An account with this mobile number already exists. Please sign in or use a different number."
            : "Failed to send mobile OTP. Please try again.");
        setPhoneVerificationStatus(isTaken ? "taken" : "error");
        setPhoneCheckError(msg);
        setPhoneOtpSent(false);
      }
    } catch (err: any) {
      console.error("Phone send OTP error:", err);
      setPhoneVerificationStatus("error");
      setPhoneCheckError(
        err?.message || "Failed to send verification code. Please try again."
      );
      setPhoneOtpSent(false);
    } finally {
      setPhoneOtpSending(false);
    }
  };

  const handleVerifyPhoneOtp = async (codeToVerify?: string) => {
    const code = (codeToVerify ?? phoneOtpDigits.join("")).trim();
    if (code.length !== 6) {
      setPhoneOtpError("Please enter all 6 digits of the verification code.");
      return;
    }

    const digitsOnly = formData.phone.replace(/\D/g, "").slice(-10);
    setPhoneOtpVerifying(true);
    setPhoneOtpError(null);

    try {
      const res = await fetchApi("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: digitsOnly,
          otp: code,
          purpose: "seller_onboarding",
        }),
      });

      const json = await res.json().catch(() => ({}));
      const data =
        json && typeof json === "object" && "data" in json && json.data
          ? json.data
          : json;

      if (
        res.ok &&
        (data?.verified || json?.verified || data?.success || json?.success)
      ) {
        setPhoneVerificationStatus("verified");
        setVerifiedPhone(digitsOnly);
        setPhoneOtpSent(false);
        setPhoneCheckError(null);
        setPhoneOtpError(null);
        saveSellerDraft({
          phone: digitsOnly,
          isPhoneVerified: true,
          verifiedPhone: digitsOnly,
        });
      } else {
        const msg =
          data?.message ||
          json?.message ||
          "Invalid or expired verification code. Please check and try again.";
        setPhoneOtpError(msg);
      }
    } catch (err: any) {
      console.error("Phone verify OTP error:", err);
      setPhoneOtpError(err?.message || "Verification failed. Please try again.");
    } finally {
      setPhoneOtpVerifying(false);
    }
  };

  const handlePhoneDigitChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const updated = [...phoneOtpDigits];
    updated[idx] = digit;
    setPhoneOtpDigits(updated);
    setPhoneOtpError(null);

    if (digit && idx < 5) {
      phoneOtpInputsRef.current[idx + 1]?.focus();
    }

    if (updated.every((d) => d.length === 1)) {
      handleVerifyPhoneOtp(updated.join(""));
    }
  };

  const handlePhoneKeyDown = (
    idx: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !phoneOtpDigits[idx] && idx > 0) {
      phoneOtpInputsRef.current[idx - 1]?.focus();
    }
  };

  const handlePhonePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!paste) return;

    const updated = [...phoneOtpDigits];
    for (let i = 0; i < 6; i++) {
      updated[i] = paste[i] || "";
    }
    setPhoneOtpDigits(updated);
    setPhoneOtpError(null);

    const focusIdx = Math.min(paste.length, 5);
    phoneOtpInputsRef.current[focusIdx]?.focus();

    if (paste.length === 6) {
      handleVerifyPhoneOtp(paste);
    }
  };

  const handlePhoneQuickFill = () => {
    if (!phoneGeneratedOtp) return;
    const digits = phoneGeneratedOtp.split("").slice(0, 6);
    setPhoneOtpDigits(digits);
    setPhoneOtpError(null);
    handleVerifyPhoneOtp(phoneGeneratedOtp);
  };

  // ---------------------------------------------------------------------------
  // Step Submission
  // ---------------------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      ownerName: true,
      email: true,
      phone: true,
      password: true,
    });

    if (!isNameValid || !isEmailFormatValid || !isPhoneComplete || !isPasswordValid) {
      return;
    }

    // Strictly enforce real verification - never auto-verify!
    if (!isEmailVerified) {
      setEmailCheckError("Please verify your email address with OTP before continuing.");
      if (!emailOtpSent) {
        handleSendEmailOtp();
      }
      return;
    }

    if (!isPhoneVerified) {
      setPhoneCheckError("Please verify your mobile number with OTP before continuing.");
      if (!phoneOtpSent) {
        handleSendPhoneOtp();
      }
      return;
    }

    const cleanData: AccountStepData = {
      ...formData,
      ownerName: formData.ownerName.trim(),
      email: formData.email.trim(),
      sellerRole: "Owner",
      phone: formData.phone.replace(/\D/g, "").slice(-10),
      isEmailVerified: true,
      verifiedEmail: formData.email.trim().toLowerCase(),
      isPhoneVerified: true,
      verifiedPhone: formData.phone.replace(/\D/g, "").slice(-10),
    };

    saveSellerDraft(cleanData);

    if (onContinue) {
      onContinue(cleanData);
    }
  };

  return (
    <div className={styles.cardContainer}>
      {/* Desktop Header Group */}
      <div className={styles.headerGroup}>
        <h2 className={styles.title}>Owner Account Information</h2>
        <p className={styles.subtitle}>
          Set up your primary login and ownership contact credentials.
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        {/* Owner Full Name */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="ownerName">
            Owner full name <span className={styles.required}>*</span>
          </label>
          <div className={styles.inputWrapper}>
            <input
              id="ownerName"
              name="ownerName"
              type="text"
              required
              placeholder="Rahul Sharma"
              value={formData.ownerName}
              onChange={handleChange}
              onBlur={() => handleBlur("ownerName")}
              className={`${styles.input} ${
                isNameValid
                  ? styles.inputSuccess
                  : isNameError
                  ? styles.inputError
                  : ""
              }`}
              autoComplete="name"
            />
            {isNameValid && (
              <div className={styles.statusIconBox}>
                <CheckCircle2 size={18} className={styles.validCheckIcon} />
              </div>
            )}
            {isNameError && (
              <div className={styles.statusIconBox}>
                <AlertCircle size={18} className={styles.invalidAlertIcon} />
              </div>
            )}
          </div>
          {isNameError && (
            <div className={styles.helperTextError}>
              <AlertCircle size={13} />
              <span>Please enter full name (at least 2 characters)</span>
            </div>
          )}
        </div>

        {/* Email Address with Verification Button & Drawer */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="email">
            Email <span className={styles.required}>*</span>
          </label>
          <div className={styles.inputWrapper}>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="rahul@neocloud.com"
              value={formData.email}
              onChange={handleChange}
              onBlur={() => handleBlur("email")}
              className={`${styles.input} ${styles.emailInputWithBtn} ${
                isEmailVerified
                  ? styles.inputSuccess
                  : isEmailError
                  ? styles.inputError
                  : ""
              }`}
              autoComplete="email"
            />

            {/* Email Verification Action / Status Badge */}
            {emailOtpSending || verificationStatus === "verifying" ? (
              <div className={styles.verifyingBadge}>
                <Loader2 size={14} className="animate-spin" />
                <span>Sending code...</span>
              </div>
            ) : isEmailVerified ? (
              <div className={styles.verifiedBadge}>
                <Check size={14} strokeWidth={3} />
                <span>Verified</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSendEmailOtp}
                disabled={!isEmailFormatValid || emailOtpSending}
                className={styles.verifyEmailBtn}
                title={
                  !isEmailFormatValid
                    ? "Enter valid email to verify"
                    : "Send email verification code"
                }
              >
                <span>{emailOtpSent ? "Resend" : "Verify"}</span>
              </button>
            )}
          </div>

          {/* 6-Digit Email OTP Verification Drawer */}
          {emailOtpSent && !isEmailVerified && (
            <div className={styles.otpDrawer}>
              <div className={styles.otpDrawerHeader}>
                <div className={styles.otpHeaderCol}>
                  <span className={styles.otpTitle}>
                    Enter 6-Digit Email Verification Code
                  </span>
                  <span className={styles.otpSubtitle}>
                    Code sent to <strong>{formData.email}</strong>
                  </span>
                </div>

                {Boolean(emailGeneratedOtp) && (
                  <div
                    onClick={handleEmailQuickFill}
                    className={styles.otpQuickFillChip}
                    title="Click to auto-fill code"
                  >
                    <span>
                      Code: <strong>{emailGeneratedOtp}</strong>
                    </span>
                    <span style={{ fontSize: "10px", opacity: 0.8 }}>
                      (Auto-fill)
                    </span>
                  </div>
                )}
              </div>

              {/* 6 Discrete Digit Inputs */}
              <div className={styles.otpDigitsRow}>
                {emailOtpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      emailOtpInputsRef.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleEmailDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleEmailKeyDown(idx, e)}
                    onPaste={handleEmailPaste}
                    className={`${styles.otpDigitInput} ${
                      digit ? styles.otpDigitInputFilled : ""
                    }`}
                  />
                ))}
              </div>

              {/* OTP Error Message */}
              {emailOtpError && (
                <div className={styles.otpErrorText}>
                  <AlertCircle size={13} />
                  <span>{emailOtpError}</span>
                </div>
              )}

              {/* Bottom Actions Row: Verify Button + Resend Timer */}
              <div className={styles.otpActionsRow}>
                <button
                  type="button"
                  onClick={() => handleVerifyEmailOtp()}
                  disabled={
                    emailOtpDigits.join("").length !== 6 || emailOtpVerifying
                  }
                  className={styles.otpVerifyBtn}
                >
                  {emailOtpVerifying && (
                    <Loader2 size={13} className="animate-spin" />
                  )}
                  <span>{emailOtpVerifying ? "Verifying..." : "Verify Code"}</span>
                </button>

                {emailResendTimer > 0 ? (
                  <span className={styles.otpResendTimer}>
                    Resend in{" "}
                    <strong style={{ color: "#FF5500" }}>
                      {emailResendTimer}s
                    </strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendEmailOtp}
                    disabled={emailOtpSending}
                    className={styles.otpResendBtn}
                  >
                    <RotateCw size={12} />
                    <span>{emailOtpSending ? "Sending..." : "Resend OTP"}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Email Status Feedback */}
          {isEmailVerified ? (
            <div className={styles.helperTextSuccess}>
              <CheckCircle2 size={13} />
              <span>Email verified & available for registration</span>
            </div>
          ) : verificationStatus === "taken" ? (
            <div className={styles.helperTextError}>
              <AlertCircle size={13} style={{ flexShrink: 0 }} />
              <span>
                {emailCheckError ||
                  "An account with this email address already exists."}
                <Link href="/seller/login" className={styles.loginShortcutLink}>
                  Sign In
                </Link>
              </span>
            </div>
          ) : emailCheckError || isEmailError ? (
            <div className={styles.helperTextError}>
              <AlertCircle size={13} />
              <span>
                {emailCheckError ||
                  emailCheck.error ||
                  "Please enter a valid email address."}
              </span>
            </div>
          ) : isEmailFormatValid && !isEmailVerified && !emailOtpSent ? (
            <span
              style={{
                fontSize: "0.78rem",
                color: "#EA580C",
                marginTop: "2px",
                fontWeight: "500",
              }}
            >
              Please click &quot;Verify&quot; to verify your email address before continuing.
            </span>
          ) : (
            <span className={styles.helperText}>
              Used for account notifications and verification
            </span>
          )}
        </div>

        {/* Phone Number with +91 Country Code, Verification Button & Drawer */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="phone">
            Phone <span className={styles.required}>*</span>
          </label>
          <div
            className={`${styles.phoneInputWrapper} ${
              isPhoneVerified
                ? styles.inputSuccess
                : isPhoneError
                ? styles.inputError
                : ""
            }`}
          >
            <div className={styles.countryCodePrefix}>
              <span className={styles.flagIcon}>🇮🇳</span>
              <span>+91</span>
            </div>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              maxLength={10}
              placeholder="98765 43210"
              value={formData.phone}
              onChange={handlePhoneChange}
              onBlur={() => handleBlur("phone")}
              className={`${styles.phoneInputField} ${styles.phoneInputFieldWithBtn}`}
              autoComplete="tel-national"
            />

            {/* Phone Verification Action / Status Badge */}
            {phoneOtpSending || phoneVerificationStatus === "verifying" ? (
              <div className={styles.verifyingBadge}>
                <Loader2 size={14} className="animate-spin" />
                <span>Sending OTP...</span>
              </div>
            ) : isPhoneVerified ? (
              <div className={styles.verifiedBadge}>
                <Check size={14} strokeWidth={3} />
                <span>Verified</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSendPhoneOtp}
                disabled={!isPhoneComplete || phoneOtpSending}
                className={styles.verifyEmailBtn}
                title={
                  !isPhoneComplete
                    ? "Enter 10-digit number to verify"
                    : "Send mobile verification code"
                }
              >
                <span>{phoneOtpSent ? "Resend" : "Verify"}</span>
              </button>
            )}
          </div>

          {/* 6-Digit Phone OTP Verification Drawer */}
          {phoneOtpSent && !isPhoneVerified && (
            <div className={styles.otpDrawer}>
              <div className={styles.otpDrawerHeader}>
                <div className={styles.otpHeaderCol}>
                  <span className={styles.otpTitle}>
                    Enter 6-Digit Mobile Verification Code
                  </span>
                  <span className={styles.otpSubtitle}>
                    Code sent to <strong>+91 {formData.phone}</strong>
                  </span>
                </div>

                {Boolean(phoneGeneratedOtp) && (
                  <div
                    onClick={handlePhoneQuickFill}
                    className={styles.otpQuickFillChip}
                    title="Click to auto-fill code"
                  >
                    <span>
                      Code: <strong>{phoneGeneratedOtp}</strong>
                    </span>
                    <span style={{ fontSize: "10px", opacity: 0.8 }}>
                      (Auto-fill)
                    </span>
                  </div>
                )}
              </div>

              {/* 6 Discrete Digit Inputs */}
              <div className={styles.otpDigitsRow}>
                {phoneOtpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      phoneOtpInputsRef.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePhoneDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handlePhoneKeyDown(idx, e)}
                    onPaste={handlePhonePaste}
                    className={`${styles.otpDigitInput} ${
                      digit ? styles.otpDigitInputFilled : ""
                    }`}
                  />
                ))}
              </div>

              {/* OTP Error Message */}
              {phoneOtpError && (
                <div className={styles.otpErrorText}>
                  <AlertCircle size={13} />
                  <span>{phoneOtpError}</span>
                </div>
              )}

              {/* Bottom Actions Row: Verify Button + Resend Timer */}
              <div className={styles.otpActionsRow}>
                <button
                  type="button"
                  onClick={() => handleVerifyPhoneOtp()}
                  disabled={
                    phoneOtpDigits.join("").length !== 6 || phoneOtpVerifying
                  }
                  className={styles.otpVerifyBtn}
                >
                  {phoneOtpVerifying && (
                    <Loader2 size={13} className="animate-spin" />
                  )}
                  <span>{phoneOtpVerifying ? "Verifying..." : "Verify Code"}</span>
                </button>

                {phoneResendTimer > 0 ? (
                  <span className={styles.otpResendTimer}>
                    Resend in{" "}
                    <strong style={{ color: "#FF5500" }}>
                      {phoneResendTimer}s
                    </strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendPhoneOtp}
                    disabled={phoneOtpSending}
                    className={styles.otpResendBtn}
                  >
                    <RotateCw size={12} />
                    <span>{phoneOtpSending ? "Sending..." : "Resend OTP"}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Phone Status Feedback */}
          {isPhoneVerified ? (
            <div className={styles.helperTextSuccess}>
              <CheckCircle2 size={13} />
              <span>Mobile number verified & available for registration</span>
              <span
                className={`${styles.digitCounter} ${styles.digitCounterComplete}`}
              >
                10/10
              </span>
            </div>
          ) : phoneVerificationStatus === "taken" ? (
            <div className={styles.helperTextError}>
              <AlertCircle size={13} style={{ flexShrink: 0 }} />
              <span>
                {phoneCheckError ||
                  "An account with this mobile number already exists."}
                <Link href="/seller/login" className={styles.loginShortcutLink}>
                  Sign In
                </Link>
              </span>
            </div>
          ) : phoneCheckError ? (
            <div className={styles.helperTextError}>
              <AlertCircle size={13} />
              <span>{phoneCheckError}</span>
            </div>
          ) : isPhoneIncomplete ? (
            <div className={styles.helperTextError}>
              <AlertCircle size={13} />
              <span>Enter 10 digits ({10 - phoneLength} more needed)</span>
              <span
                className={`${styles.digitCounter} ${styles.digitCounterIncomplete}`}
              >
                {phoneLength}/10
              </span>
            </div>
          ) : isPhoneComplete && !isPhoneVerified && !phoneOtpSent ? (
            <span
              style={{
                fontSize: "0.78rem",
                color: "#EA580C",
                marginTop: "2px",
                fontWeight: "500",
              }}
            >
              Please click &quot;Verify&quot; to verify your mobile number before continuing.
            </span>
          ) : touched.phone && phoneLength === 0 ? (
            <div className={styles.helperTextError}>
              <AlertCircle size={13} />
              <span>Mobile number is required</span>
            </div>
          ) : (
            <span className={styles.helperText}>
              Enter 10-digit Indian mobile number
            </span>
          )}
        </div>

        {/* Password */}
        <div className={styles.fieldGroup}>
          <PasswordInput
            id="password"
            name="password"
            label="Password"
            required
            placeholder="••••••••"
            value={formData.password}
            onChange={handlePasswordChange}
            autoComplete="new-password"
          />
        </div>

        {/* Continue Button */}
        <div className={styles.buttonWrapper}>
          <button type="submit" className={styles.continueButton}>
            <span>Continue</span>
            <ArrowRight className={styles.btnIcon} />
          </button>
        </div>
      </form>
    </div>
  );
};

export const AccountStep = AccountInformation;
export default AccountInformation;
