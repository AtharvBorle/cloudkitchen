"use client";

import React, { useState } from "react";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import styles from "./SellerSecuritySettings.module.css";

export interface LoginSessionItem {
  id: string;
  location: string;
  browser: string;
  os: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
}

export const DEFAULT_LOGIN_SESSIONS: LoginSessionItem[] = [
  {
    id: "session-1",
    location: "Mumbai, India",
    browser: "Chrome",
    os: "Windows Desktop",
    ip: "103.45.2.11",
    lastActive: "Current Active Session",
    isCurrent: true,
  },
  {
    id: "session-2",
    location: "Mumbai, India",
    browser: "Safari",
    os: "iPhone 14",
    ip: "103.45.2.19",
    lastActive: "Logged in on Jan 24, 2026",
    isCurrent: false,
  },
  {
    id: "session-3",
    location: "Bengaluru, India",
    browser: "Edge",
    os: "macOS",
    ip: "182.3.91.4",
    lastActive: "Logged in on Jan 18, 2026",
    isCurrent: false,
  },
];

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

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleCurrentChange = (val: string) => {
    setCurrent(val);
    onPasswordChange?.({ current: val, newPass, confirm });
  };

  const handleNewPassChange = (val: string) => {
    setNewPass(val);
    onPasswordChange?.({ current, newPass: val, confirm });
  };

  const handleConfirmChange = (val: string) => {
    setConfirm(val);
    onPasswordChange?.({ current, newPass, confirm: val });
  };

  return (
    <section className={`${styles.card} ${className}`} aria-labelledby="password-management-heading">
      <div className={styles.cardHeader}>
        <h2 id="password-management-heading" className={styles.cardTitle}>
          Password Management
        </h2>
      </div>

      <div className={styles.passwordForm}>
        {/* Current Password */}
        <div className={styles.fieldGroup}>
          <label htmlFor="current-password-input" className={styles.label}>
            Current Password
          </label>
          <div className={styles.inputWrapper}>
            <input
              id="current-password-input"
              type={showCurrent ? "text" : "password"}
              value={current}
              onChange={(e) => handleCurrentChange(e.target.value)}
              placeholder="••••••••••••"
              className={styles.input}
              autoComplete="current-password"
            />
            <button
              type="button"
              className={styles.eyeButton}
              onClick={() => setShowCurrent((prev) => !prev)}
              aria-label={showCurrent ? "Hide current password" : "Show current password"}
            >
              {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div className={styles.fieldGroup}>
          <label htmlFor="new-password-input" className={styles.label}>
            New Password
          </label>
          <div className={styles.inputWrapper}>
            <input
              id="new-password-input"
              type={showNew ? "text" : "password"}
              value={newPass}
              onChange={(e) => handleNewPassChange(e.target.value)}
              placeholder="At least 8 characters long"
              className={styles.input}
              autoComplete="new-password"
            />
            <button
              type="button"
              className={styles.eyeButton}
              onClick={() => setShowNew((prev) => !prev)}
              aria-label={showNew ? "Hide new password" : "Show new password"}
            >
              {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Confirm New Password */}
        <div className={styles.fieldGroup}>
          <label htmlFor="confirm-password-input" className={styles.label}>
            Confirm New Password
          </label>
          <div className={styles.inputWrapper}>
            <input
              id="confirm-password-input"
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={(e) => handleConfirmChange(e.target.value)}
              placeholder="Re-enter your new password"
              className={styles.input}
              autoComplete="new-password"
            />
            <button
              type="button"
              className={styles.eyeButton}
              onClick={() => setShowConfirm((prev) => !prev)}
              aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
      </div>
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
  sessions = DEFAULT_LOGIN_SESSIONS,
  onLogoutOtherSessions,
  className = "",
}) => {
  const [sessionList, setSessionList] = useState<LoginSessionItem[]>(sessions);
  const [loggedOutNotice, setLoggedOutNotice] = useState(false);

  const handleLogoutAllOther = () => {
    setSessionList((prev) => prev.filter((s) => s.isCurrent));
    setLoggedOutNotice(true);
    if (onLogoutOtherSessions) {
      onLogoutOtherSessions();
    }
    setTimeout(() => {
      setLoggedOutNotice(false);
    }, 4000);
  };

  const hasOtherSessions = sessionList.some((s) => !s.isCurrent);

  return (
    <section className={`${styles.card} ${className}`} aria-labelledby="active-sessions-heading">
      <div className={styles.cardHeader}>
        <h2 id="active-sessions-heading" className={styles.cardTitle}>
          Active Login Sessions
        </h2>
      </div>

      <div className={styles.sessionsList}>
        {sessionList.map((session) => (
          <div key={session.id} className={styles.sessionItem}>
            <div className={styles.sessionItemHeader}>
              <div className={styles.sessionTitleRow}>
                <h3 className={styles.deviceTitle}>
                  {session.location} • {session.browser} ({session.os})
                </h3>
                {session.isCurrent && (
                  <span className={styles.activeBadge}>Active Now</span>
                )}
              </div>
            </div>
            <p className={styles.sessionMeta}>
              {session.lastActive} • IP: {session.ip}
            </p>
          </div>
        ))}

        {loggedOutNotice && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#10B981", fontSize: "13px", fontWeight: 600, paddingTop: "12px" }}>
            <CheckCircle2 size={16} />
            <span>Successfully logged out of all other devices.</span>
          </div>
        )}

        <button
          type="button"
          className={styles.logoutAllButton}
          onClick={handleLogoutAllOther}
          disabled={!hasOtherSessions}
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
  sessions,
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
        sessions={sessions}
        onLogoutOtherSessions={onLogoutOtherSessions}
      />
    </div>
  );
};

export default SellerSecuritySettings;
