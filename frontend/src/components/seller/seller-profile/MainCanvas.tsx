"use client";

import React, { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import Topbar, { TopbarProps } from "../nav/Topbar";
import { useSellerProfile } from "@/hooks/useSellerProfile";

export interface SellerProfileData {
  ownerName: string;
  mobileNumber: string;
  email: string;
  outletName: string;
  registeredAddress: string;
  partnerRole?: string;
  avatarInitials?: string;
}

export interface MainCanvasProps {
  showTopbar?: boolean;
  topbarProps?: TopbarProps;
  headerTitle?: string;
  headerDescription?: string;
  formData?: SellerProfileData;
  initialData?: Partial<SellerProfileData>;
  onSave?: (data: SellerProfileData) => void;
  onLogout?: () => void;
  onDataChange?: (data: SellerProfileData) => void;
}

export default function MainCanvas({
  showTopbar = false,
  topbarProps,
  headerTitle = "Partner Profile Settings",
  headerDescription = "Manage operational credentials, personal contacts, and business workspace parameters.",
  formData: externalFormData,
  initialData,
  onSave,
  onLogout,
  onDataChange,
}: MainCanvasProps) {
  const seller = useSellerProfile();
  const [internalFormData, setInternalFormData] = useState<SellerProfileData>(() => ({
    ownerName: initialData?.ownerName || seller.ownerName,
    mobileNumber: initialData?.mobileNumber || seller.phone || "",
    email: initialData?.email || seller.email || "",
    outletName: initialData?.outletName || seller.businessName,
    registeredAddress: initialData?.registeredAddress || seller.address || "",
    partnerRole: initialData?.partnerRole || seller.partnerRole,
    avatarInitials: initialData?.avatarInitials || seller.avatarInitials,
  }));

  useEffect(() => {
    if (!initialData?.ownerName && seller.ownerName) {
      setInternalFormData((prev) => {
        if (prev.ownerName !== "Kitchen Owner") return prev;
        return {
          ...prev,
          ownerName: seller.ownerName,
          mobileNumber: seller.phone || prev.mobileNumber,
          email: seller.email || prev.email,
          outletName: seller.businessName || prev.outletName,
          registeredAddress: seller.address || prev.registeredAddress,
          avatarInitials: seller.avatarInitials,
        };
      });
    }
  }, [seller.ownerName, seller.phone, seller.email, seller.businessName, seller.address, seller.avatarInitials, initialData?.ownerName]);

  const formData = externalFormData || internalFormData;

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (field: keyof SellerProfileData, value: string) => {
    const updated = { ...formData, [field]: value };
    setInternalFormData(updated);
    if (onDataChange) onDataChange(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage("");

    if (onSave) {
      onSave(formData);
    }

    setTimeout(() => {
      setSaving(false);
      setSuccessMessage("Changes saved successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    }, 600);
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "1200px",
        minHeight: "100%",
        backgroundColor: "#F7F8FB",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
      }}
      className="main-canvas"
    >
      {/* Optional Topbar if MainCanvas is rendered standalone */}
      {showTopbar && <Topbar {...topbarProps} />}

      {/* Constrained Content (Width: 1120px, Gap: 24px, Padding: 32px 40px 48px) */}
      <main
        style={{
          width: "100%",
          maxWidth: "1120px",
          margin: "0 auto",
          padding: "32px 40px 48px 40px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          boxSizing: "border-box",
        }}
        className="constrained-content"
      >
        {/* Header Title & Description */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <h1
            style={{
              fontSize: "26px",
              fontWeight: 800,
              color: "#0F172A",
              letterSpacing: "-0.4px",
              margin: 0,
            }}
          >
            {headerTitle}
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "#64748B",
              margin: 0,
              fontWeight: 400,
            }}
          >
            {headerDescription}
          </p>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div
            style={{
              backgroundColor: "#ECFDF5",
              border: "1px solid #A7F3D0",
              color: "#059669",
              padding: "12px 18px",
              borderRadius: "10px",
              fontSize: "13.5px",
              fontWeight: 600,
            }}
          >
            {successMessage}
          </div>
        )}

        {/* Account Console Profile Card */}
        <div
          style={{
            width: "100%",
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #F1F5F9",
            padding: "36px 40px",
            boxShadow: "0 2px 12px rgba(0, 0, 0, 0.02)",
            display: "flex",
            flexDirection: "column",
            gap: "28px",
            boxSizing: "border-box",
          }}
          className="profile-card"
        >
          {/* Card Title */}
          <h2
            style={{
              fontSize: "19px",
              fontWeight: 700,
              color: "#0F172A",
              margin: 0,
              letterSpacing: "-0.2px",
            }}
          >
            Account Console Profile
          </h2>

          <form
            onSubmit={handleSave}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              width: "100%",
            }}
          >
            {/* SECTION 1: PERSONAL CREDENTIALS */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#FF5500",
                  letterSpacing: "0.6px",
                  textTransform: "uppercase",
                }}
              >
                PERSONAL CREDENTIALS
              </span>

              {/* Owner Full Name */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#475569",
                  }}
                >
                  Owner Full Name
                </label>
                <input
                  type="text"
                  value={formData.ownerName}
                  onChange={(e) => handleChange("ownerName", e.target.value)}
                  style={{
                    width: "100%",
                    height: "44px",
                    padding: "0 14px",
                    borderRadius: "8px",
                    border: "1px solid #E2E8F0",
                    backgroundColor: "#F8FAFC",
                    fontSize: "14px",
                    color: "#0F172A",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                    transition: "all 0.15s ease",
                  }}
                  className="canvas-input"
                />
              </div>

              {/* Mobile Number & Primary Email Row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px",
                }}
                className="two-col-grid"
              >
                {/* Mobile Number */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#475569",
                    }}
                  >
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    value={formData.mobileNumber}
                    onChange={(e) => handleChange("mobileNumber", e.target.value)}
                    style={{
                      width: "100%",
                      height: "44px",
                      padding: "0 14px",
                      borderRadius: "8px",
                      border: "1px solid #E2E8F0",
                      backgroundColor: "#F8FAFC",
                      fontSize: "14px",
                      color: "#0F172A",
                      outline: "none",
                      boxSizing: "border-box",
                      fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                      transition: "all 0.15s ease",
                    }}
                    className="canvas-input"
                  />
                </div>

                {/* Primary Email */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#475569",
                    }}
                  >
                    Primary Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    style={{
                      width: "100%",
                      height: "44px",
                      padding: "0 14px",
                      borderRadius: "8px",
                      border: "1px solid #E2E8F0",
                      backgroundColor: "#F8FAFC",
                      fontSize: "14px",
                      color: "#0F172A",
                      outline: "none",
                      boxSizing: "border-box",
                      fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                      transition: "all 0.15s ease",
                    }}
                    className="canvas-input"
                  />
                </div>
              </div>
            </div>

            {/* Subtle Horizontal Divider */}
            <div
              style={{
                width: "100%",
                height: "1px",
                backgroundColor: "#F1F5F9",
                margin: "8px 0",
              }}
            />

            {/* SECTION 2: BUSINESS WORKSPACE INFORMATION */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#FF5500",
                  letterSpacing: "0.6px",
                  textTransform: "uppercase",
                }}
              >
                BUSINESS WORKSPACE INFORMATION
              </span>

              {/* Neo Cloud Outlet Name */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#475569",
                  }}
                >
                  Neo Cloud Outlet Name
                </label>
                <input
                  type="text"
                  value={formData.outletName}
                  onChange={(e) => handleChange("outletName", e.target.value)}
                  style={{
                    width: "100%",
                    height: "44px",
                    padding: "0 14px",
                    borderRadius: "8px",
                    border: "1px solid #E2E8F0",
                    backgroundColor: "#F8FAFC",
                    fontSize: "14px",
                    color: "#0F172A",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                    transition: "all 0.15s ease",
                  }}
                  className="canvas-input"
                />
              </div>

              {/* Registered Address */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#475569",
                  }}
                >
                  Registered Address
                </label>
                <input
                  type="text"
                  value={formData.registeredAddress}
                  onChange={(e) => handleChange("registeredAddress", e.target.value)}
                  style={{
                    width: "100%",
                    height: "44px",
                    padding: "0 14px",
                    borderRadius: "8px",
                    border: "1px solid #E2E8F0",
                    backgroundColor: "#F8FAFC",
                    fontSize: "14px",
                    color: "#0F172A",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                    transition: "all 0.15s ease",
                  }}
                  className="canvas-input"
                />
              </div>
            </div>

            {/* Bottom Actions Row: Logout Account (Left) + Save Changes (Right) */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: "16px",
                paddingTop: "8px",
              }}
              className="actions-row"
            >
              {/* Logout Button */}
              <button
                type="button"
                onClick={() => {
                  if (onLogout) {
                    onLogout();
                  } else {
                    signOut({ callbackUrl: "/seller/login" });
                  }
                }}
                style={{
                  backgroundColor: "#FEE2E2",
                  color: "#DC2626",
                  border: "none",
                  borderRadius: "8px",
                  padding: "11px 20px",
                  fontSize: "13.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                }}
                className="logout-btn"
              >
                Logout Account
              </button>

              {/* Save Changes Button */}
              <button
                type="submit"
                disabled={saving}
                style={{
                  backgroundColor: "#FF5500",
                  backgroundImage: "linear-gradient(135deg, #FF5500 0%, #F97316 100%)",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  padding: "11px 28px",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: saving ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 14px rgba(255, 85, 0, 0.28)",
                  transition: "all 0.15s ease",
                  fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                }}
                className="save-btn"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </main>

      <style jsx>{`
        .canvas-input:focus {
          border-color: #FF5500 !important;
          background-color: #FFFFFF !important;
          box-shadow: 0 0 0 3px rgba(255, 85, 0, 0.1) !important;
        }
        .logout-btn:hover {
          background-color: #FECACA !important;
        }
        .save-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(255, 85, 0, 0.38) !important;
        }
        @media (max-width: 900px) {
          .constrained-content {
            padding: 24px 20px !important;
          }
          .profile-card {
            padding: 24px 20px !important;
          }
          .two-col-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
        }
        @media (max-width: 600px) {
          .actions-row {
            flex-direction: column-reverse !important;
            gap: 12px;
          }
          .logout-btn,
          .save-btn {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
