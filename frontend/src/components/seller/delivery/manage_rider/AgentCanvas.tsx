"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Lock,
  Bike,
  ShieldCheck,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Smartphone,
  Wallet,
  Sparkles,
} from "lucide-react";
import { fetchApi } from "@/lib/fetch-api";
import styles from "./AgentCanvas.module.css";

export interface AgentFormData {
  fullName: string;
  phoneNumber: string;
  email: string;
  password: string;
  confirmPassword?: string;
  vehicleType?: string;
  vehicleNumber?: string;
}

export interface AgentCanvasProps {
  onClose?: () => void;
  onCancel?: () => void;
  onSubmitSuccess?: (agentData: any) => void;
  initialData?: Partial<AgentFormData>;
}

export default function AgentCanvas({
  onClose,
  onCancel,
  onSubmitSuccess,
  initialData,
}: AgentCanvasProps) {
  const router = useRouter();

  const [formData, setFormData] = useState<AgentFormData>({
    fullName: initialData?.fullName || "",
    phoneNumber: initialData?.phoneNumber || "",
    email: initialData?.email || "",
    password: initialData?.password || "",
    confirmPassword: initialData?.confirmPassword || "",
    vehicleType: initialData?.vehicleType || "Motorcycle / Scooter",
    vehicleNumber: initialData?.vehicleNumber || "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handle Input Changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errorMessage) setErrorMessage(null);
  };

  // Handle Phone Number with only digits
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, "").slice(0, 10);
    setFormData((prev) => ({
      ...prev,
      phoneNumber: rawVal,
    }));
    if (errorMessage) setErrorMessage(null);
  };

  // Handle Navigation Back
  const handleBack = () => {
    if (onClose) {
      onClose();
      return;
    }
    if (onCancel) {
      onCancel();
      return;
    }
    router.push("/seller/delivery");
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Form Validations
    if (!formData.fullName.trim()) {
      setErrorMessage("Please enter the delivery partner's full name.");
      return;
    }
    if (!formData.phoneNumber.trim() || formData.phoneNumber.trim().length !== 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
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
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        vehicleType: formData.vehicleType || "Motorcycle / Scooter",
        vehicleNumber: formData.vehicleNumber?.trim() || undefined,
      };

      const res = await fetchApi("/api/seller/delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json().catch(() => ({}));

      if (res.ok) {
        setSuccessMessage("Delivery Partner created successfully! Redirecting...");
        setTimeout(() => {
          if (onSubmitSuccess) {
            onSubmitSuccess(resData);
          } else {
            router.push("/seller/delivery");
          }
        }, 800);
      } else {
        setErrorMessage(
          resData?.message ||
            resData?.error ||
            "Failed to add delivery partner. Please verify details."
        );
      }
    } catch (err: any) {
      console.error("Error creating delivery agent:", err);
      setErrorMessage("Network error occurred. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      {/* 1. Header & Navigation Row */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <button type="button" onClick={handleBack} className={styles.backLink}>
            <ArrowLeft size={16} />
            <span>Back to Delivery Console</span>
          </button>
          <div className={styles.pageTitleRow}>
            <h1 className={styles.pageTitle}>Add Delivery Boy</h1>
            <span className={styles.badgeNew}>New Partner</span>
          </div>
          <p className={styles.pageSubtitle}>
            Register an in-house delivery rider, set up mobile login credentials, and enable real-time order dispatch.
          </p>
        </div>
      </div>

      {/* 2. Main Content Grid */}
      <form onSubmit={handleSubmit}>
        <div className={styles.contentGrid}>
          {/* Left Column: Form Cards */}
          <div className={styles.formColumn}>
            {/* Error Message Alert */}
            {errorMessage && (
              <div className={styles.errorAlert}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Message Alert */}
            {successMessage && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 16px",
                  backgroundColor: "#ECFDF5",
                  border: "1px solid #A7F3D0",
                  borderRadius: "10px",
                  color: "#065F46",
                  fontSize: "13.5px",
                  fontWeight: 600,
                }}
              >
                <CheckCircle2 size={18} color="#059669" style={{ flexShrink: 0 }} />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Card 1: Personal & Contact Details */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={`${styles.cardIconBox} ${styles.cardIconBoxOrange}`}>
                  <User size={19} />
                </div>
                <div className={styles.cardHeaderText}>
                  <h2 className={styles.cardTitle}>Personal &amp; Contact Details</h2>
                  <p className={styles.cardSubtitle}>Basic information for rider identity and SMS alerts</p>
                </div>
              </div>

              <div className={styles.fieldGroup} style={{ marginBottom: "16px" }}>
                <label className={styles.fieldLabel}>
                  Full Name <span className={styles.requiredStar}>*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  className={styles.fieldInput}
                  placeholder="e.g. Rahul Sharma"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className={styles.formGrid2}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    Mobile Number <span className={styles.requiredStar}>*</span>
                  </label>
                  <div className={styles.phoneInputContainer}>
                    <span className={styles.phonePrefix}>🇮🇳 +91</span>
                    <input
                      type="tel"
                      name="phoneNumber"
                      className={styles.phoneField}
                      placeholder="98765 43210"
                      value={formData.phoneNumber}
                      onChange={handlePhoneChange}
                      maxLength={10}
                      required
                    />
                  </div>
                  <span className={styles.fieldHint}>Used for order SMS dispatch &amp; OTPs</span>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    Email Address <span className={styles.requiredStar}>*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    className={styles.fieldInput}
                    placeholder="e.g. rahul.rider@gmail.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                  <span className={styles.fieldHint}>Will be used as rider portal username</span>
                </div>
              </div>
            </div>

            {/* Card 2: Login Credentials & Security */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={`${styles.cardIconBox} ${styles.cardIconBoxBlue}`}>
                  <Lock size={19} />
                </div>
                <div className={styles.cardHeaderText}>
                  <h2 className={styles.cardTitle}>Mobile Portal Login Credentials</h2>
                  <p className={styles.cardSubtitle}>Set up secure credentials for the delivery rider application</p>
                </div>
              </div>

              <div className={styles.formGrid2} style={{ marginBottom: "12px" }}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    Set Password <span className={styles.requiredStar}>*</span>
                  </label>
                  <div className={styles.passwordWrapper}>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      className={styles.passwordField}
                      placeholder="Minimum 6 characters"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    Confirm Password <span className={styles.requiredStar}>*</span>
                  </label>
                  <div className={styles.passwordWrapper}>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      className={styles.passwordField}
                      placeholder="Re-enter password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex={-1}
                      title={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles.securityNote}>
                <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: "1px" }} />
                <span>
                  The delivery partner will log in to the Neo Cloud Rider Portal using their email address and this password. You can reset credentials anytime from this console.
                </span>
              </div>
            </div>

            {/* Card 3: Vehicle & Operational Info */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={`${styles.cardIconBox} ${styles.cardIconBoxPurple}`}>
                  <Bike size={19} />
                </div>
                <div className={styles.cardHeaderText}>
                  <h2 className={styles.cardTitle}>Vehicle &amp; Delivery Logistics</h2>
                  <p className={styles.cardSubtitle}>Optional transport details for kitchen dispatch records</p>
                </div>
              </div>

              <div className={styles.formGrid2}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Vehicle Type</label>
                  <select
                    name="vehicleType"
                    className={styles.fieldInput}
                    value={formData.vehicleType}
                    onChange={handleInputChange}
                  >
                    <option value="Motorcycle / Scooter">Motorcycle / Scooter</option>
                    <option value="Electric Bike / EV">Electric Bike (EV)</option>
                    <option value="Bicycle">Bicycle</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Vehicle Number (Optional)</label>
                  <input
                    type="text"
                    name="vehicleNumber"
                    className={styles.fieldInput}
                    placeholder="e.g. MH 12 AB 1234"
                    value={formData.vehicleNumber}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className={styles.actionsBar}>
              <button
                type="button"
                onClick={handleBack}
                className={styles.cancelBtn}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Registering Partner...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Add Delivery Boy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Guidance & Info Cards */}
          <div className={styles.sideColumn}>
            {/* Guide Card */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={`${styles.cardIconBox} ${styles.cardIconBoxOrange}`}>
                  <Smartphone size={18} />
                </div>
                <div className={styles.cardHeaderText}>
                  <h3 className={styles.cardTitle}>How Rider Onboarding Works</h3>
                </div>
              </div>

              <div className={styles.guideStepList}>
                <div className={styles.guideStepItem}>
                  <span className={styles.guideStepNumber}>1</span>
                  <div className={styles.guideStepContent}>
                    <span className={styles.guideStepTitle}>Create Rider Profile</span>
                    <span className={styles.guideStepDesc}>Fill in phone, email, and password to register your delivery agent.</span>
                  </div>
                </div>

                <div className={styles.guideStepItem}>
                  <span className={styles.guideStepNumber}>2</span>
                  <div className={styles.guideStepContent}>
                    <span className={styles.guideStepTitle}>Share Login Credentials</span>
                    <span className={styles.guideStepDesc}>Share the registered email and password with your delivery boy.</span>
                  </div>
                </div>

                <div className={styles.guideStepItem}>
                  <span className={styles.guideStepNumber}>3</span>
                  <div className={styles.guideStepContent}>
                    <span className={styles.guideStepTitle}>Instant Dispatch</span>
                    <span className={styles.guideStepDesc}>Rider turns On Duty and starts receiving orders from your kitchen console.</span>
                  </div>
                </div>
              </div>

              <div className={styles.appLinkBox}>
                <span className={styles.appLinkText}>Rider Portal URL</span>
                <span className={styles.appBadge}>/auth/login/delivery</span>
              </div>
            </div>

            {/* COD & Reconciliation Card */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={`${styles.cardIconBox} ${styles.cardIconBoxEmerald}`}>
                  <Wallet size={18} />
                </div>
                <div className={styles.cardHeaderText}>
                  <h3 className={styles.cardTitle}>Cash on Delivery (COD)</h3>
                </div>
              </div>

              <ul className={styles.bulletList}>
                <li className={styles.bulletItem}>
                  <span className={styles.bulletDot}>•</span>
                  <span><strong>Live Wallet:</strong> Cash collected from customers automatically logs to rider&apos;s digital balance.</span>
                </li>
                <li className={styles.bulletItem}>
                  <span className={styles.bulletDot}>•</span>
                  <span><strong>Daily Handover:</strong> Settle and clear cash held by riders anytime from the Delivery console.</span>
                </li>
                <li className={styles.bulletItem}>
                  <span className={styles.bulletDot}>•</span>
                  <span><strong>Duty Status:</strong> Turn riders on or off duty with a single tap.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
