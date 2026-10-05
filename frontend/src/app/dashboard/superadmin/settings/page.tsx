"use client";

import React, { useState } from "react";
import { useRoomModule } from "@/context/RoomModuleContext";
import { ShieldCheck, Sparkles, BedDouble, Utensils, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

export default function SuperadminSettingsPage() {
  const { isRoomEnabled, setRoomEnabled, isLoading, refreshRoomSetting } = useRoomModule();
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleToggle = async (nextState: boolean) => {
    const ok = await setRoomEnabled(nextState);
    if (ok) {
      setSuccessToast(
        nextState
          ? "Room Module enabled successfully! Room features are now active across the platform."
          : "Room Module disabled! All room-related features are hidden across User, Seller, and Admin views."
      );
      setTimeout(() => setSuccessToast(null), 4000);
    }
  };

  const handleManualSync = async () => {
    await refreshRoomSetting();
    setSuccessToast("System settings synchronized across all active modules.");
    setTimeout(() => setSuccessToast(null), 3000);
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", paddingBottom: "60px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "30px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: "800", color: "var(--text-main)", margin: "0 0 6px 0" }}>
            System Settings &amp; Modules
          </h1>
          <p style={{ fontSize: "0.92rem", color: "var(--text-muted)", margin: 0 }}>
            Configure global platform feature flags, version rollout controls, and module availability.
          </p>
        </div>

        <button
          type="button"
          onClick={handleManualSync}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "8px",
            border: "1.5px solid var(--border)",
            backgroundColor: "#FFFFFF",
            fontSize: "0.85rem",
            fontWeight: "600",
            color: "var(--text-main)",
            cursor: "pointer",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
          }}
        >
          <RefreshCw size={15} />
          <span>Sync Settings</span>
        </button>
      </div>

      {successToast && (
        <div style={{
          backgroundColor: "#ECFDF5",
          border: "1.5px solid #6EE7B7",
          color: "#065F46",
          padding: "12px 18px",
          borderRadius: "10px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontWeight: "600",
          fontSize: "0.88rem"
        }}>
          <CheckCircle2 size={18} color="#10B981" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Main Feature Flag Card: Room Module */}
      <div style={{
        backgroundColor: "#FFFFFF",
        border: "1.5px solid var(--border)",
        borderRadius: "14px",
        padding: "24px 28px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
        marginBottom: "28px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
          <div style={{ flex: 1, minWidth: "280px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: isRoomEnabled ? "#F0FDF4" : "#FFF7ED",
                color: isRoomEnabled ? "#16A34A" : "#EA580C",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <BedDouble size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: "700", margin: 0, color: "var(--text-main)" }}>
                  Room &amp; Property Stays Module
                </h3>
                <span style={{
                  fontSize: "0.72rem",
                  fontWeight: "800",
                  padding: "2px 8px",
                  borderRadius: "9999px",
                  backgroundColor: isRoomEnabled ? "#DCFCE7" : "#F1F5F9",
                  color: isRoomEnabled ? "#15803D" : "#64748B",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  {isRoomEnabled ? "Currently Enabled (Active)" : "Currently Disabled (Next Version)"}
                </span>
              </div>
            </div>

            <p style={{ fontSize: "0.88rem", color: "#475569", lineHeight: "1.6", margin: "14px 0" }}>
              Control platform-wide visibility of all room booking, stay listings, property partner registrations, 
              seller room configurations, and user stay history. When this toggle is <strong>OFF</strong>, all room-related 
              tabs, sidebars, dashboard metrics, and forms are hidden for users, sellers, and admins.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", color: "#64748B" }}>
                <CheckCircle2 size={15} color={isRoomEnabled ? "#16A34A" : "#94A3B8"} />
                <span>Customer Room Browsing &amp; Booking</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", color: "#64748B" }}>
                <CheckCircle2 size={15} color={isRoomEnabled ? "#16A34A" : "#94A3B8"} />
                <span>Seller Room Management &amp; Bookings</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", color: "#64748B" }}>
                <CheckCircle2 size={15} color={isRoomEnabled ? "#16A34A" : "#94A3B8"} />
                <span>Property Partner Registration Option</span>
              </div>
            </div>
          </div>

          {/* Toggle Switch */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleToggle(!isRoomEnabled)}
              style={{
                width: "60px",
                height: "32px",
                borderRadius: "16px",
                backgroundColor: isRoomEnabled ? "#16A34A" : "#CBD5E1",
                border: "none",
                cursor: isLoading ? "wait" : "pointer",
                position: "relative",
                transition: "background-color 0.2s ease",
                padding: 0,
                outline: "none",
                boxShadow: "0 2px 5px rgba(0,0,0,0.15)"
              }}
              title={`Click to ${isRoomEnabled ? "disable" : "enable"} Room Module`}
            >
              <div style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                backgroundColor: "#FFFFFF",
                position: "absolute",
                top: "4px",
                left: isRoomEnabled ? "32px" : "4px",
                transition: "left 0.2s ease",
                boxShadow: "0 1px 4px rgba(0,0,0,0.25)"
              }} />
            </button>
            <span style={{ fontSize: "0.78rem", fontWeight: "700", color: isRoomEnabled ? "#16A34A" : "#64748B" }}>
              {isRoomEnabled ? "ENABLED" : "DISABLED"}
            </span>
          </div>
        </div>
      </div>

      {/* Cloud Kitchen Core Module (Always Enabled) */}
      <div style={{
        backgroundColor: "#FFFFFF",
        border: "1.5px solid var(--border)",
        borderRadius: "14px",
        padding: "24px 28px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
        opacity: 0.95
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              backgroundColor: "#FFF7ED",
              color: "#EA580C",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Utensils size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "700", margin: 0, color: "var(--text-main)" }}>
                Cloud Kitchen &amp; Food Delivery Module
              </h3>
              <p style={{ fontSize: "0.82rem", color: "#64748B", margin: 0 }}>
                Core platform capability &bull; Menus, Meal Subscriptions, Orders &amp; Delivery Tracking.
              </p>
            </div>
          </div>

          <span style={{
            fontSize: "0.72rem",
            fontWeight: "800",
            padding: "3px 10px",
            borderRadius: "9999px",
            backgroundColor: "#DCFCE7",
            color: "#15803D",
            textTransform: "uppercase",
            letterSpacing: "0.5px"
          }}>
            Always Active
          </span>
        </div>
      </div>
    </div>
  );
}
