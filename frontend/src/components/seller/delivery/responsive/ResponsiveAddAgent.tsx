"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Eye, EyeOff, CheckCircle2, Loader2, Bell } from "lucide-react";
import { fetchApi } from "@/lib/fetch-api";
import { validateEmail } from "@/lib/email-validation";
import { PhoneInput } from "@/components/common/PhoneInput/PhoneInput";
import { PasswordInput } from "@/components/common/PasswordInput/PasswordInput";
import styles from "./ResponsiveAddAgent.module.css";

export interface ResponsiveAddAgentFormData {
  fullName: string;
  phoneNumber: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface ResponsiveAddAgentProps {
  onBack?: () => void;
  onCancel?: () => void;
  onSubmitSuccess?: (agentData: any) => void;
  initialData?: Partial<ResponsiveAddAgentFormData>;
}

export const ResponsiveAddAgent: React.FC<ResponsiveAddAgentProps> = ({
  onBack,
  onCancel,
  onSubmitSuccess,
  initialData,
}) => {
  const router = useRouter();

  const [formData, setFormData] = useState<ResponsiveAddAgentFormData>({
    fullName: initialData?.fullName || "",
    phoneNumber: initialData?.phoneNumber || "",
    email: initialData?.email || "",
    password: initialData?.password || "",
    confirmPassword: initialData?.confirmPassword || "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errorMessage) setErrorMessage(null);
  };

  const handleBack = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (onBack) {
      onBack();
      return;
    }
    if (onCancel) {
      onCancel();
      return;
    }
    router.push("/seller/delivery/riders");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!formData.fullName.trim()) {
      setErrorMessage("Please enter the delivery agent's full name.");
      return;
    }
    if (!formData.phoneNumber.trim()) {
      setErrorMessage("Please enter a valid phone number.");
      return;
    }
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      setErrorMessage(emailValidation.error || "Please enter a valid email address.");
      return;
    }
    if (!formData.password.trim() || formData.password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }
    if (!formData.confirmPassword?.trim()) {
      setErrorMessage("Please confirm the password.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.fullName.trim(),
        phone: formData.phoneNumber.trim(),
        email: emailValidation.normalizedEmail,
        password: formData.password,
      };

      const res = await fetchApi("/api/seller/delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        showToast("Delivery Agent registered successfully!");
        setTimeout(() => {
          if (onSubmitSuccess) {
            onSubmitSuccess(data);
          } else {
            router.push("/seller/delivery/riders");
          }
        }, 800);
      } else {
        const errorData = await res.json().catch(() => null);
        let errMsg = errorData?.message || errorData?.error || "Failed to add delivery agent. Please try again.";
        const lower = errMsg.toLowerCase();
        if (
          res.status === 409 ||
          lower.includes("already in use") ||
          lower.includes("already exist") ||
          lower.includes("already registered")
        ) {
          errMsg = "This email address is already registered to an existing account. Please use a different email.";
        }
        setErrorMessage(errMsg);
      }
    } catch (err: any) {
      console.error("Error creating agent:", err);
      setErrorMessage("Network error occurred. Please check connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.screenWrapper}>
      {/* 420px Mobile View Container */}
      <div className={styles.mobileContainer}>
        {/* Top Header Bar */}
        <header className={styles.topBar}>
          <button
            type="button"
            className={styles.backButton}
            onClick={handleBack}
            aria-label="Back to riders"
            title="Back"
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>

          <h1 className={styles.headerTitle}>Add Delivery Agent</h1>

          <button
            type="button"
            className={styles.iconButton}
            onClick={() => router.push("/seller/notifications")}
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={20} />
          </button>
        </header>

        {/* Content Area */}
        <main className={styles.contentArea}>
          {/* Main Form Card */}
          <form className={styles.formCard} onSubmit={handleSubmit}>
            {/* Header Badge */}
            <div className={styles.badgeRow}>
              <h2 className={styles.badgeTitle}>Agent Profile Details</h2>
              <span className={styles.newProfileBadge}>New Profile</span>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className={styles.errorBanner}>{errorMessage}</div>
            )}

            {/* Field 1: Full Name */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Full Name</label>
              <input
                type="text"
                name="fullName"
                placeholder="e.g. Rahul Sharma"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                className={styles.inputField}
              />
            </div>

            {/* Field 2: Phone Number */}
            <div className={styles.fieldGroup}>
              <PhoneInput
                id="res-agent-phone"
                label="Phone Number"
                placeholder="98765 43210"
                value={formData.phoneNumber}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, phoneNumber: val }))
                }
                required
              />
            </div>

            {/* Field 3: Email Address */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="e.g. rahul.s@gmail.com"
                value={formData.email}
                onChange={handleInputChange}
                required
                className={styles.inputField}
              />
            </div>

            {/* Field 4: Password */}
            <div className={styles.fieldGroup}>
              <PasswordInput
                id="res-agent-password"
                label="Password"
                placeholder="Enter password"
                value={formData.password}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, password: val }))
                }
                required
                autoComplete="new-password"
                minLength={6}
              />
            </div>

            {/* Field 5: Confirm Password */}
            <div className={styles.fieldGroup}>
              <PasswordInput
                id="res-agent-confirm-password"
                label="Confirm Password"
                placeholder="Re-enter password"
                value={formData.confirmPassword || ""}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, confirmPassword: val }))
                }
                required
                isConfirm
                matchValue={formData.password}
                autoComplete="new-password"
                minLength={6}
              />
            </div>

            {/* Buttons */}
            <div className={styles.buttonContainer}>
              <button
                type="submit"
                disabled={isSubmitting}
                className={styles.submitBtn}
              >
                {isSubmitting && <Loader2 size={18} className={styles.spinner} />}
                <span>Add Delivery Agent</span>
              </button>

              <button
                type="button"
                onClick={handleBack}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
            </div>
          </form>
        </main>

        {/* Toast Notification */}
        {toastMessage && (
          <div className={styles.toastNotification}>
            <CheckCircle2 size={18} color="#10B981" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponsiveAddAgent;
