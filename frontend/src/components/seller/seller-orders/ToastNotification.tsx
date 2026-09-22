"use client";

import React, { useEffect } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

export interface ToastNotificationProps {
  type?: "success" | "error" | "info";
  message: string;
  duration?: number;
  onClose: () => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  type = "success",
  message,
  duration = 3500,
  onClose,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const isSuccess = type === "success";
  const isError = type === "error";

  const borderColor = isSuccess ? "#86EFAC" : isError ? "#FCA5A5" : "#93C5FD";
  const bgColor = isSuccess ? "#F0FDF4" : isError ? "#FEF2F2" : "#EFF6FF";
  const iconColor = isSuccess ? "#16A34A" : isError ? "#DC2626" : "#2563EB";
  const textColor = isSuccess ? "#14532D" : isError ? "#7F1D1D" : "#1E3A8A";

  return (
    <aside
      aria-label="Notification"
      aria-live="polite"
      style={{
        position: "fixed",
        top: "24px",
        right: "24px",
        zIndex: 10000,
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: "12px",
        padding: "14px 18px",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        maxWidth: "400px",
        minWidth: "280px",
        fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
        animation: "toastSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div style={{ color: iconColor, display: "flex", alignItems: "center", flexShrink: 0 }}>
        {isSuccess && <CheckCircle2 size={20} />}
        {isError && <AlertTriangle size={20} />}
        {!isSuccess && !isError && <Info size={20} />}
      </div>
      <div style={{ flex: 1, fontSize: "0.88rem", fontWeight: 500, color: textColor, lineHeight: "1.4" }}>
        {message}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close notification"
        style={{
          background: "transparent",
          border: "none",
          padding: "4px",
          color: textColor,
          opacity: 0.7,
          cursor: "pointer",
          borderRadius: "6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "opacity 0.15s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
      >
        <X size={16} />
      </button>

      <style jsx global>{`
        @keyframes toastSlideIn {
          from {
            transform: translateY(-16px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </aside>
  );
};

export default ToastNotification;
