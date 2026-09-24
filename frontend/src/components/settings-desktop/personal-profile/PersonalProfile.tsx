"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  User,
  Pencil,
  Check,
  X,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { fetchApi } from "@/lib/fetch-api";
import { PhoneInput } from "@/components/common/PhoneInput/PhoneInput";
import styles from "./PersonalProfile.module.css";

export interface PersonalProfileProps {
  fullName?: string;
  email?: string;
  phone?: string;
  dob?: string;
  gender?: string;
  onEdit?: () => void;
}

export const PersonalProfile: React.FC<PersonalProfileProps> = ({
  fullName: customFullName,
  email: customEmail,
  phone: customPhone,
  dob = "15 / 08 / 1995",
  gender = "Male",
  onEdit,
}) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [liveData, setLiveData] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    city?: string;
    pincode?: string;
  }>({});

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editPincode, setEditPincode] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Dedicated Password Change States
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadProfile() {
      if (session?.user) {
        try {
          const res = await fetchApi("/api/user/profile");
          if (res.ok) {
            const data = await res.json();
            const user = data.data?.user || data.data || data.user || data;
            if (isMounted && user) {
              setLiveData({
                name: user.name,
                email: user.email,
                phone: user.phone,
                city: user.city,
                pincode: user.pincode,
              });
            }
          }
        } catch (err) {
          // ignore or fallback
        }
      }
    }
    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [session]);

  const fullName = customFullName || liveData.name || session?.user?.name || "";
  const email = customEmail || liveData.email || session?.user?.email || "";
  const phone = customPhone || liveData.phone || "";
  const city = liveData.city || "";
  const pincode = liveData.pincode || "";

  const handleOpenEdit = () => {
    if (onEdit) {
      onEdit();
      return;
    }
    if (!session?.user) {
      router.push("/login?callbackUrl=/settings-desktop");
      return;
    }
    setEditName(fullName);
    setEditPhone(phone.replace(/^\+91\s*/, ""));
    setEditCity(city);
    setEditPincode(pincode);
    setIsEditing(true);
  };

  const handleOpenPasswordModal = () => {
    if (!session?.user) {
      router.push("/login?callbackUrl=/settings-desktop");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
    setPasswordError(null);
    setPasswordSuccess(null);
    setPasswordModalOpen(true);
  };

  // Dedicated Password Change Handler
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword.trim()) {
      setPasswordError("Please enter your current password.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError("New password must be different from your current password.");
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await fetchApi("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setPasswordSuccess("Password updated successfully!");
        setFeedbackMsg("Password changed successfully!");
        setTimeout(() => {
          setCurrentPassword("");
          setNewPassword("");
          setConfirmNewPassword("");
          setShowCurrentPassword(false);
          setShowNewPassword(false);
          setShowConfirmNewPassword(false);
          setPasswordModalOpen(false);
          setChangePasswordOpen(false);
          setPasswordSuccess(null);
        }, 1400);
        setTimeout(() => setFeedbackMsg(null), 3000);
      } else {
        setPasswordError(
          data.message || data.error || "Failed to update password. Please check your current password."
        );
      }
    } catch (err: any) {
      console.error("Password update error:", err);
      setPasswordError(err.message || "Failed to update password. Please try again.");
    } finally {
      setPasswordSaving(false);
    }
  };

  // Profile Save Handler (including optional password change if accordion was opened)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanPhone = editPhone.replace(/\D/g, "");
    if (cleanPhone && cleanPhone.length !== 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    const cleanPincode = editPincode.replace(/\D/g, "");
    if (cleanPincode && cleanPincode.length !== 6) {
      setErrorMessage("Pincode must be exactly 6 digits.");
      return;
    }

    if (changePasswordOpen && (currentPassword || newPassword || confirmNewPassword)) {
      if (!currentPassword) {
        setErrorMessage("Please enter your current password.");
        return;
      }
      if (newPassword.length < 6) {
        setErrorMessage("New password must be at least 6 characters long.");
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setErrorMessage("New password and confirm password do not match.");
        return;
      }
    }

    setSaving(true);
    try {
      const payload: any = {
        name: editName.trim(),
        phone: cleanPhone,
        city: editCity.trim(),
        pincode: cleanPincode,
      };

      if (changePasswordOpen && newPassword) {
        payload.currentPassword = currentPassword.trim();
        payload.newPassword = newPassword.trim();
      }

      const res = await fetchApi("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setLiveData((prev) => ({
          ...prev,
          name: editName.trim(),
          phone: cleanPhone,
          city: editCity.trim(),
          pincode: cleanPincode,
        }));
        setIsEditing(false);
        setChangePasswordOpen(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmNewPassword(false);
        setFeedbackMsg("Profile updated successfully!");
        setTimeout(() => setFeedbackMsg(null), 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMessage(data.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
      setErrorMessage("Error updating profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.cardContainer}>
      {/* Feedback Toast */}
      {feedbackMsg && (
        <div
          style={{
            backgroundColor: "#DEF7EC",
            color: "#03543F",
            padding: "10px 16px",
            borderRadius: "8px",
            fontSize: "0.88rem",
            fontWeight: 600,
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Check size={16} />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Error Toast */}
      {errorMessage && (
        <div
          style={{
            backgroundColor: "#FDE8E8",
            color: "#9B1C1C",
            padding: "10px 16px",
            borderRadius: "8px",
            fontSize: "0.88rem",
            fontWeight: 600,
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className={styles.cardHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.iconBox}>
            <User size={18} strokeWidth={2.4} />
          </div>
          <h2 className={styles.cardTitle}>Personal Profile</h2>
        </div>

        {!isEditing && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Direct Change Password Button */}
            <button
              type="button"
              onClick={handleOpenPasswordModal}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 14px",
                backgroundColor: "#FFF1E8",
                color: "#FF5500",
                border: "1px solid #FFD0B8",
                borderRadius: "8px",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#FFE4D6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#FFF1E8";
              }}
              aria-label="Change Password"
            >
              <KeyRound size={13} strokeWidth={2.4} />
              <span>Change Password</span>
            </button>

            {/* Edit Profile Details Button */}
            <button
              type="button"
              className={styles.editBtn}
              onClick={handleOpenEdit}
              aria-label="Edit Details"
            >
              <Pencil size={13} strokeWidth={2.4} />
              <span>Edit Details</span>
            </button>
          </div>
        )}
      </div>

      {/* Standalone Change Password Modal */}
      {passwordModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
          }}
          onClick={() => setPasswordModalOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "460px",
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              padding: "24px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
              boxSizing: "border-box",
              fontFamily: "inherit",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    backgroundColor: "#FFF1E8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FF5500",
                  }}
                >
                  <Lock size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#0F172A" }}>
                    Change Password
                  </h3>
                  <p style={{ margin: 0, fontSize: "0.78rem", color: "#64748B", marginTop: "2px" }}>
                    Update your account password securely
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPasswordModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94A3B8",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Error Message */}
            {passwordError && (
              <div
                style={{
                  backgroundColor: "#FEF2F2",
                  color: "#991B1B",
                  border: "1px solid #F87171",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <AlertCircle size={15} color="#DC2626" />
                <span>{passwordError}</span>
              </div>
            )}

            {/* Success Message */}
            {passwordSuccess && (
              <div
                style={{
                  backgroundColor: "#ECFDF5",
                  color: "#065F46",
                  border: "1px solid #34D399",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Check size={15} color="#10B981" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {/* Password Form */}
            <form onSubmit={handlePasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Field 1: Current Password */}
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={{ fontSize: "0.76rem", fontWeight: 700, color: "#475569" }}>
                  CURRENT PASSWORD *
                </label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                    style={{
                      width: "100%",
                      padding: "10px 38px 10px 12px",
                      borderRadius: "8px",
                      border: "1.5px solid #CBD5E1",
                      fontSize: "0.88rem",
                      outline: "none",
                      backgroundColor: "#FFFFFF",
                      boxSizing: "border-box",
                      fontFamily: "inherit",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                    style={{
                      position: "absolute",
                      right: "10px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      color: "#94A3B8",
                    }}
                    aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Field 2: New Password */}
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <label style={{ fontSize: "0.76rem", fontWeight: 700, color: "#475569" }}>
                    NEW PASSWORD *
                  </label>
                  <span style={{ fontSize: "0.72rem", color: newPassword.length >= 6 ? "#10B981" : "#94A3B8" }}>
                    Min. 6 characters
                  </span>
                </div>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (at least 6 characters)"
                    required
                    style={{
                      width: "100%",
                      padding: "10px 38px 10px 12px",
                      borderRadius: "8px",
                      border: newPassword.length >= 6 ? "1.5px solid #10B981" : "1.5px solid #CBD5E1",
                      fontSize: "0.88rem",
                      outline: "none",
                      backgroundColor: "#FFFFFF",
                      boxSizing: "border-box",
                      fontFamily: "inherit",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    style={{
                      position: "absolute",
                      right: "10px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      color: "#94A3B8",
                    }}
                    aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Field 3: Confirm New Password */}
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <label style={{ fontSize: "0.76rem", fontWeight: 700, color: "#475569" }}>
                    CONFIRM NEW PASSWORD *
                  </label>
                  {confirmNewPassword && (
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        color: newPassword === confirmNewPassword ? "#10B981" : "#EF4444",
                      }}
                    >
                      {newPassword === confirmNewPassword ? "✓ Passwords match" : "✗ Does not match"}
                    </span>
                  )}
                </div>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    type={showConfirmNewPassword ? "text" : "password"}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                    style={{
                      width: "100%",
                      padding: "10px 38px 10px 12px",
                      borderRadius: "8px",
                      border:
                        confirmNewPassword && newPassword === confirmNewPassword
                          ? "1.5px solid #10B981"
                          : confirmNewPassword
                          ? "1.5px solid #EF4444"
                          : "1.5px solid #CBD5E1",
                      fontSize: "0.88rem",
                      outline: "none",
                      backgroundColor: "#FFFFFF",
                      boxSizing: "border-box",
                      fontFamily: "inherit",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword((prev) => !prev)}
                    style={{
                      position: "absolute",
                      right: "10px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      color: "#94A3B8",
                    }}
                    aria-label={showConfirmNewPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  disabled={passwordSaving}
                  style={{
                    padding: "9px 18px",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    color: "#475569",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordSaving || !currentPassword || !newPassword || newPassword !== confirmNewPassword}
                  style={{
                    padding: "9px 22px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "#FF5500",
                    color: "#FFFFFF",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor:
                      passwordSaving || !currentPassword || !newPassword || newPassword !== confirmNewPassword
                        ? "not-allowed"
                        : "pointer",
                    opacity:
                      passwordSaving || !currentPassword || !newPassword || newPassword !== confirmNewPassword
                        ? 0.7
                        : 1,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 2px 4px rgba(255, 85, 0, 0.2)",
                  }}
                >
                  {passwordSaving && <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />}
                  <span>{passwordSaving ? "Updating..." : "Update Password"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B" }}>FULL NAME</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter your full name"
                required
                style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1.5px solid #CBD5E1",
                  fontSize: "0.9rem",
                  color: "#0F172A",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <PhoneInput
                label="PHONE NUMBER"
                value={editPhone}
                onChange={(val) => setEditPhone(val)}
                placeholder="98765 43210"
                required
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B" }}>CITY</label>
              <input
                type="text"
                value={editCity}
                onChange={(e) => setEditCity(e.target.value)}
                placeholder="e.g. Pune, Mumbai"
                style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1.5px solid #CBD5E1",
                  fontSize: "0.9rem",
                  color: "#0F172A",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B" }}>PINCODE (6 DIGITS)</label>
              <input
                type="text"
                maxLength={6}
                value={editPincode}
                onChange={(e) => setEditPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="e.g. 411038"
                style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1.5px solid #CBD5E1",
                  fontSize: "0.9rem",
                  color: "#0F172A",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Inline Change Password Accordion in Edit Form */}
          <div style={{ marginTop: "8px", borderTop: "1px dashed #E2E8F0", paddingTop: "14px" }}>
            <button
              type="button"
              onClick={() => setChangePasswordOpen(!changePasswordOpen)}
              style={{
                background: "none",
                border: "none",
                color: "#FF5500",
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: "pointer",
                padding: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Lock size={14} />
              <span>{changePasswordOpen ? "Cancel Password Change" : "Change Account Password"}</span>
            </button>

            {changePasswordOpen && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "12px",
                  marginTop: "12px",
                  padding: "14px",
                  backgroundColor: "#F8FAFC",
                  borderRadius: "10px",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748B" }}>CURRENT PASSWORD</label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      style={{
                        width: "100%",
                        padding: "8px 36px 8px 10px",
                        borderRadius: "6px",
                        border: "1.5px solid #CBD5E1",
                        fontSize: "0.85rem",
                        outline: "none",
                        backgroundColor: "#FFFFFF",
                        boxSizing: "border-box",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword((prev) => !prev)}
                      style={{
                        position: "absolute",
                        right: "8px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#94A3B8",
                      }}
                      aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                    >
                      {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748B" }}>NEW PASSWORD (MIN 6 CHARS)</label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      style={{
                        width: "100%",
                        padding: "8px 36px 8px 10px",
                        borderRadius: "6px",
                        border: "1.5px solid #CBD5E1",
                        fontSize: "0.85rem",
                        outline: "none",
                        backgroundColor: "#FFFFFF",
                        boxSizing: "border-box",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      style={{
                        position: "absolute",
                        right: "8px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#94A3B8",
                      }}
                      aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748B" }}>CONFIRM NEW PASSWORD</label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <input
                      type={showConfirmNewPassword ? "text" : "password"}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Confirm new password"
                      style={{
                        width: "100%",
                        padding: "8px 36px 8px 10px",
                        borderRadius: "6px",
                        border: "1.5px solid #CBD5E1",
                        fontSize: "0.85rem",
                        outline: "none",
                        backgroundColor: "#FFFFFF",
                        boxSizing: "border-box",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPassword((prev) => !prev)}
                      style={{
                        position: "absolute",
                        right: "8px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#94A3B8",
                      }}
                      aria-label={showConfirmNewPassword ? "Hide confirm password" : "Show confirm password"}
                    >
                      {showConfirmNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setChangePasswordOpen(false);
                setShowCurrentPassword(false);
                setShowNewPassword(false);
                setShowConfirmNewPassword(false);
                setErrorMessage(null);
              }}
              disabled={saving}
              style={{
                padding: "8px 18px",
                borderRadius: "8px",
                border: "1px solid #CBD5E1",
                backgroundColor: "#FFFFFF",
                color: "#475569",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "8px 20px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#FF5500",
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Check size={15} />
              <span>{saving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      ) : (
        /* View Mode Fields */
        <div className={styles.fieldsGrid}>
          <div className={styles.fieldItem}>
            <span className={styles.fieldLabel}>FULL NAME</span>
            <p className={styles.fieldValue} style={{ color: fullName ? "#0F172A" : "#94A3B8" }}>
              {fullName || "Not provided"}
            </p>
          </div>

          <div className={styles.fieldItem}>
            <span className={styles.fieldLabel}>EMAIL ADDRESS</span>
            <p className={styles.fieldValue} style={{ color: email ? "#0F172A" : "#94A3B8" }}>
              {email || "Not provided"}
            </p>
          </div>

          <div className={styles.fieldItem}>
            <span className={styles.fieldLabel}>PHONE NUMBER</span>
            <p className={styles.fieldValue} style={{ color: phone ? "#0F172A" : "#94A3B8" }}>
              {phone || "Not configured"}
            </p>
          </div>

          <div className={styles.fieldItem}>
            <span className={styles.fieldLabel}>CITY / REGION</span>
            <p className={styles.fieldValue} style={{ color: city ? "#0F172A" : "#94A3B8" }}>
              {city || "Not configured"}
            </p>
          </div>

          <div className={styles.fieldItem}>
            <span className={styles.fieldLabel}>PINCODE</span>
            <p className={styles.fieldValue} style={{ color: pincode ? "#0F172A" : "#94A3B8" }}>
              {pincode || "Not configured"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalProfile;
