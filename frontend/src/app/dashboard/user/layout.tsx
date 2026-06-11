"use client";
import { fetchApi } from "@/lib/fetch-api";


import { signOut } from "next-auth/react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { ShoppingCart, LogOut, Menu, X, MapPin } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import PopupBannerDisplay from "@/components/PopupBannerDisplay";
import { LocationProvider, useLocation } from "@/components/location-provider";

export function UserHeader() {
    const pathname = usePathname();
    const router = useRouter();
    const { cartItems } = useCart();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { defaultAddress, isLoading: isLocationLoading } = useLocation();
    const [isClient, setIsClient] = useState(false);

    // Hydration Fix
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Total items tally across quantities
    const totalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    const navLinks = [
        { href: "/dashboard/user", label: "Home", exact: true },
        { href: "/dashboard/user/food", label: "Order Food" },
        { href: "/dashboard/user/rooms", label: "Book a Room" },
        { href: "/dashboard/user/orders", label: "My Orders" },
        { href: "/dashboard/user/bookings", label: "My Bookings" },
        { href: "/dashboard/user/profile", label: "My Profile" },
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
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px" }}>
                    <Link href="/dashboard/user" style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--primary)", lineHeight: 1 }}>
                        Cloud Kitchen
                    </Link>

                    {isClient && (
                        <Link
                            href="/dashboard/user/profile"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '2px 8px',
                                backgroundColor: '#F3F4F6',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                color: 'var(--text-main)',
                                textDecoration: 'none',
                                transition: 'background-color 0.2s',
                                marginTop: '2px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E5E7EB'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                        >
                            {isLocationLoading ? (
                                <span style={{ color: 'var(--text-muted)' }}>Updating location...</span>
                            ) : defaultAddress ? (
                                <>
                                    <span style={{ fontWeight: 'bold' }}>{defaultAddress.type}</span>
                                    <span style={{ color: 'var(--text-muted)' }}>{defaultAddress.pincode}</span>
                                </>
                            ) : (
                                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    <MapPin size={10} /> Set Location
                                </span>
                            )}
                        </Link>
                    )}
                </div>

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
                <button onClick={() => router.push("/dashboard/user/checkout")} className="btn btn-secondary" style={{ borderRadius: "var(--radius-full)", padding: "8px 16px", display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold", whiteSpace: "nowrap", width: "auto" }}>
                    <ShoppingCart size={18} /> Cart ({totalCount})
                </button>
                <button className="btn btn-primary" onClick={() => signOut({ callbackUrl: '/' })} style={{ display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap", width: "auto" }}>
                    <LogOut size={18} /> Sign Out
                </button>
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
                    <button onClick={() => { setIsMenuOpen(false); router.push("/dashboard/user/checkout"); }} className="btn btn-secondary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontWeight: "bold" }}>
                        <ShoppingCart size={18} /> Cart ({totalCount})
                    </button>
                    <button className="btn btn-primary" onClick={() => signOut({ callbackUrl: '/' })} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                        <LogOut size={18} /> Sign Out
                    </button>
                </div>
            </div>
        </header>
    );
}

export default function UserLayout({ children }: { children: React.ReactNode }) {
    return (
        <LocationProvider>
            <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "var(--background)" }}>
                <PopupBannerDisplay />
                <UserHeader />
                <main style={{ flex: 1, padding: "var(--spacing-8) var(--spacing-6)", maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
                    {children}
                </main>
            </div>
        </LocationProvider>
    );
}
