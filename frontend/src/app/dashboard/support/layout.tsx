"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, MessageSquare, RefreshCw, LogOut, LifeBuoy } from "lucide-react";
import { useEffect, useState } from "react";

export default function SupportLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const toggleSidebar = () => setIsCollapsed(prev => !prev);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.replace("/auth/login/admin");
        } else if (status === "authenticated" && session?.user?.role !== "SUPPORT" && session?.user?.role !== "SUPERADMIN") {
            router.replace("/explore-desktop");
        }
    }, [status, session, router]);

    if (status === "loading" || !session || (session.user.role !== "SUPPORT" && session.user.role !== "SUPERADMIN")) {
        return (
            <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc", fontFamily: "var(--font-sans)" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid #10b981", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
                    <span style={{ fontSize: "1rem", color: "#64748b", fontWeight: "500" }}>Loading Support Portal...</span>
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

    const navLinks = [
        { href: "/dashboard/support", label: "Overview", icon: <LayoutDashboard size={20} /> },
        { href: "/dashboard/support/tickets", label: "Support & Tickets", icon: <MessageSquare size={20} /> },
        { href: "/dashboard/support/refunds", label: "Manage Refunds", icon: <RefreshCw size={20} /> },
    ];

    return (
        <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "var(--font-sans)" }}>
                        {/* Sidebar */}
            <aside style={{
                width: isCollapsed ? "0px" : "280px",
                overflow: "hidden",
                transition: "width 0.2s ease-in-out",
                backgroundColor: "#1e293b",
                color: "#f8fafc",
                display: "flex",
                flexDirection: "column",
                boxShadow: isCollapsed ? "none" : "2px 0 10px rgba(0,0,0,0.05)"
            }}>
                <div style={{
                    padding: "1.5rem 1.5rem",
                    borderBottom: "1px solid #334155",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px"
                }}>
                    <div style={{
                        backgroundColor: "#10b981",
                        color: "white",
                        width: "40px",
                        height: "40px",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 4px 6px -1px rgba(16, 185, 129, 0.2)"
                    }}>
                        <LifeBuoy size={24} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#fff", lineHeight: 1.2 }}>Customer Care</h2>
                        <span style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px" }}>Support Portal</span>
                    </div>
                </div>

                <nav style={{ flex: 1, padding: "1.5rem 1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.75rem",
                                    padding: "0.75rem 1rem",
                                    borderRadius: "var(--radius-md)",
                                    color: isActive ? "#fff" : "#94a3b8",
                                    backgroundColor: isActive ? "#334155" : "transparent",
                                    fontWeight: isActive ? "600" : "500",
                                    transition: "all 0.2s ease"
                                }}
                            >
                                {link.icon}
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>

                <div style={{ padding: "1.5rem 1rem", borderTop: "1px solid #334155" }}>
                    <button
                        onClick={() => signOut({ callbackUrl: window.location.origin + "/admin" })}
                        style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.5rem",
                            padding: "0.75rem 1rem",
                            backgroundColor: "transparent",
                            color: "#ef4444",
                            border: "1px solid #ef4444",
                            borderRadius: "var(--radius-md)",
                            fontWeight: "600",
                            cursor: "pointer",
                            transition: "all 0.2s ease"
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = "#ef4444";
                            e.currentTarget.style.color = "white";
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.color = "#ef4444";
                        }}
                    >
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </div>
            </aside>

                        {/* Main Content Area */}
            <main style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
                <header style={{
                    height: "70px",
                    backgroundColor: "white",
                    borderBottom: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    padding: "0 2rem",
                    gap: "16px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                    zIndex: 10
                }}>
                    <button 
                        onClick={toggleSidebar}
                        style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "6px",
                            backgroundColor: "rgba(0,0,0,0.05)"
                        }}
                        title="Toggle Sidebar"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </button>
                    <h1 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#0f172a" }}>
                        {pathname === "/dashboard/support" ? "Support Overview" : pathname.includes("/tickets") ? "Tickets workspace" : "Refunds Console"}
                    </h1>
                </header>
                <div style={{ padding: "2rem", flex: 1, overflowY: "auto" }}>
                    <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
