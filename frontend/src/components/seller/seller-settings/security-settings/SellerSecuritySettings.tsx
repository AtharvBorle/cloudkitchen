"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, Loader2, Laptop, Smartphone, Trash2, X } from "lucide-react";
import { signOut } from "next-auth/react";
import { PasswordInput } from "@/components/common/PasswordInput/PasswordInput";
import { fetchApi } from "@/lib/fetch-api";
import styles from "./SellerSecuritySettings.module.css";

export interface LoginSessionItem {
  id: string;
  location: string;
  browser: string;
  os: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
  deviceType?: "desktop" | "mobile";
}

export const DEFAULT_LOGIN_SESSIONS: LoginSessionItem[] = [];

/**
 * Helpers to detect the user's real device, browser, and location
 */
function detectOS(): { os: string; isMobile: boolean } {
  if (typeof window === "undefined") return { os: "Windows Desktop", isMobile: false };
  const userAgent = window.navigator.userAgent;
  const platform = window.navigator.platform || "";

  if (/iPhone|iPad|iPod/.test(userAgent)) {
    return { os: "iOS Mobile", isMobile: true };
  } else if (/Android/.test(userAgent)) {
    return { os: "Android Mobile", isMobile: true };
  } else if (/Macintosh|MacIntel|MacPPC|Mac68K/.test(platform) || /Macintosh|Mac OS X/.test(userAgent)) {
    return { os: "macOS Desktop", isMobile: false };
  } else if (/Win32|Win64|Windows|WinCE/.test(platform) || /Windows NT/.test(userAgent)) {
    if (/Windows NT 10.0/.test(userAgent)) {
      return { os: "Windows 10/11 Desktop", isMobile: false };
    }
    return { os: "Windows Desktop", isMobile: false };
  } else if (/Linux/.test(platform) || /Linux/.test(userAgent)) {
    return { os: "Linux Desktop", isMobile: false };
  }
  return { os: "Current Device", isMobile: false };
}

function detectBrowser(): string {
  if (typeof window === "undefined") return "Web Browser";
  const ua = window.navigator.userAgent;
  if (ua.indexOf("Edg") > -1) {
    return "Microsoft Edge";
  } else if (ua.indexOf("Chrome") > -1 && ua.indexOf("Safari") > -1 && ua.indexOf("OPR") === -1) {
    return "Google Chrome";
  } else if (ua.indexOf("Safari") > -1 && ua.indexOf("Chrome") === -1) {
    return "Safari";
  } else if (ua.indexOf("Firefox") > -1) {
    return "Mozilla Firefox";
  } else if (ua.indexOf("OPR") > -1 || ua.indexOf("Opera") > -1) {
    return "Opera";
  }
  return "Google Chrome";
}

function detectLocation(): string {
  if (typeof window === "undefined") return "Current Location";
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) {
      if (tz.includes("/")) {
        const parts = tz.split("/");
        const city = parts[1].replace(/_/g, " ");
        const region = parts[0];
        return `${city}, ${region}`;
      }
      return tz;
    }
  } catch {}
  return "India (Local Session)";
}

/* ======================================================== */
/* 1. Password Management Card Component                    */
/* ======================================================== */
export interface PasswordManagementProps {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  onPasswordChange?: (passwords: {
    current: string;
    newPass: string;
    confirm: string;
  }) => void;
  className?: string;
}

export const PasswordManagementCard: React.FC<PasswordManagementProps> = ({
  currentPassword = "",
  newPassword = "",
  confirmPassword = "",
  onPasswordChange,
  className = "",
}) => {
  const [current, setCurrent] = useState(currentPassword);
  const [newPass, setNewPass] = useState(newPassword);
  const [confirm, setConfirm] = useState(confirmPassword);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleCurrentChange = (val: string) => {
    setCurrent(val);
    setErrorMsg(null);
    setSuccessMsg(null);
    onPasswordChange?.({ current: val, newPass, confirm });
  };

  const handleNewPassChange = (val: string) => {
    setNewPass(val);
    setErrorMsg(null);
    setSuccessMsg(null);
    onPasswordChange?.({ current, newPass: val, confirm });
  };

  const handleConfirmChange = (val: string) => {
    setConfirm(val);
    setErrorMsg(null);
    setSuccessMsg(null);
    onPasswordChange?.({ current, newPass, confirm: val });
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!current.trim()) {
      setErrorMsg("Please enter your current password.");
      return;
    }
    if (!newPass) {
      setErrorMsg("Please enter a new password.");
      return;
    }
    if (newPass.length < 6) {
      setErrorMsg("New password must be at least 6 characters long.");
      return;
    }
    if (newPass !== confirm) {
      setErrorMsg("New password and confirm password do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Try updating via /api/seller/profile (for sellers) with fallback to /api/user/profile (for users)
      const res = await fetchApi("/api/seller/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: current,
          newPassword: newPass,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          const userRes = await fetchApi("/api/user/profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              currentPassword: current,
              newPassword: newPass,
            }),
          });
          const userData = await userRes.json().catch(() => ({}));
          if (!userRes.ok) {
            throw new Error(userData.message || "Failed to update password.");
          }
        } else {
          throw new Error(data.message || "Failed to update password.");
        }
      }

      setSuccessMsg("Password updated successfully!");
      setCurrent("");
      setNewPass("");
      setConfirm("");
      if (onPasswordChange) {
        onPasswordChange({ current: "", newPass: "", confirm: "" });
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update password. Please check your current password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={`${styles.card} ${className}`} aria-labelledby="password-management-heading">
      <div className={styles.cardHeader}>
        <h2 id="password-management-heading" className={styles.cardTitle}>
          Password Management
        </h2>
      </div>

      <form className={styles.passwordForm} onSubmit={handleUpdatePassword}>
        {/* Success Alert */}
        {successMsg && (
          <div className={styles.alertSuccess}>
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className={styles.alertError}>
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Current Password */}
        <div className={styles.fieldGroup}>
          <PasswordInput
            id="current-password-input"
            label="Current Password"
            value={current}
            onChange={(val) => handleCurrentChange(val)}
            placeholder="••••••••••••"
            autoComplete="current-password"
            minLength={6}
          />
        </div>

        {/* New Password */}
        <div className={styles.fieldGroup}>
          <PasswordInput
            id="new-password-input"
            label="New Password"
            value={newPass}
            onChange={(val) => handleNewPassChange(val)}
            placeholder="At least 6 characters long"
            autoComplete="new-password"
            minLength={6}
          />
        </div>

        {/* Confirm New Password */}
        <div className={styles.fieldGroup}>
          <PasswordInput
            id="confirm-password-input"
            label="Confirm New Password"
            isConfirm
            matchValue={newPass}
            value={confirm}
            onChange={(val) => handleConfirmChange(val)}
            placeholder="Re-enter your new password"
            autoComplete="new-password"
            minLength={6}
          />
        </div>

        {/* Submit Button */}
        <div className={styles.passwordSubmitRow}>
          <button
            type="submit"
            className={styles.updatePasswordBtn}
            disabled={isSubmitting || !current || !newPass || !confirm}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className={styles.spinner} />
                <span>Updating Password...</span>
              </>
            ) : (
              <span>Update Password</span>
            )}
          </button>
        </div>
      </form>
    </section>
  );
};

/* ======================================================== */
/* 2. Active Login Sessions Card Component                  */
/* ======================================================== */
export interface ActiveLoginSessionsProps {
  sessions?: LoginSessionItem[];
  onLogoutOtherSessions?: () => void;
  className?: string;
}

export const ActiveLoginSessionsCard: React.FC<ActiveLoginSessionsProps> = ({
  sessions: initialSessions,
  onLogoutOtherSessions,
  className = "",
}) => {
  const [sessionList, setSessionList] = useState<LoginSessionItem[]>(() => initialSessions || []);
  const [loggedOutNotice, setLoggedOutNotice] = useState(false);
  const [loading, setLoading] = useState(false);

  const getDeviceId = () => {
    if (typeof window === "undefined") return "browser-device";
    let id = localStorage.getItem("cloudkitchen_seller_device_id");
    if (!id) {
      id = `dev_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
      localStorage.setItem("cloudkitchen_seller_device_id", id);
    }
    return id;
  };

  const loadSessions = async () => {
    const { os, isMobile } = detectOS();
    const browser = detectBrowser();
    const location = detectLocation();
    const deviceId = getDeviceId();

    // Set optimistic current device session first
    const currentDeviceFallback: LoginSessionItem = {
      id: "current-local-session",
      location,
      browser,
      os,
      ip: "Active Secure Session",
      lastActive: "Active right now",
      isCurrent: true,
      deviceType: isMobile ? "mobile" : "desktop",
    };

    try {
      const query = new URLSearchParams({
        deviceId,
        location,
        browser,
        os,
        deviceType: isMobile ? "mobile" : "desktop",
      });

      const res = await fetchApi(`/api/seller/sessions?${query.toString()}`);
      if (res.ok) {
        const json = await res.json();
        const fetched = json.data?.sessions;
        if (Array.isArray(fetched) && fetched.length > 0) {
          setSessionList(fetched);
          return;
        }
      }
    } catch (err) {
      console.error("Failed to load active login sessions:", err);
    }

    setSessionList((prev) => (prev.length > 0 ? prev : [currentDeviceFallback]));
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleLogoutSingleSession = async (sessionId: string) => {
    try {
      await fetchApi(`/api/seller/sessions?id=${sessionId}`, {
        method: "DELETE",
      });
      setSessionList((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      console.error("Failed to terminate session:", err);
    }
  };

  const handleLogoutAllOther = async () => {
    const deviceId = getDeviceId();
    try {
      await fetchApi(`/api/seller/sessions?allOther=true&currentDeviceId=${deviceId}`, {
        method: "DELETE",
      });
      setSessionList((prev) => prev.filter((s) => s.isCurrent));
      setLoggedOutNotice(true);
      if (onLogoutOtherSessions) {
        onLogoutOtherSessions();
      }
      setTimeout(() => {
        setLoggedOutNotice(false);
      }, 4000);
    } catch (err) {
      console.error("Failed to logout other sessions:", err);
    }
  };

  const currentSession = sessionList.find((s) => s.isCurrent) || sessionList[0] || {
    id: "current-session",
    location: "Calcutta, Asia",
    browser: "Google Chrome",
    os: "Windows 10/11 Desktop",
    ip: "Active Secure Session",
    lastActive: "Active right now",
    isCurrent: true,
    deviceType: "desktop",
  };

  const otherSessions = sessionList.filter((s) => s.id !== currentSession.id && !s.isCurrent);

  return (
    <section className={`${styles.card} ${className}`} aria-labelledby="active-sessions-heading">
      <div className={styles.cardHeader}>
        <h2 id="active-sessions-heading" className={styles.cardTitle}>
          Active Login Sessions
        </h2>
      </div>

      <div className={styles.sessionsList}>
        {/* Exact Current Device Session */}
        <div className={styles.sessionItem}>
          <div className={styles.sessionItemHeader}>
            <div className={styles.sessionTitleRow}>
              {currentSession.deviceType === "mobile" ? (
                <Smartphone size={16} color="#EA580C" style={{ flexShrink: 0 }} />
              ) : (
                <Laptop size={16} color="#EA580C" style={{ flexShrink: 0 }} />
              )}
              <h3 className={styles.deviceTitle}>
                {currentSession.location} • {currentSession.browser} ({currentSession.os})
              </h3>
              <span className={styles.activeBadge}>This Device (Active Now)</span>
            </div>
          </div>
          <p className={styles.sessionMeta}>
            {currentSession.lastActive} • {currentSession.ip}
          </p>
        </div>

        {/* Other Logged-in Devices / Browsers */}
        {otherSessions.map((session) => (
          <div key={session.id} className={styles.sessionItem}>
            <div className={styles.sessionItemHeader}>
              <div className={styles.sessionTitleRow}>
                {session.deviceType === "mobile" ? (
                  <Smartphone size={16} color="#64748B" style={{ flexShrink: 0 }} />
                ) : (
                  <Laptop size={16} color="#64748B" style={{ flexShrink: 0 }} />
                )}
                <h3 className={styles.deviceTitle}>
                  {session.location} • {session.browser} ({session.os})
                </h3>
              </div>
              <button
                type="button"
                className={styles.logoutSingleDeviceBtn}
                onClick={() => handleLogoutSingleSession(session.id)}
                title="Log out from this device"
              >
                Log Out
              </button>
            </div>
            <p className={styles.sessionMeta}>
              {session.lastActive} • {session.ip}
            </p>
          </div>
        ))}

        {loggedOutNotice && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#16A34A", fontSize: "13px", fontWeight: 600, paddingTop: "12px" }}>
            <CheckCircle2 size={16} />
            <span>All other active device sessions have been invalidated.</span>
          </div>
        )}

        <button
          type="button"
          className={styles.logoutAllButton}
          onClick={handleLogoutAllOther}
          disabled={otherSessions.length === 0 && !loggedOutNotice}
        >
          Log Out of All Other Devices
        </button>
      </div>
    </section>
  );
};

/* ======================================================== */
/* 3. Combined SellerSecuritySettings Component              */
/* ======================================================== */
export interface SellerSecuritySettingsProps {
  passwords?: {
    current?: string;
    newPass?: string;
    confirm?: string;
  };
  sessions?: LoginSessionItem[];
  onPasswordChange?: (passwords: {
    current: string;
    newPass: string;
    confirm: string;
  }) => void;
  onLogoutOtherSessions?: () => void;
  className?: string;
}

/* ======================================================== */
/* 2. Danger Zone: Delete Kitchen Account                   */
/* ======================================================== */
export const SellerDeleteAccountCard: React.FC<{ className?: string }> = ({ className = "" }) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetchApi("/api/seller/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword || undefined })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setDeleteError(data.message || data.error || "Failed to schedule seller account deletion.");
        return;
      }
      setDeleteModalOpen(false);
      await signOut({ callbackUrl: "/auth/login/seller?deletion_scheduled=true" });
    } catch (err: any) {
      setDeleteError(err.message || "An unexpected network error occurred.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div
      className={`${styles.card || ""} ${className}`}
      style={{
        border: "1px solid #FCA5A5",
        backgroundColor: "#FFF8F8",
        borderRadius: "16px",
        padding: "24px",
        marginTop: "24px",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ maxWidth: "560px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <Trash2 size={20} color="#DC2626" />
            <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#991B1B" }}>
              Delete Kitchen Account
            </h3>
          </div>
          <p style={{ margin: 0, fontSize: "0.86rem", color: "#64748B", lineHeight: "1.5" }}>
            Requesting account deletion immediately takes your kitchen offline. You have a <strong>30-day grace period</strong> to recover your account simply by logging back in. After 30 days, personal seller details are permanently anonymized while order history is safely retained.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setDeleteError(null);
            setDeletePassword("");
            setDeleteModalOpen(true);
          }}
          style={{
            padding: "9px 18px",
            backgroundColor: "#FEF2F2",
            color: "#DC2626",
            border: "1.5px solid #F87171",
            borderRadius: "10px",
            fontSize: "0.85rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#FEE2E2";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#FEF2F2";
          }}
        >
          <Trash2 size={15} />
          <span>Delete Kitchen</span>
        </button>
      </div>

      {deleteModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: "16px",
          }}
          onClick={() => !deleteLoading && setDeleteModalOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "500px",
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    backgroundColor: "#FEF2F2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#DC2626",
                  }}
                >
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#991B1B" }}>
                    Confirm Kitchen Deletion
                  </h3>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748B", marginTop: "2px" }}>
                    30-Day Soft Deletion Period
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !deleteLoading && setDeleteModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94A3B8",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                backgroundColor: "#FFFBEB",
                border: "1px solid #FDE68A",
                color: "#92400E",
                borderRadius: "10px",
                padding: "12px 14px",
                fontSize: "0.82rem",
                lineHeight: "1.5",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                <AlertCircle size={15} color="#D97706" />
                <span>Notice for Kitchen Owners:</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.8rem", color: "#78350F" }}>
                <li>Your kitchen will be placed <strong>offline immediately</strong>.</li>
                <li><strong>Cancel anytime within 30 days:</strong> Logging back into your account restores your kitchen and cancels deletion.</li>
                <li>After 30 days, personal documents, KYC, and contacts are permanently anonymized.</li>
              </ul>
            </div>

            {deleteError && (
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
                <AlertCircle size={15} />
                <span>{deleteError}</span>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontSize: "0.76rem", fontWeight: 700, color: "#475569" }}>
                CONFIRM PASSWORD (OPTIONAL)
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter password to verify ownership"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1.5px solid #CBD5E1",
                  fontSize: "0.88rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleteLoading}
                style={{
                  padding: "9px 18px",
                  backgroundColor: "#F1F5F9",
                  color: "#475569",
                  border: "1px solid #CBD5E1",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                style={{
                  padding: "9px 18px",
                  backgroundColor: "#DC2626",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: deleteLoading ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  opacity: deleteLoading ? 0.7 : 1,
                }}
              >
                {deleteLoading && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
                <span>{deleteLoading ? "Processing..." : "Confirm & Delete Kitchen"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ======================================================== */
/* 3. Combined SellerSecuritySettings Component              */
/* ======================================================== */
export interface SellerSecuritySettingsProps {
  passwords?: {
    current?: string;
    newPass?: string;
    confirm?: string;
  };
  sessions?: LoginSessionItem[];
  onPasswordChange?: (passwords: {
    current: string;
    newPass: string;
    confirm: string;
  }) => void;
  onLogoutOtherSessions?: () => void;
  className?: string;
}

export const SellerSecuritySettings: React.FC<SellerSecuritySettingsProps> = ({
  passwords,
  onPasswordChange,
  className = "",
}) => {
  return (
    <div className={`${styles.container} ${className}`}>
      <PasswordManagementCard
        currentPassword={passwords?.current}
        newPassword={passwords?.newPass}
        confirmPassword={passwords?.confirm}
        onPasswordChange={onPasswordChange}
      />
      <SellerDeleteAccountCard />
    </div>
  );
};

export default SellerSecuritySettings;
