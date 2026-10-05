"use client";

import { useSession } from "next-auth/react";
import { performLogout } from "@/lib/logout";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useRoomModule } from "@/context/RoomModuleContext";

export default function SuperadminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const toggleSidebar = () => setIsCollapsed(prev => !prev);
    const { isRoomEnabled, setRoomEnabled, isLoading: isToggleLoading } = useRoomModule();

    useEffect(() => {
        if (status === "loading") return;

        if (!session || session.user.role !== "SUPERADMIN") {
            router.push("/admin");
            return;
        }
    }, [session, status, router]);

    if (status === "loading" || !session || session.user.role !== "SUPERADMIN") {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#F0F2F5', fontFamily: 'var(--font-sans, sans-serif)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid var(--coral, #F16F68)", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
                    <span style={{ fontSize: "1rem", color: "#64748b", fontWeight: "500" }}>Loading Superadmin Panel...</span>
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

    return (
        <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--background)" }}>
            {/* Sidebar */}
            <aside style={{ 
                width: isCollapsed ? "0px" : "260px", 
                overflow: "hidden",
                transition: "width 0.2s ease-in-out, border-right 0.2s ease-in-out",
                backgroundColor: "var(--surface)", 
                borderRight: isCollapsed ? "none" : "1px solid var(--border)", 
                display: "flex", 
                flexDirection: "column" 
            }}>
                <div style={{ padding: "var(--spacing-6)", borderBottom: "1px solid var(--border)" }}>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "var(--primary)" }}>Cloud Kitchen</h2>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Superadmin</span>
                </div>

                <nav style={{ flex: 1, padding: "var(--spacing-4)", display: "flex", flexDirection: "column", gap: "var(--spacing-2)" }}>
                    <Link href="/dashboard/superadmin"
                        style={{
                            padding: "var(--spacing-2) var(--spacing-3)",
                            borderRadius: "var(--radius-md)",
                            backgroundColor: pathname === "/dashboard/superadmin" ? "var(--primary)" : "transparent",
                            color: pathname === "/dashboard/superadmin" ? "var(--text-inverse)" : "var(--text-main)",
                            fontWeight: pathname === "/dashboard/superadmin" ? "500" : "normal"
                        }}>
                        Overview
                    </Link>
                    <Link href="/dashboard/superadmin/admins"
                        style={{
                            padding: "var(--spacing-2) var(--spacing-3)",
                            borderRadius: "var(--radius-md)",
                            backgroundColor: pathname.includes("/admins") ? "var(--primary)" : "transparent",
                            color: pathname.includes("/admins") ? "var(--text-inverse)" : "var(--text-main)",
                            fontWeight: pathname.includes("/admins") ? "500" : "normal"
                        }}>
                        Manage Admins
                    </Link>
                    <Link href="/dashboard/superadmin/sellers"
                        style={{
                            padding: "var(--spacing-2) var(--spacing-3)",
                            borderRadius: "var(--radius-md)",
                            backgroundColor: pathname.includes("/sellers") ? "var(--primary)" : "transparent",
                            color: pathname.includes("/sellers") ? "var(--text-inverse)" : "var(--text-main)",
                            fontWeight: pathname.includes("/sellers") ? "500" : "normal"
                        }}>
                        Sellers & Categories
                    </Link>
                    <Link href="/dashboard/superadmin/categories"
                        style={{
                            padding: "var(--spacing-2) var(--spacing-3)",
                            borderRadius: "var(--radius-md)",
                            backgroundColor: pathname.includes("/categories") ? "var(--primary)" : "transparent",
                            color: pathname.includes("/categories") ? "var(--text-inverse)" : "var(--text-main)",
                            fontWeight: pathname.includes("/categories") ? "500" : "normal"
                        }}>
                        Food Categories
                    </Link>
                    <Link href="/dashboard/superadmin/subscriptions"
                        style={{
                            padding: "var(--spacing-2) var(--spacing-3)",
                            borderRadius: "var(--radius-md)",
                            backgroundColor: pathname.includes("/subscriptions") ? "var(--primary)" : "transparent",
                            color: pathname.includes("/subscriptions") ? "var(--text-inverse)" : "var(--text-main)",
                            fontWeight: pathname.includes("/subscriptions") ? "500" : "normal"
                        }}>
                        Manage Subscriptions
                    </Link>
                    <Link href="/dashboard/superadmin/coupons"
                        style={{
                            padding: "var(--spacing-2) var(--spacing-3)",
                            borderRadius: "var(--radius-md)",
                            backgroundColor: pathname.includes("/coupons") ? "var(--primary)" : "transparent",
                            color: pathname.includes("/coupons") ? "var(--text-inverse)" : "var(--text-main)",
                            fontWeight: pathname.includes("/coupons") ? "500" : "normal"
                        }}>
                        Platform Coupons
                    </Link>
                    <Link href="/dashboard/superadmin/banners"
                        style={{
                            padding: "var(--spacing-2) var(--spacing-3)",
                            borderRadius: "var(--radius-md)",
                            backgroundColor: pathname.includes("/banners") ? "var(--primary)" : "transparent",
                            color: pathname.includes("/banners") ? "var(--text-inverse)" : "var(--text-main)",
                            fontWeight: pathname.includes("/banners") ? "500" : "normal"
                        }}>
                        Home Promo Banners
                    </Link>
                    <Link href="/dashboard/superadmin/support"
                        style={{
                            padding: "var(--spacing-2) var(--spacing-3)",
                            borderRadius: "var(--radius-md)",
                            backgroundColor: pathname.includes("/support") ? "var(--primary)" : "transparent",
                            color: pathname.includes("/support") ? "var(--text-inverse)" : "var(--text-main)",
                            fontWeight: pathname.includes("/support") ? "500" : "normal"
                        }}>
                        Support & Tickets
                    </Link>
                    <Link href="/dashboard/superadmin/refunds"
                        style={{
                            padding: "var(--spacing-2) var(--spacing-3)",
                            borderRadius: "var(--radius-md)",
                            backgroundColor: pathname.includes("/refunds") ? "var(--primary)" : "transparent",
                            color: pathname.includes("/refunds") ? "var(--text-inverse)" : "var(--text-main)",
                            fontWeight: pathname.includes("/refunds") ? "500" : "normal"
                        }}>
                        Manage Refunds
                    </Link>
                    <Link href="/dashboard/superadmin/settings"
                        style={{
                            padding: "var(--spacing-2) var(--spacing-3)",
                            borderRadius: "var(--radius-md)",
                            backgroundColor: pathname.includes("/settings") ? "var(--primary)" : "transparent",
                            color: pathname.includes("/settings") ? "var(--text-inverse)" : "var(--text-main)",
                            fontWeight: pathname.includes("/settings") ? "500" : "normal"
                        }}>
                        System Settings &amp; Modules
                    </Link>
                </nav>

                <div style={{ padding: "var(--spacing-4)", borderTop: "1px solid var(--border)" }}>
                    <button onClick={() => performLogout({ role: "SUPERADMIN" })} className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
                <header style={{ height: "64px", backgroundColor: "var(--surface)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", padding: "0 var(--spacing-6)", gap: "16px" }}>
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
                            color: "var(--text-main)",
                            backgroundColor: "rgba(0,0,0,0.05)",
                            transition: "background-color 0.2s"
                        }}
                        title="Toggle Sidebar"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </button>
                    <h1 style={{ fontSize: "1.125rem", fontWeight: "600", margin: 0 }}>System Control Panel</h1>

                    {/* Room Module Global Toggle Switch in Header */}
                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            backgroundColor: isRoomEnabled ? "#F0FDF4" : "#F8FAFC",
                            border: `1.5px solid ${isRoomEnabled ? "#86EFAC" : "#E2E8F0"}`,
                            padding: "5px 12px",
                            borderRadius: "9999px",
                            transition: "all 0.2s ease",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontSize: "0.82rem", fontWeight: "700", color: isRoomEnabled ? "#15803D" : "#475569" }}>
                                    Room Module:
                                </span>
                                <span style={{
                                    fontSize: "0.68rem",
                                    fontWeight: "800",
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    backgroundColor: isRoomEnabled ? "#DCFCE7" : "#E2E8F0",
                                    color: isRoomEnabled ? "#166534" : "#64748B",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px"
                                }}>
                                    {isRoomEnabled ? "Active" : "Disabled (Next Version)"}
                                </span>
                            </div>

                            <button
                                type="button"
                                disabled={isToggleLoading}
                                onClick={() => setRoomEnabled(!isRoomEnabled)}
                                style={{
                                    width: "42px",
                                    height: "22px",
                                    borderRadius: "11px",
                                    backgroundColor: isRoomEnabled ? "#16A34A" : "#CBD5E1",
                                    border: "none",
                                    cursor: isToggleLoading ? "wait" : "pointer",
                                    position: "relative",
                                    transition: "background-color 0.2s ease",
                                    padding: 0,
                                    outline: "none"
                                }}
                                title={`Click to ${isRoomEnabled ? "disable" : "enable"} Room Module globally`}
                            >
                                <div style={{
                                    width: "16px",
                                    height: "16px",
                                    borderRadius: "50%",
                                    backgroundColor: "#FFFFFF",
                                    position: "absolute",
                                    top: "3px",
                                    left: isRoomEnabled ? "23px" : "3px",
                                    transition: "left 0.2s ease",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                                }} />
                            </button>
                        </div>
                    </div>
                </header>
                <div style={{ padding: "var(--spacing-6)", flex: 1, overflowY: "auto" }}>
                    {children}
                </div>
            </main>
        </div>
    );
}
