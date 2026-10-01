"use client";

import { useSession } from "next-auth/react";
import { performLogout } from "@/lib/logout";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Clapperboard, LogOut, Sparkles, LayoutDashboard, Instagram } from "lucide-react";
import { useEffect, useState } from "react";

export default function ReelManagerLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || (session?.user?.role !== "REEL_MANAGER" && session?.user?.role !== "SUPERADMIN")) {
      router.replace("/admin");
    }
  }, [status, session, router]);

  if (status === "loading" || !session || (session.user.role !== "REEL_MANAGER" && session.user.role !== "SUPERADMIN")) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", backgroundColor: "#0f172a", fontFamily: "var(--font-sans)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "50%", border: "3px solid #e1306c", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
          <span style={{ fontSize: "1rem", color: "#94a3b8", fontWeight: "500" }}>Loading Reel Management Portal...</span>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const handleLogout = () => {
    performLogout({ role: "ADMIN" });
  };

  const isSuperadmin = session.user.role === "SUPERADMIN";

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#0b0f19", color: "#f8fafc", fontFamily: "var(--font-sans)" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: isCollapsed ? "0px" : "280px",
          overflow: "hidden",
          transition: "width 0.2s ease-in-out",
          backgroundColor: "#111827",
          borderRight: "1px solid #1f2937",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: "1.5rem 1.5rem",
            borderBottom: "1px solid #1f2937",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)",
              color: "white",
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(225, 48, 108, 0.35)",
            }}
          >
            <Instagram size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#fff", lineHeight: 1.2, margin: 0 }}>
              Neo Cloud Bites
            </h2>
            <span
              style={{
                fontSize: "0.75rem",
                background: "linear-gradient(90deg, #fd1d1d, #fcb045)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Reels &amp; Stories Hub
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "1.5rem 1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Link
            href="/dashboard/reel-manager"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.85rem 1rem",
              borderRadius: "10px",
              color: pathname === "/dashboard/reel-manager" ? "#fff" : "#9ca3af",
              backgroundColor: pathname === "/dashboard/reel-manager" ? "rgba(225, 48, 108, 0.15)" : "transparent",
              border: pathname === "/dashboard/reel-manager" ? "1px solid rgba(225, 48, 108, 0.35)" : "1px solid transparent",
              fontWeight: pathname === "/dashboard/reel-manager" ? "600" : "500",
              textDecoration: "none",
              transition: "all 0.2s ease",
            }}
          >
            <Clapperboard size={20} color={pathname === "/dashboard/reel-manager" ? "#e1306c" : "#9ca3af"} />
            <span>Explore Reels Curation</span>
          </Link>

          {isSuperadmin && (
            <Link
              href="/dashboard/superadmin"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.85rem 1rem",
                borderRadius: "10px",
                color: "#9ca3af",
                textDecoration: "none",
                transition: "all 0.2s ease",
              }}
            >
              <LayoutDashboard size={20} />
              <span>Back to Superadmin</span>
            </Link>
          )}

          <div
            style={{
              marginTop: "auto",
              padding: "1rem",
              backgroundColor: "#1f2937",
              borderRadius: "12px",
              border: "1px solid #374151",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <Sparkles size={16} color="#fbbf24" />
              <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "#f3f4f6" }}>Collaboration Hub</span>
            </div>
            <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: 0, lineHeight: 1.4 }}>
              Tag <strong style={{ color: "#fff" }}>@neocloudbites</strong> on Instagram to sync kitchen reels automatically into this portal.
            </p>
          </div>
        </nav>

        {/* User Profile & Logout */}
        <div style={{ padding: "1.25rem 1rem", borderTop: "1px solid #1f2937", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ overflow: "hidden" }}>
            <p style={{ fontSize: "0.9rem", fontWeight: "600", color: "#fff", margin: 0, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
              {session.user.name || "Reel Curator"}
            </p>
            <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
              {session.user.role === "SUPERADMIN" ? "Superadmin Access" : "Reel Manager"}
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              background: "none",
              border: "none",
              color: "#ef4444",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Logout"
            aria-label="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, overflowY: "auto", minHeight: "100vh", backgroundColor: "#0b0f19" }}>
        {children}
      </main>
    </div>
  );
}
