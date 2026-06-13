"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SuperadminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--background)" }}>
            {/* Sidebar */}
            <aside style={{ width: "260px", backgroundColor: "var(--surface)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
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
                </nav>

                <div style={{ padding: "var(--spacing-4)", borderTop: "1px solid var(--border)" }}>
                    <button onClick={() => signOut({ callbackUrl: "/admin" })} className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <header style={{ height: "64px", backgroundColor: "var(--surface)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", padding: "0 var(--spacing-6)" }}>
                    <h1 style={{ fontSize: "1.125rem", fontWeight: "600" }}>System Control Panel</h1>
                </header>
                <div style={{ padding: "var(--spacing-6)", flex: 1, overflowY: "auto" }}>
                    {children}
                </div>
            </main>
        </div>
    );
}
