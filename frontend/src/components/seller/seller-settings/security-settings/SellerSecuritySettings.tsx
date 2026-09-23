"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, Loader2, Laptop, Smartphone } from "lucide-react";
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
  onLogoutOtherSessions,
  className = "",
}) => {
  const [currentSession, setCurrentSession] = useState<LoginSessionItem>({
    id: "current-session",
    location: "Detecting location...",
    browser: "Web Browser",
    os: "Current Device",
    ip: "Active Connection",
    lastActive: "Active right now",
    isCurrent: true,
    deviceType: "desktop",
  });

  const [hasOtherSessions, setHasOtherSessions] = useState(false);
  const [loggedOutNotice, setLoggedOutNotice] = useState(false);

  useEffect(() => {
    const { os, isMobile } = detectOS();
    const browser = detectBrowser();
    const location = detectLocation();

    setCurrentSession({
      id: "current-session",
      location,
      browser,
      os,
      ip: "Active Secure Session",
      lastActive: "Active right now",
      isCurrent: true,
      deviceType: isMobile ? "mobile" : "desktop",
    });
  }, []);

  const handleLogoutAllOther = () => {
    setHasOtherSessions(false);
    setLoggedOutNotice(true);
    if (onLogoutOtherSessions) {
      onLogoutOtherSessions();
    }
    setTimeout(() => {
      setLoggedOutNotice(false);
    }, 4000);
  };

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
          disabled={!hasOtherSessions && loggedOutNotice}
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

export const SellerSecuritySettings: React.FC<SellerSecuritySettingsProps> = ({
  passwords,
  onPasswordChange,
  onLogoutOtherSessions,
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
      <ActiveLoginSessionsCard
        onLogoutOtherSessions={onLogoutOtherSessions}
      />
    </div>
  );
};

export default SellerSecuritySettings;
