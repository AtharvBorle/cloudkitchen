"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, X, Eye, EyeOff, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/fetch-api";
import { PhoneInput } from "@/components/common/PhoneInput/PhoneInput";
import { PasswordInput } from "@/components/common/PasswordInput/PasswordInput";

export interface AgentFormData {
  fullName: string;
  phoneNumber: string;
  email: string;
  password: string;
  confirmPassword?: string;
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
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle Input Changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errorMessage) setErrorMessage(null);
  };

  // Handle Cancel / Close Navigation
  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
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

  // Handle Form Submission
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
    if (!formData.email.trim()) {
      setErrorMessage("Please enter an email address.");
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
        email: formData.email.trim(),
        password: formData.password,
      };

      const res = await fetchApi("/api/seller/delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (onSubmitSuccess) {
          onSubmitSuccess(data);
        } else {
          router.push("/seller/delivery");
        }
      } else {
        const errorData = await res.json().catch(() => null);
        setErrorMessage(
          errorData?.message || errorData?.error || "Failed to add delivery agent. Please try again."
        );
      }
    } catch (err: any) {
      console.error("Error creating agent:", err);
      setErrorMessage("Network error occurred. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "580px",
        backgroundColor: "#FFFFFF",
        borderRadius: "16px",
        boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.04)",
        overflow: "hidden",
        fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
        boxSizing: "border-box",
        border: "1px solid #E2E8F0",
      }}
      className="agent-canvas-card"
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 24px",
          borderBottom: "1px solid #F1F5F9",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            onClick={handleClose}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              border: "1px solid #E2E8F0",
              backgroundColor: "#F8FAFC",
              color: "#0F172A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.15s ease",
              padding: 0,
            }}
            className="back-arrow-btn"
            aria-label="Back to settlements"
            title="Back"
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>

          <h2
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#0F172A",
              margin: 0,
              letterSpacing: "-0.2px",
            }}
          >
            Add Delivery Agent
          </h2>

          <span
            style={{
              backgroundColor: "#FFF4EC",
              color: "#F97316",
              fontSize: "11px",
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: "12px",
              letterSpacing: "0.2px",
            }}
          >
            New Profile
          </span>
        </div>

        <button
          type="button"
          onClick={handleClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#64748B",
            borderRadius: "6px",
            transition: "all 0.15s ease",
          }}
          className="close-btn"
          aria-label="Close dialog"
          title="Close"
        >
          <X size={19} />
        </button>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit}>
        <div
          style={{
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            boxSizing: "border-box",
          }}
        >
          {/* Error Message Alert */}
          {errorMessage && (
            <div
              style={{
                backgroundColor: "#FEF2F2",
                border: "1px solid #FCA5A5",
                color: "#B91C1C",
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 500,
              }}
            >
              {errorMessage}
            </div>
          )}

          {/* Form Fields: Grid Layout */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "16px",
              boxSizing: "border-box",
            }}
            className="fields-grid"
          >
            {/* Field 1: Full Name */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#334155",
                }}
              >
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                placeholder="e.g. Rahul Sharma"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid #E2E8F0",
                  backgroundColor: "#FFFFFF",
                  fontSize: "13.5px",
                  color: "#0F172A",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "all 0.15s ease",
                  fontFamily: "inherit",
                }}
                className="agent-input"
              />
            </div>

            {/* Field 2: Phone Number */}
            <div>
              <PhoneInput
                id="agent-phone"
                label="Phone Number"
                required
                placeholder="98765 43210"
                value={formData.phoneNumber}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, phoneNumber: val }))
                }
              />
            </div>

            {/* Field 3: Email Address (Full Width on Desktop) */}
            <div
              style={{
                gridColumn: "span 2",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
              className="email-field-wrapper"
            >
              <label
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#334155",
                }}
              >
                Email Address
              </label>
              <input
                type="email"
                name="email"
                placeholder="e.g. rahul.s@gmail.com"
                value={formData.email}
                onChange={handleInputChange}
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid #E2E8F0",
                  backgroundColor: "#FFFFFF",
                  fontSize: "13.5px",
                  color: "#0F172A",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "all 0.15s ease",
                  fontFamily: "inherit",
                }}
                className="agent-input"
              />
            </div>

            {/* Field 4: Password */}
            <div>
              <PasswordInput
                id="agent-password"
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
            <div>
              <PasswordInput
                id="agent-confirm-password"
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
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #F1F5F9",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "12px",
            boxSizing: "border-box",
          }}
        >
          <button
            type="button"
            onClick={handleClose}
            style={{
              padding: "9px 22px",
              borderRadius: "10px",
              border: "1px solid #E2E8F0",
              backgroundColor: "#FFFFFF",
              color: "#334155",
              fontSize: "13.5px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
              fontFamily: "inherit",
            }}
            className="cancel-btn"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: "9px 24px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: "#F97316",
              backgroundImage: "linear-gradient(135deg, #FF5500 0%, #F97316 100%)",
              color: "#FFFFFF",
              fontSize: "13.5px",
              fontWeight: 700,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              boxShadow: "0 2px 8px rgba(249, 115, 22, 0.3)",
              transition: "all 0.15s ease",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontFamily: "inherit",
              opacity: isSubmitting ? 0.75 : 1,
            }}
            className="submit-agent-btn"
          >
            {isSubmitting && <Loader2 size={15} className="spinner-icon" />}
            <span>Add Agent</span>
          </button>
        </div>
      </form>

      <style jsx>{`
        .back-arrow-btn:hover {
          background-color: #F1F5F9 !important;
          border-color: #CBD5E1 !important;
        }
        .close-btn:hover {
          background-color: #F1F5F9 !important;
          color: #0F172A !important;
        }
        .agent-input:focus {
          border-color: #F97316 !important;
          box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.12) !important;
        }
        .cancel-btn:hover {
          background-color: #F8FAFC !important;
          border-color: #CBD5E1 !important;
        }
        .submit-agent-btn:hover:not(:disabled) {
          box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4) !important;
          transform: translateY(-1px);
        }
        .spinner-icon {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @media (max-width: 600px) {
          .fields-grid {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }
          .email-field-wrapper {
            grid-column: span 1 !important;
          }
          .agent-canvas-card {
            border-radius: 12px !important;
          }
        }
      `}</style>
    </div>
  );
}
