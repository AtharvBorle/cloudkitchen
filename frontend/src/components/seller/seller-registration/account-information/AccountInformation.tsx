"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Check,
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

  // Email verification state
  const initialVerifiedEmail = initialData?.verifiedEmail || (initialData?.isEmailVerified && initialData?.email ? initialData.email.trim().toLowerCase() : "");
  const [verifiedEmail, setVerifiedEmail] = useState<string>(initialVerifiedEmail);
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "verifying" | "verified" | "taken" | "error">(
    initialVerifiedEmail && initialData?.email && initialData.email.trim().toLowerCase() === initialVerifiedEmail ? "verified" : "idle"
  );
  const [emailCheckError, setEmailCheckError] = useState<string | null>(null);

  // Validation States
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
  const isEmailError = !isEmailEmpty ? (!isEmailFormatValid || verificationStatus === "taken" || verificationStatus === "error") : Boolean(touched.email && !isEmailFormatValid);

  const phoneDigits = formData.phone;
  const phoneLength = phoneDigits.length;
  const isPhoneComplete = phoneLength === 10;
  const isPhoneIncomplete = phoneLength > 0 && phoneLength < 10;
  const isPhoneError = Boolean(touched.phone && phoneLength !== 10);

  const isPasswordValid = formData.password.length >= 8;
  const isPasswordError = touched.password && !isPasswordValid;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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
        saveSellerDraft({ isEmailVerified: false, verifiedEmail: "" });
      }
    }
  };

  const handleVerifyEmail = async (): Promise<boolean> => {
    setTouched((prev) => ({ ...prev, email: true }));
    const cleanEmail = formData.email.trim();
    const formatCheck = validateEmail(cleanEmail);

    if (!formatCheck.isValid) {
      setEmailCheckError(formatCheck.error || "Please enter a valid email address.");
      setVerificationStatus("error");
      return false;
    }

    setVerificationStatus("verifying");
    setEmailCheckError(null);

    try {
      const res = await fetchApi("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const json = await res.json().catch(() => ({}));
      // fetchApi unwraps json.data if proxy was used, or returns raw object
      const data = json && typeof json === "object" && "data" in json && json.data ? json.data : json;
      const isAvailable = Boolean(res.ok && (data?.available === true || json?.available === true));

      if (isAvailable) {
        const norm = (data?.email || json?.email || cleanEmail).toLowerCase();
        setVerificationStatus("verified");
        setVerifiedEmail(norm);
        setEmailCheckError(null);
        saveSellerDraft({
          email: cleanEmail,
          isEmailVerified: true,
          verifiedEmail: norm,
        });
        return true;
      } else {
        const isTaken = data?.exists === true || json?.exists === true || data?.available === false || json?.available === false;
        const msg =
          data?.message ||
          json?.message ||
          json?.error ||
          (isTaken
            ? "An account with this email address already exists. Please use a different email or sign in."
            : "Could not verify email availability. Please try again.");
        setVerificationStatus(isTaken ? "taken" : "error");
        setVerifiedEmail("");
        setEmailCheckError(msg);
        saveSellerDraft({ isEmailVerified: false, verifiedEmail: "" });
        return false;
      }
    } catch (err: any) {
      console.error("Email verification error:", err);
      setVerificationStatus("error");
      setEmailCheckError(err?.message || "Failed to verify email availability. Please try again.");
      return false;
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

    // Block step transition until email is verified as available
    let verified = isEmailVerified;
    if (!verified) {
      verified = await handleVerifyEmail();
      if (!verified) {
        return;
      }
    }

    const cleanData: AccountStepData = {
      ...formData,
      email: formData.email.trim(),
      sellerRole: "Owner",
      phone: formData.phone.replace(/\D/g, "").slice(-10),
      isEmailVerified: true,
      verifiedEmail: formData.email.trim().toLowerCase(),
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

        {/* Email Address with Verification Button */}
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
            {verificationStatus === "verifying" ? (
              <div className={styles.verifyingBadge}>
                <Loader2 size={14} className="animate-spin" />
                <span>Checking...</span>
              </div>
            ) : isEmailVerified ? (
              <div className={styles.verifiedBadge}>
                <Check size={14} strokeWidth={3} />
                <span>Verified</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleVerifyEmail}
                disabled={!isEmailFormatValid || verificationStatus === "verifying"}
                className={styles.verifyEmailBtn}
                title={!isEmailFormatValid ? "Enter valid email to verify" : "Verify email availability"}
              >
                <span>Verify</span>
              </button>
            )}
          </div>

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
                {emailCheckError || "An account with this email address already exists."}
                <Link href="/seller/login" className={styles.loginShortcutLink}>
                  Sign In
                </Link>
              </span>
            </div>
          ) : emailCheckError || isEmailError ? (
            <div className={styles.helperTextError}>
              <AlertCircle size={13} />
              <span>{emailCheckError || emailCheck.error || "Please enter a valid email address."}</span>
            </div>
          ) : isEmailFormatValid && !isEmailVerified ? (
            <span style={{ fontSize: "0.78rem", color: "#EA580C", marginTop: "2px", fontWeight: "500" }}>
              Please click &quot;Verify&quot; to check email availability before continuing.
            </span>
          ) : (
            <span className={styles.helperText}>
              Used for account notifications and verification
            </span>
          )}
        </div>

        {/* Phone Number with +91 Country Code and 10-digit validation */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="phone">
            Phone <span className={styles.required}>*</span>
          </label>
          <div
            className={`${styles.phoneInputWrapper} ${
              isPhoneComplete
                ? styles.inputSuccess
                : isPhoneIncomplete || isPhoneError
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
              className={styles.phoneInputField}
              autoComplete="tel-national"
            />
            {isPhoneComplete && (
              <div className={styles.statusIconBox}>
                <CheckCircle2 size={18} className={styles.validCheckIcon} />
              </div>
            )}
            {(isPhoneIncomplete || (touched.phone && phoneLength === 0)) && (
              <div className={styles.statusIconBox}>
                <AlertCircle size={18} className={styles.invalidAlertIcon} />
              </div>
            )}
          </div>
          {isPhoneComplete ? (
            <div className={styles.helperTextSuccess}>
              <CheckCircle2 size={13} />
              <span>Valid 10-digit Indian mobile number</span>
              <span className={`${styles.digitCounter} ${styles.digitCounterComplete}`}>
                10/10
              </span>
            </div>
          ) : isPhoneIncomplete ? (
            <div className={styles.helperTextError}>
              <AlertCircle size={13} />
              <span>
                Enter 10 digits ({10 - phoneLength} more needed)
              </span>
              <span
                className={`${styles.digitCounter} ${styles.digitCounterIncomplete}`}
              >
                {phoneLength}/10
              </span>
            </div>
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
