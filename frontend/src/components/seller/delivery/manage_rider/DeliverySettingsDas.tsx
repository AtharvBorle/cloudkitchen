"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Truck,
  CheckCircle2,
  Loader2,
  DollarSign,
  ShieldCheck,
  Check,
} from "lucide-react";
import SellerSidebar from "../../sidebar/Sidebar";
import Topbar from "../../nav/Topbar";
import { fetchApi } from "@/lib/fetch-api";
import { useSellerProfile, updateCachedProfile, isGenericFallbackName } from "@/hooks/useSellerProfile";

export interface DeliverySettingsDasProps {
  topbarTitle?: string;
  searchPlaceholder?: string;
  ownerName?: string;
  partnerRole?: string;
  avatarInitials?: string;
  activeSidebarId?: string;
}

export default function DeliverySettingsDas({
  topbarTitle = "Owner Operations Console",
  searchPlaceholder = "Search delivery settings, fees, radius...",
  ownerName,
  partnerRole,
  avatarInitials,
  activeSidebarId = "delivery",
}: DeliverySettingsDasProps) {
  const router = useRouter();
  const seller = useSellerProfile();
  const effectiveOwnerName = ownerName && !isGenericFallbackName(ownerName) ? ownerName : (!isGenericFallbackName(seller.ownerName) ? seller.ownerName : "");
  const effectivePartnerRole = partnerRole || seller.partnerRole;
  const effectiveAvatarInitials = avatarInitials && avatarInitials !== "JD" ? avatarInitials : seller.avatarInitials;

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State - strictly synced with seller profile
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState<number>(() => {
    return seller.deliveryRadiusKm ?? 5;
  });
  const [deliveryFee, setDeliveryFee] = useState<number>(() => {
    return seller.deliveryCharge !== undefined ? seller.deliveryCharge : 50;
  });
  const [enableFreeDelivery, setEnableFreeDelivery] = useState<boolean>(() => {
    return seller.enableFreeDelivery !== undefined ? seller.enableFreeDelivery : false;
  });
  const [freeDeliveryMinOrder, setFreeDeliveryMinOrder] = useState<number>(() => {
    return seller.freeDeliveryThreshold !== undefined ? seller.freeDeliveryThreshold : 500;
  });

  // Sync state when seller profile loads or updates
  useEffect(() => {
    if (seller.deliveryRadiusKm !== undefined) {
      setDeliveryRadiusKm(seller.deliveryRadiusKm);
    }
    if (seller.deliveryCharge !== undefined) {
      setDeliveryFee(seller.deliveryCharge);
    }
    try {
      const saved = localStorage.getItem("seller_delivery_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.enableFreeDelivery !== undefined) setEnableFreeDelivery(Boolean(parsed.enableFreeDelivery));
        if (parsed.freeDeliveryMinOrder !== undefined) {
          const num = parseFloat(String(parsed.freeDeliveryMinOrder).replace(/[^0-9.]/g, ""));
          if (!isNaN(num)) setFreeDeliveryMinOrder(num);
        }
      }
    } catch {}
    if (seller.enableFreeDelivery !== undefined) {
      setEnableFreeDelivery(seller.enableFreeDelivery);
    }
    if (seller.freeDeliveryThreshold !== undefined) {
      setFreeDeliveryMinOrder(seller.freeDeliveryThreshold);
    }
  }, [seller.deliveryRadiusKm, seller.deliveryCharge, seller.enableFreeDelivery, seller.freeDeliveryThreshold]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const parsedDeliveryFee = typeof deliveryFee === "number" && !isNaN(deliveryFee) && deliveryFee >= 0 ? deliveryFee : 50;
    const parsedMinOrder = typeof freeDeliveryMinOrder === "number" && !isNaN(freeDeliveryMinOrder) && freeDeliveryMinOrder >= 0 ? freeDeliveryMinOrder : 500;

    const dataToSave = {
      deliveryRadiusKm,
      deliveryFee: `₹${parsedDeliveryFee}`,
      deliveryCharge: parsedDeliveryFee,
      enableFreeDelivery,
      freeDeliveryMinOrder: `₹${parsedMinOrder}`,
    };

    try {
      localStorage.setItem("seller_delivery_settings", JSON.stringify(dataToSave));
      window.dispatchEvent(new CustomEvent("seller-delivery-settings-updated", { detail: dataToSave }));
    } catch (err) {
      console.error("LocalStorage save error:", err);
    }

    try {
      const res = await fetchApi("/api/seller/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryRadiusKm,
          deliveryCharge: parsedDeliveryFee,
          enableFreeDelivery,
          freeDeliveryThreshold: parsedMinOrder,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to persist delivery settings");
      }

      updateCachedProfile({
        deliveryRadiusKm,
        deliveryCharge: parsedDeliveryFee,
        enableFreeDelivery,
        freeDeliveryThreshold: parsedMinOrder,
      });

      showToast("Delivery settings saved successfully!");
      setTimeout(() => {
        router.push("/seller/delivery");
      }, 900);
    } catch (err) {
      console.error("Failed to save delivery settings:", err);
      showToast("Failed to save delivery settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        alignItems: "flex-start",
        backgroundColor: "#F7F8FB",
        fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
      }}
      className="delivery-settings-layout"
    >
      {/* 1. Left Sidebar Navigation */}
      <SellerSidebar
        activeItemId={activeSidebarId}
        isMobileOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        ownerName={ownerName}
        partnerRole={partnerRole}
        avatarInitials={avatarInitials}
      />

      {/* 2. Main Desktop Area */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          backgroundColor: "#F7F8FB",
        }}
        className="delivery-settings-main-wrapper"
      >
        <Topbar
          title={topbarTitle}
          searchPlaceholder={searchPlaceholder}
          ownerName={effectiveOwnerName}
          partnerRole={effectivePartnerRole}
          avatarInitials={effectiveAvatarInitials}
          onMenuToggle={() => setIsMobileOpen((prev) => !prev)}
        />

        {/* Content Area */}
        <main
          style={{
            flex: 1,
            width: "100%",
            boxSizing: "border-box",
            padding: "28px 36px",
            maxWidth: "1000px",
            margin: "0 auto",
          }}
        >
          {/* Back Link */}
          <button
            type="button"
            onClick={() => router.push("/seller/delivery")}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              fontSize: "13.5px",
              fontWeight: 600,
              color: "#64748B",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "16px",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#0F172A")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#64748B")}
          >
            <ChevronLeft size={18} />
            <span>Back to Delivery Operations</span>
          </button>

          {/* Page Title & Subtitle */}
          <div style={{ marginBottom: "24px" }}>
            <h1
              style={{
                fontSize: "26px",
                fontWeight: 800,
                color: "#0F172A",
                margin: 0,
                letterSpacing: "-0.5px",
              }}
            >
              Delivery &amp; Fulfillment Settings
            </h1>
            <p
              style={{
                fontSize: "14px",
                color: "#64748B",
                margin: "4px 0 0 0",
              }}
            >
              Configure your kitchen&apos;s delivery radius, customer per-order delivery charge, and free delivery thresholds.
            </p>
          </div>

          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Card 1: Delivery Coverage Radius */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: "1.5px solid #E2E8F0",
                borderRadius: "14px",
                padding: "22px 24px",
                boxShadow: "0 1px 4px rgba(0, 0, 0, 0.03)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div>
                  <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0F172A", margin: 0 }}>
                    Maximum Delivery Radius
                  </h2>
                  <p style={{ fontSize: "13px", color: "#64748B", margin: "4px 0 0 0" }}>
                    Only customers located within this distance from your kitchen can discover your menu and order.
                  </p>
                </div>
                <span
                  style={{
                    fontSize: "15px",
                    fontWeight: 800,
                    color: "#EA580C",
                    backgroundColor: "#FFF7ED",
                    padding: "6px 16px",
                    borderRadius: "10px",
                    border: "1.5px solid #FED7AA",
                  }}
                >
                  {deliveryRadiusKm} km
                </span>
              </div>

              <input
                type="range"
                min={1}
                max={15}
                step={1}
                value={deliveryRadiusKm}
                onChange={(e) => setDeliveryRadiusKm(Number(e.target.value))}
                style={{
                  width: "100%",
                  accentColor: "#EA580C",
                  cursor: "pointer",
                  height: "7px",
                  borderRadius: "4px",
                  marginTop: "8px",
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748B", marginTop: "6px" }}>
                <span>1 km (Hyperlocal)</span>
                <span>8 km</span>
                <span>15 km (Extended coverage)</span>
              </div>
            </div>

            {/* Card 2: Standard Delivery Fee */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: "1.5px solid #E2E8F0",
                borderRadius: "14px",
                padding: "22px 24px",
                boxShadow: "0 1px 4px rgba(0, 0, 0, 0.03)",
              }}
            >
              <div style={{ marginBottom: "16px" }}>
                <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0F172A", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  <Truck size={18} color="#EA580C" />
                  <span>Standard Delivery Charge</span>
                </h2>
                <p style={{ fontSize: "13px", color: "#64748B", margin: "4px 0 0 0" }}>
                  Per-order delivery fee charged to customers at checkout. This fee is authoritative across the customer cart, order calculation, tax invoice, and seller dashboard.
                </p>
              </div>

              <div style={{ maxWidth: "280px" }}>
                <label style={{ fontSize: "12.5px", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>
                  Per-Order Delivery Fee
                </label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <span style={{ position: "absolute", left: "14px", color: "#64748B", fontWeight: 700, fontSize: "15px" }}>₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={deliveryFee}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setDeliveryFee(isNaN(val) ? 0 : val);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 14px 10px 32px",
                      borderRadius: "9px",
                      border: "1.5px solid #CBD5E1",
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "#0F172A",
                      backgroundColor: "#FFFFFF",
                      outline: "none",
                      fontFamily: "inherit",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#EA580C")}
                    onBlur={(e) => (e.target.style.borderColor = "#CBD5E1")}
                  />
                </div>
              </div>
            </div>

            {/* Card 3: Free Delivery Threshold */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: "1.5px solid #E2E8F0",
                borderRadius: "14px",
                padding: "22px 24px",
                boxShadow: "0 1px 4px rgba(0, 0, 0, 0.03)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                <div>
                  <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0F172A", margin: 0 }}>
                    Free Delivery Threshold
                  </h2>
                  <p style={{ fontSize: "13px", color: "#64748B", margin: "4px 0 0 0" }}>
                    Automatically waive delivery fee when a customer&apos;s cart exceeds a minimum order value.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enableFreeDelivery}
                  onClick={() => setEnableFreeDelivery((prev) => !prev)}
                  style={{
                    width: "48px",
                    height: "26px",
                    borderRadius: "13px",
                    backgroundColor: enableFreeDelivery ? "#EA580C" : "#CBD5E1",
                    border: "none",
                    cursor: "pointer",
                    position: "relative",
                    transition: "background-color 0.2s ease",
                    padding: 0,
                    outline: "none",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      backgroundColor: "#FFFFFF",
                      position: "absolute",
                      top: "3px",
                      left: enableFreeDelivery ? "25px" : "3px",
                      transition: "left 0.2s ease",
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
                    }}
                  />
                </button>
              </div>

              {enableFreeDelivery && (
                <div style={{ maxWidth: "280px", marginTop: "12px" }}>
                  <label style={{ fontSize: "12.5px", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>
                    Minimum Cart Subtotal for Free Delivery
                  </label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <span style={{ position: "absolute", left: "14px", color: "#64748B", fontWeight: 700, fontSize: "15px" }}>₹</span>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={freeDeliveryMinOrder}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setFreeDeliveryMinOrder(isNaN(val) ? 0 : val);
                      }}
                      style={{
                        width: "100%",
                        padding: "10px 14px 10px 32px",
                        borderRadius: "9px",
                        border: "1.5px solid #CBD5E1",
                        fontSize: "15px",
                        fontWeight: 700,
                        color: "#0F172A",
                        backgroundColor: "#FFFFFF",
                        outline: "none",
                        fontFamily: "inherit",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "#EA580C")}
                      onBlur={(e) => (e.target.style.borderColor = "#CBD5E1")}
                    />
                  </div>
                </div>
              )}
            </div>

            

            {/* Bottom Actions */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
              <button
                type="button"
                onClick={() => router.push("/seller/delivery")}
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1.5px solid #CBD5E1",
                  borderRadius: "9px",
                  padding: "11px 22px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#475569",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                style={{
                  backgroundColor: "#EA580C",
                  backgroundImage: "linear-gradient(135deg, #FF5500 0%, #EA580C 100%)",
                  border: "none",
                  borderRadius: "9px",
                  padding: "11px 28px",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#FFFFFF",
                  cursor: isSaving ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 8px rgba(234, 88, 12, 0.3)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  opacity: isSaving ? 0.7 : 1,
                  transition: "all 0.18s ease",
                }}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Saving Settings...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} strokeWidth={2.5} />
                    <span>Save Delivery Settings</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Toast Notification */}
          {toastMessage && (
            <div
              style={{
                position: "fixed",
                bottom: "32px",
                right: "32px",
                backgroundColor: "#0F172A",
                color: "#FFFFFF",
                padding: "12px 20px",
                borderRadius: "10px",
                fontSize: "13.5px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "10px",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.18)",
                zIndex: 9999,
              }}
            >
              <CheckCircle2 size={18} color="#10B981" />
              <span>{toastMessage}</span>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
