"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { ShoppingCart, LogIn, Menu, X, ArrowRight } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import PopupBannerDisplay from "@/components/PopupBannerDisplay";

function ExploreHeader() {
    const pathname = usePathname();
    const router = useRouter();
    const { cartItems } = useCart();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Total items tally across quantities
    const totalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    const navLinks = [
        { href: "/", label: "Home", exact: true },
        { href: "/explore/food", label: "Order Food" },
        { href: "/explore/rooms", label: "Book a Room" },
    ];

    const isActive = (href: string, exact?: boolean) => {
        return exact ? pathname === href : pathname.includes(href.split('/').pop() || '');
    };

    return (
        <header style={{
            minHeight: "72px",
            backgroundColor: "var(--surface)",
            borderBottom: "1px solid var(--surface-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "15px var(--spacing-6)",
            position: "sticky",
            top: 0,
            zIndex: 10,
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-8)" }}>
                <Link href="/" style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--primary)" }}>
                    Cloud Kitchen
                </Link>

                <nav className="desktop-only" style={{ gap: "var(--spacing-6)", alignItems: "center" }}>
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            style={{
                                color: isActive(link.href, link.exact) ? "var(--primary)" : "var(--text-main)",
                                fontWeight: isActive(link.href, link.exact) ? "600" : "normal"
                            }}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="desktop-only" style={{ alignItems: "center", gap: "10px" }}>
                <Link href="/user" className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap", width: "auto" }}>
                    <LogIn size={18} /> Sign In
                </Link>
            </div>

            <button className="mobile-only" onClick={() => setIsMenuOpen(true)} style={{ color: "var(--text-main)", background: 'none', border: 'none', cursor: 'pointer' }}>
                <Menu size={28} />
            </button>

            {/* Backdrop */}
            <div
                className={`mobile-only mobile-nav-menu-backdrop ${isMenuOpen ? 'open' : ''}`}
                onClick={() => setIsMenuOpen(false)}
            />

            {/* Sidebar Details */}
            <div className={`mobile-only mobile-nav-menu ${isMenuOpen ? 'open' : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <span style={{ fontSize: "1.25rem", fontWeight: "bold", color: "var(--primary)" }}>Menu</span>
                    <button onClick={() => setIsMenuOpen(false)} style={{ color: "var(--text-main)", background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setIsMenuOpen(false)}
                            style={{
                                color: isActive(link.href, link.exact) ? "var(--primary)" : "var(--text-main)",
                                fontWeight: isActive(link.href, link.exact) ? "600" : "500",
                                backgroundColor: isActive(link.href, link.exact) ? "#FFF0F0" : "transparent"
                            }}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "auto", paddingTop: "20px", borderTop: "1px solid var(--surface-border)" }}>
                    <Link href="/user" className="btn btn-primary" onClick={() => setIsMenuOpen(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                        <LogIn size={18} /> Sign In
                    </Link>
                </div>
            </div>
        </header>
    );
}

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "var(--background)" }}>
            <PopupBannerDisplay />
            <ExploreHeader />
            <main style={{ flex: 1, padding: "var(--spacing-8) var(--spacing-6)", maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
                {children}
            </main>
        </div>
    );
}
