"use client";

import React, { useState, useEffect } from "react";
import { useRoomModule } from "@/context/RoomModuleContext";
import { ShieldCheck, Sparkles, BedDouble, Utensils, CheckCircle2, AlertCircle, MessageSquare, Receipt, Percent, Save, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/fetch-api";

export default function SuperadminSettingsPage() {
  const { isRoomEnabled, setRoomEnabled, isChatbotEnabled, setChatbotEnabled, isLoading } = useRoomModule();
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Tax Settings State
  const [productTaxRate, setProductTaxRate] = useState<string>("5");
  const [deliveryTaxRate, setDeliveryTaxRate] = useState<string>("18");
  const [isSavingTax, setIsSavingTax] = useState<boolean>(false);
  const [taxLoaded, setTaxLoaded] = useState<boolean>(false);

  useEffect(() => {
    async function loadTaxSettings() {
      try {
        const res = await fetchApi("/api/superadmin/settings");
        if (res.ok) {
          const data = await res.json();
          const map = data.data?.settingsMap || data.settingsMap || {};
          if (map.PRODUCT_TAX_RATE !== undefined) setProductTaxRate(String(map.PRODUCT_TAX_RATE));
          if (map.DELIVERY_TAX_RATE !== undefined) setDeliveryTaxRate(String(map.DELIVERY_TAX_RATE));
        }
      } catch (err) {
        console.error("Failed to load tax settings:", err);
      } finally {
        setTaxLoaded(true);
      }
    }
    loadTaxSettings();
  }, []);

  const handleSaveTax = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingTax(true);
    try {
      const pRate = parseFloat(productTaxRate) || 0;
      const dRate = parseFloat(deliveryTaxRate) || 0;
      const res = await fetchApi("/api/superadmin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: [
            { key: "PRODUCT_TAX_RATE", value: pRate.toString() },
            { key: "DELIVERY_TAX_RATE", value: dRate.toString() }
          ]
        })
      });
      if (res.ok) {
        setSuccessToast("Platform tax settings successfully updated & applied platform-wide!");
        setTimeout(() => setSuccessToast(null), 4000);
      } else {
        alert("Failed to save tax settings");
      }
    } catch (err) {
      console.error("Error saving tax settings:", err);
      alert("Error saving tax settings");
    } finally {
      setIsSavingTax(false);
    }
  };

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

  const handleToggleChatbot = async (nextState: boolean) => {
    const ok = await setChatbotEnabled(nextState);
    if (ok) {
      setSuccessToast(
        nextState
          ? "Bitey AI Chatbot enabled! The virtual assistant is now active and visible across the platform."
          : "Bitey AI Chatbot disabled! The virtual assistant is now completely hidden platform-wide."
      );
      setTimeout(() => setSuccessToast(null), 4000);
    }
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

      {/* Tax Settings Section */}
      <div style={{
        backgroundColor: "#FFFFFF",
        border: "1.5px solid var(--border)",
        borderRadius: "14px",
        padding: "24px 28px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
        marginBottom: "28px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            backgroundColor: "#EFF6FF",
            color: "#2563EB",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Receipt size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: "700", margin: 0, color: "var(--text-main)" }}>
              Platform Tax Settings
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
              Configure GST rates applicable across all kitchen products and delivery charges platform-wide.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveTax}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
            marginTop: "16px"
          }}>
            {/* Product Tax */}
            <div style={{
              backgroundColor: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "10px",
              padding: "16px"
            }}>
              <label style={{ display: "block", fontSize: "0.88rem", fontWeight: "700", color: "#1E293B", marginBottom: "4px" }}>
                Product Tax Rate (%)
              </label>
              <p style={{ fontSize: "0.8rem", color: "#64748B", margin: "0 0 10px 0" }}>
                Applies GST to dishes and products sold on the platform (e.g. 5% GST, split into 2.5% CGST + 2.5% SGST).
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={productTaxRate}
                  onChange={(e) => setProductTaxRate(e.target.value)}
                  disabled={!taxLoaded || isSavingTax}
                  style={{
                    flex: 1,
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1.5px solid #CBD5E1",
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    color: "#0F172A",
                    backgroundColor: "#FFFFFF"
                  }}
                  required
                />
                <span style={{ fontSize: "0.95rem", fontWeight: "700", color: "#64748B" }}>%</span>
              </div>
            </div>

            {/* Seller-Side Delivery Tax */}
            <div style={{
              backgroundColor: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "10px",
              padding: "16px"
            }}>
              <label style={{ display: "block", fontSize: "0.88rem", fontWeight: "700", color: "#1E293B", marginBottom: "4px" }}>
                Seller-Side Delivery Tax Rate (%)
              </label>
              <p style={{ fontSize: "0.8rem", color: "#64748B", margin: "0 0 10px 0" }}>
                Applies GST to delivery charges added by sellers (e.g. 18% GST, split into 9% CGST + 9% SGST).
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={deliveryTaxRate}
                  onChange={(e) => setDeliveryTaxRate(e.target.value)}
                  disabled={!taxLoaded || isSavingTax}
                  style={{
                    flex: 1,
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1.5px solid #CBD5E1",
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    color: "#0F172A",
                    backgroundColor: "#FFFFFF"
                  }}
                  required
                />
                <span style={{ fontSize: "0.95rem", fontWeight: "700", color: "#64748B" }}>%</span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "18px" }}>
            <button
              type="submit"
              disabled={isSavingTax || !taxLoaded}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 22px",
                backgroundColor: "#2563EB",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                fontWeight: "700",
                fontSize: "0.88rem",
                cursor: isSavingTax ? "wait" : "pointer",
                boxShadow: "0 2px 6px rgba(37, 99, 235, 0.25)",
                transition: "background-color 0.2s"
              }}
            >
              {isSavingTax ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Tax Configuration
                </>
              )}
            </button>
          </div>
        </form>
      </div>

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

      {/* Feature Flag Card: Bitey AI Chatbot */}
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
                backgroundColor: isChatbotEnabled ? "#F0FDF4" : "#F1F5F9",
                color: isChatbotEnabled ? "#16A34A" : "#64748B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <MessageSquare size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: "700", margin: 0, color: "var(--text-main)" }}>
                  Bitey Virtual AI Assistant (Chatbot)
                </h3>
                <span style={{
                  fontSize: "0.72rem",
                  fontWeight: "800",
                  padding: "2px 8px",
                  borderRadius: "9999px",
                  backgroundColor: isChatbotEnabled ? "#DCFCE7" : "#F1F5F9",
                  color: isChatbotEnabled ? "#15803D" : "#64748B",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  {isChatbotEnabled ? "Currently Enabled (Active)" : "Currently Disabled (Hidden)"}
                </span>
              </div>
            </div>

            <p style={{ fontSize: "0.88rem", color: "#475569", lineHeight: "1.6", margin: "14px 0" }}>
              Control platform-wide visibility of the Bitey interactive floating assistant widget on user and seller interfaces.
              When this toggle is <strong>OFF</strong>, the chatbot floating bubble, dialog launcher, and assistant support are completely hidden across all screens.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", color: "#64748B" }}>
                <CheckCircle2 size={15} color={isChatbotEnabled ? "#16A34A" : "#94A3B8"} />
                <span>Customer AI Order Tracking &amp; FAQs</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", color: "#64748B" }}>
                <CheckCircle2 size={15} color={isChatbotEnabled ? "#16A34A" : "#94A3B8"} />
                <span>Seller Inquiries &amp; Support Tickets</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", color: "#64748B" }}>
                <CheckCircle2 size={15} color={isChatbotEnabled ? "#16A34A" : "#94A3B8"} />
                <span>Floating Draggable Chat Bubble</span>
              </div>
            </div>
          </div>

          {/* Toggle Switch */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleToggleChatbot(!isChatbotEnabled)}
              style={{
                width: "60px",
                height: "32px",
                borderRadius: "16px",
                backgroundColor: isChatbotEnabled ? "#16A34A" : "#CBD5E1",
                border: "none",
                cursor: isLoading ? "wait" : "pointer",
                position: "relative",
                transition: "background-color 0.2s ease",
                padding: 0,
                outline: "none",
                boxShadow: "0 2px 5px rgba(0,0,0,0.15)"
              }}
              title={`Click to ${isChatbotEnabled ? "disable" : "enable"} Bitey Chatbot`}
            >
              <div style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                backgroundColor: "#FFFFFF",
                position: "absolute",
                top: "4px",
                left: isChatbotEnabled ? "32px" : "4px",
                transition: "left 0.2s ease",
                boxShadow: "0 1px 4px rgba(0,0,0,0.25)"
              }} />
            </button>
            <span style={{ fontSize: "0.78rem", fontWeight: "700", color: isChatbotEnabled ? "#16A34A" : "#64748B" }}>
              {isChatbotEnabled ? "ENABLED" : "DISABLED"}
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
