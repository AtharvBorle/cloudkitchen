"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Settings, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Mail, 
  Phone, 
  Power
} from "lucide-react";
import { fetchApi } from "@/lib/fetch-api";
import { performLogout } from "@/lib/logout";

interface SystemSettingsMap {
  SUPPORT_EMAIL: string;
  SUPPORT_PHONE: string;
  MAINTENANCE_MODE: string;
  AUTO_ASSIGN_DELIVERY: string;
}

const DEFAULT_SETTINGS: SystemSettingsMap = {
  SUPPORT_EMAIL: "support@neocloudkitchen.com",
  SUPPORT_PHONE: "+91 98765 43210",
  MAINTENANCE_MODE: "false",
  AUTO_ASSIGN_DELIVERY: "true"
};

export default function SuperadminSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [settings, setSettings] = useState<SystemSettingsMap>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetchApi("/api/superadmin/settings");
      if (res.ok) {
        const json = await res.json();
        const data = json.data !== undefined ? json.data : json;
        if (data?.settingsMap) {
          setSettings((prev) => ({
            ...prev,
            SUPPORT_EMAIL: data.settingsMap.SUPPORT_EMAIL || prev.SUPPORT_EMAIL,
            SUPPORT_PHONE: data.settingsMap.SUPPORT_PHONE || prev.SUPPORT_PHONE,
            MAINTENANCE_MODE: data.settingsMap.MAINTENANCE_MODE || prev.MAINTENANCE_MODE,
            AUTO_ASSIGN_DELIVERY: data.settingsMap.AUTO_ASSIGN_DELIVERY || prev.AUTO_ASSIGN_DELIVERY,
          }));
        } else if (Array.isArray(data)) {
          const map: Record<string, string> = {};
          data.forEach((s: any) => {
            if (s.key) map[s.key] = s.value;
          });
          setSettings((prev) => ({
            ...prev,
            SUPPORT_EMAIL: map.SUPPORT_EMAIL || prev.SUPPORT_EMAIL,
            SUPPORT_PHONE: map.SUPPORT_PHONE || prev.SUPPORT_PHONE,
            MAINTENANCE_MODE: map.MAINTENANCE_MODE || prev.MAINTENANCE_MODE,
            AUTO_ASSIGN_DELIVERY: map.AUTO_ASSIGN_DELIVERY || prev.AUTO_ASSIGN_DELIVERY,
          }));
        }
      }
    } catch (err) {
      console.error("Failed to load system settings:", err);
      showToast("Could not load latest system settings. Using defaults.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || (session?.user as any)?.role !== "SUPERADMIN") {
      router.push("/dashboard/admin");
      return;
    }
    fetchSettings();
  }, [status, session, router]);

  const handleChange = (key: keyof SystemSettingsMap, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetchApi("/api/superadmin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });

      if (res.ok) {
        showToast("System configuration updated successfully!", "success");
      } else {
        const json = await res.json();
        throw new Error(json.error || "Failed to update system settings.");
      }
    } catch (err: any) {
      console.error("Save settings error:", err);
      showToast(err.message || "Failed to save settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading || status === "loading") {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-sans)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-muted)" }}>
          <RefreshCw className="animate-spin" size={24} />
          <span>Loading System Settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F0F2F5", padding: "40px", fontFamily: "var(--font-sans)" }}>
      
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            zIndex: 99999,
            backgroundColor: toast.type === "success" ? "#10B981" : "#EF4444",
            color: "#FFFFFF",
            padding: "12px 20px",
            borderRadius: "10px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontWeight: "600",
            fontSize: "0.9rem",
          }}
        >
          {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", flexWrap: "wrap", gap: "15px" }}>
        <div>
          <h1 style={{ fontSize: "2.25rem", fontWeight: "800", color: "#0F172A", margin: 0, letterSpacing: "-0.5px" }}>
            System Settings
          </h1>
          <p style={{ color: "#64748B", margin: "4px 0 0 0", fontSize: "0.95rem" }}>
            Configure platform support contact information and global system controls.
          </p>
        </div>

        <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
          <button
            type="button"
            onClick={fetchSettings}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              borderRadius: "10px",
              border: "1px solid #CBD5E1",
              backgroundColor: "#FFFFFF",
              color: "#334155",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => performLogout({ role: "SUPERADMIN" })}
            style={{
              background: "none",
              border: "1px solid #CBD5E1",
              borderRadius: "10px",
              backgroundColor: "#FFFFFF",
              fontWeight: "700",
              color: "#EF4444",
              padding: "10px 18px",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #E2E8F0", marginBottom: "30px", overflowX: "auto", gap: "5px" }}>
        <Link
          href="/dashboard/superadmin"
          style={{ padding: "10px 20px", color: "var(--text-muted)", fontWeight: "bold", textDecoration: "none", whiteSpace: "nowrap" }}
        >
          Dashboard Overview
        </Link>
        <Link
          href="/dashboard/superadmin/admins"
          style={{ padding: "10px 20px", color: "var(--text-muted)", fontWeight: "bold", textDecoration: "none", whiteSpace: "nowrap" }}
        >
          Manage Admins
        </Link>
        <Link
          href="/dashboard/superadmin/sellers"
          style={{ padding: "10px 20px", color: "var(--text-muted)", fontWeight: "bold", textDecoration: "none", whiteSpace: "nowrap" }}
        >
          Manage Sellers
        </Link>
        <div
          style={{ padding: "10px 20px", borderBottom: "2px solid var(--coral, #EA580C)", color: "var(--coral, #EA580C)", fontWeight: "bold", cursor: "pointer", whiteSpace: "nowrap" }}
        >
          System Settings
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: "24px", marginBottom: "30px" }}>
          
          {/* Card 1: Support Contact Details */}
          <div style={{ backgroundColor: "#FFFFFF", padding: "26px", borderRadius: "16px", boxShadow: "0 4px 15px rgba(0,0,0,0.04)", border: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#FAF5FF", color: "#9333EA", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Mail size={20} />
              </div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#0F172A", margin: 0 }}>
                Support & Contact
              </h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>
                  Customer Support Email
                </label>
                <input
                  type="email"
                  value={settings.SUPPORT_EMAIL}
                  onChange={(e) => handleChange("SUPPORT_EMAIL", e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #CBD5E1" }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>
                  Customer Support Helpline
                </label>
                <input
                  type="text"
                  value={settings.SUPPORT_PHONE}
                  onChange={(e) => handleChange("SUPPORT_PHONE", e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #CBD5E1" }}
                  required
                />
              </div>
            </div>
          </div>

          {/* Card 2: Platform Controls & Maintenance */}
          <div style={{ backgroundColor: "#FFFFFF", padding: "26px", borderRadius: "16px", boxShadow: "0 4px 15px rgba(0,0,0,0.04)", border: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#FFF7ED", color: "#EA580C", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Power size={20} />
              </div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#0F172A", margin: 0 }}>
                System Controls
              </h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>
                  Maintenance Mode
                </label>
                <select
                  value={settings.MAINTENANCE_MODE}
                  onChange={(e) => handleChange("MAINTENANCE_MODE", e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #CBD5E1", backgroundColor: "#FFFFFF" }}
                >
                  <option value="false">Operational (Normal Live Service)</option>
                  <option value="true">Maintenance Mode (Platform Paused)</option>
                </select>
                <p style={{ fontSize: "0.75rem", color: "#64748B", margin: "4px 0 0 0" }}>
                  When enabled, non-admin visitors will see a maintenance notice.
                </p>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>
                  Automatic Delivery Rider Dispatch
                </label>
                <select
                  value={settings.AUTO_ASSIGN_DELIVERY}
                  onChange={(e) => handleChange("AUTO_ASSIGN_DELIVERY", e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #CBD5E1", backgroundColor: "#FFFFFF" }}
                >
                  <option value="true">Enabled (Auto-assign available nearby riders)</option>
                  <option value="false">Manual (Admin or Kitchen assigns riders)</option>
                </select>
              </div>
            </div>
          </div>

        </div>

        {/* Save Bar */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", backgroundColor: "#FFFFFF", padding: "18px 24px", borderRadius: "14px", border: "1px solid #E2E8F0", boxShadow: "0 4px 15px rgba(0,0,0,0.04)" }}>
          <button
            type="button"
            onClick={fetchSettings}
            disabled={saving}
            style={{
              padding: "12px 24px",
              borderRadius: "10px",
              border: "1px solid #CBD5E1",
              backgroundColor: "#FFFFFF",
              color: "#475569",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Reset
          </button>

          <button
            type="submit"
            disabled={saving}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 28px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: "#EA580C",
              color: "#FFFFFF",
              fontWeight: "700",
              fontSize: "0.95rem",
              cursor: saving ? "not-allowed" : "pointer",
              boxShadow: "0 4px 12px rgba(234, 88, 12, 0.3)",
              opacity: saving ? 0.7 : 1,
            }}
          >
            <Save size={18} />
            <span>{saving ? "Saving Changes..." : "Save System Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
