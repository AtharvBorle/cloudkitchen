"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Image as ImageIcon, LogOut, ShieldCheck, Tag } from "lucide-react";
import { useEffect } from "react";

export default function adminLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (status === "loading") return;
        if (!session || (session.user.role !== "ADMIN" && session.user.role !== "AGENT")) {
            router.replace("/admin");
        }
    }, [session, status, router]);

    if (status === "loading" || !session || (session.user.role !== "ADMIN" && session.user.role !== "AGENT")) {
        return (
            <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc", fontFamily: "var(--font-sans)" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid var(--primary)", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
                    <span style={{ fontSize: "1rem", color: "#64748b", fontWeight: "500" }}>Loading Operations Portal...</span>
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
        { href: "/dashboard/admin", label: "Overview", icon: <LayoutDashboard size={20} /> },
        { href: "/dashboard/admin/registrations", label: "Seller Approvals", icon: <Users size={20} /> },
        { href: "/dashboard/admin/banners", label: "Popup Banners", icon: <ImageIcon size={20} /> },
        { href: "/dashboard/admin/coupons", label: "Offers & Coupons", icon: <Tag size={20} /> },
    ];

    return (
        <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
            {/* Sidebar */}
            <aside style={{
                width: "280px",
                backgroundColor: "var(--surface)",
                borderRight: "1px solid var(--surface-border)",
                display: "flex",
                flexDirection: "column",
                boxShadow: "2px 0 10px rgba(0,0,0,0.02)"
            }}>
                <div style={{
                    padding: "1.5rem 1.5rem",
                    borderBottom: "1px solid var(--surface-border)",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px"
                }}>
                    <div style={{
                        backgroundColor: "var(--primary)",
                        color: "white",
                        width: "40px",
                        height: "40px",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "var(--shadow-btn)"
                    }}>
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--text-main)", lineHeight: 1.2 }}>Operations</h2>
                        <span style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px" }}>admin Portal</span>
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
                                    color: isActive ? "var(--primary)" : "var(--text-main)",
                                    backgroundColor: isActive ? "#fff5f5" : "transparent",
                                    fontWeight: isActive ? "600" : "500",
                                    transition: "all var(--transition-fast)",
                                    border: isActive ? "1px solid #ffebeb" : "1px solid transparent"
                                }}
                            >
                                {link.icon}
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>

                <div style={{ padding: "1.5rem 1rem", borderTop: "1px solid var(--surface-border)" }}>
                    <button
                        onClick={() => signOut({ callbackUrl: window.location.origin + "/admin" })}
                        style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.5rem",
                            padding: "0.75rem 1rem",
                            backgroundColor: "white",
                            color: "var(--text-main)",
                            border: "1px solid var(--surface-border)",
                            borderRadius: "var(--radius-md)",
                            fontWeight: "500",
                            cursor: "pointer",
                            transition: "all var(--transition-fast)",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = "#fafafa";
                            e.currentTarget.style.color = "var(--primary)";
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = "white";
                            e.currentTarget.style.color = "var(--text-main)";
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
                    borderBottom: "1px solid var(--surface-border)",
                    display: "flex",
                    alignItems: "center",
                    padding: "0 2rem",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.01)",
                    zIndex: 10
                }}>
                    <h1 style={{ fontSize: "1.25rem", fontWeight: "600", color: "var(--text-main)" }}>Overview</h1>
                </header>
                <div style={{ padding: "2rem", flex: 1, overflowY: "auto" }}>
                    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
