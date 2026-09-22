"use client";

import React, { useEffect } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";

export interface RejectOrderModalProps {
  isOpen: boolean;
  orderId?: string;
  customerName?: string;
  itemsSummary?: string;
  totalAmount?: string;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export const RejectOrderModal: React.FC<RejectOrderModalProps> = ({
  isOpen,
  orderId,
  customerName,
  itemsSummary,
  totalAmount,
  isLoading = false,
  onClose,
  onConfirm,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-order-modal-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(4px)",
        padding: "16px",
        animation: "fadeIn 0.15s ease-out",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "460px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          border: "1px solid #E2E8F0",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
          animation: "scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px 16px 24px",
            borderBottom: "1px solid #F1F5F9",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: "#FEE2E2",
                color: "#DC2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3
                id="reject-order-modal-title"
                style={{
                  margin: 0,
                  fontSize: "1.12rem",
                  fontWeight: 600,
                  color: "#0F172A",
                  letterSpacing: "-0.01em",
                }}
              >
                Reject Order
              </h3>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748B" }}>
                Confirm order rejection
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: "transparent",
              border: "none",
              cursor: isLoading ? "not-allowed" : "pointer",
              color: "#94A3B8",
              padding: "6px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#0F172A")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#94A3B8")}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <p style={{ margin: 0, fontSize: "0.92rem", color: "#334155", lineHeight: "1.5" }}>
            Are you sure you want to reject and cancel this order? The customer will be immediately notified and the order will be removed from your active queue.
          </p>

          {/* Order Details Highlight Box */}
          {(orderId || customerName || itemsSummary || totalAmount) && (
            <div
              style={{
                backgroundColor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "10px",
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                fontSize: "0.86rem",
              }}
            >
              {orderId && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#64748B", fontWeight: 500 }}>Order ID:</span>
                  <span style={{ color: "#0F172A", fontWeight: 600 }}>{orderId}</span>
                </div>
              )}
              {customerName && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#64748B", fontWeight: 500 }}>Customer:</span>
                  <span style={{ color: "#0F172A", fontWeight: 600 }}>{customerName}</span>
                </div>
              )}
              {itemsSummary && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                  <span style={{ color: "#64748B", fontWeight: 500, flexShrink: 0 }}>Items:</span>
                  <span
                    style={{
                      color: "#334155",
                      fontWeight: 500,
                      textAlign: "right",
                      wordBreak: "break-word",
                      maxWidth: "240px",
                    }}
                  >
                    {itemsSummary}
                  </span>
                </div>
              )}
              {totalAmount && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px dashed #CBD5E1",
                    paddingTop: "6px",
                    marginTop: "2px",
                  }}
                >
                  <span style={{ color: "#64748B", fontWeight: 600 }}>Total:</span>
                  <span style={{ color: "#DC2626", fontWeight: 700, fontSize: "0.95rem" }}>
                    {totalAmount}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "12px",
            padding: "16px 24px 20px 24px",
            backgroundColor: "#FAFBFD",
            borderTop: "1px solid #F1F5F9",
          }}
        >
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            style={{
              padding: "10px 18px",
              borderRadius: "8px",
              border: "1px solid #CBD5E1",
              backgroundColor: "#FFFFFF",
              color: "#475569",
              fontSize: "0.88rem",
              fontWeight: 600,
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = "#F1F5F9";
                e.currentTarget.style.borderColor = "#94A3B8";
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = "#FFFFFF";
                e.currentTarget.style.borderColor = "#CBD5E1";
              }
            }}
          >
            Keep Order
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onConfirm()}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#DC2626",
              color: "#FFFFFF",
              fontSize: "0.88rem",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              cursor: isLoading ? "not-allowed" : "pointer",
              boxShadow: "0 2px 4px rgba(220, 38, 38, 0.2)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (!isLoading) e.currentTarget.style.backgroundColor = "#B91C1C";
            }}
            onMouseLeave={(e) => {
              if (!isLoading) e.currentTarget.style.backgroundColor = "#DC2626";
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />
                Rejecting...
              </>
            ) : (
              "Yes, Reject Order"
            )}
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scaleUp {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default RejectOrderModal;
