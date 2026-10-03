"use client";

import { useSession } from "next-auth/react";
import { performLogout } from "@/lib/logout";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { ShoppingCart, LogOut, LogIn, Menu, X, MapPin } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import PopupBannerDisplay from "@/components/PopupBannerDisplay";
import { useLocation } from "@/components/location-provider";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/explore-desktop/footer";

export function UserHeader() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const router = useRouter();
    const { cartItems } = useCart();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { defaultAddress, isLoading: isLocationLoading, openLocationModal } = useLocation();
    const [isClient, setIsClient] = useState(false);
    const hasPromptedRef = useRef(false);

    // Hydration Fix
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Auto-prompt location modal if no default location is selected (for regular customer or guest)
    useEffect(() => {
        const isNonCustomer = Boolean(session?.user?.role && session.user.role !== "USER");
        if (!isLocationLoading && !defaultAddress && !isNonCustomer && !hasPromptedRef.current) {
            hasPromptedRef.current = true;
            openLocationModal();
        }
    }, [isLocationLoading, defaultAddress, session, openLocationModal]);

    // Total items tally across quantities
    const totalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    const navLinks = [
        { href: "/dashboard/user", label: "Home", exact: true },
        { href: "/dashboard/user/food", label: "Order Food" },
        { href: "/dashboard/user/rooms", label: "Book a Room" },
        { href: "/dashboard/user/orders", label: "My Orders" },
        { href: "/dashboard/user/bookings", label: "My Bookings" },
        { href: "/dashboard/user/profile", label: "My Profile" },
        { href: "/dashboard/user/support", label: "Support" },
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
            gap: "18px",
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
                        <div
                            onClick={openLocationModal}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                backgroundColor: defaultAddress ? '#F3F4F6' : '#FEF2F2',
                                border: defaultAddress ? '1px solid #E5E7EB' : '1px solid #FECACA',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                color: defaultAddress ? 'var(--text-main)' : '#DC2626',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                marginTop: '2px',
                                outline: 'none',
                                userSelect: 'none'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = defaultAddress ? '#E5E7EB' : '#FEE2E2'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = defaultAddress ? '#F3F4F6' : '#FEF2F2'}
                            title={defaultAddress ? "Click to change delivery location" : "Click to select delivery location"}
                        >
                            {isLocationLoading ? (
                                <span style={{ color: 'var(--text-muted)' }}>Updating location...</span>
                            ) : defaultAddress ? (
                                <>
                                    <MapPin size={12} color="var(--primary)" />
                                    <span style={{ fontWeight: 'bold' }}>{defaultAddress.locality || defaultAddress.type} ({defaultAddress.pincode})</span>
                                    <span style={{
                                        fontSize: '0.65rem',
                                        backgroundColor: 'var(--primary)',
                                        color: 'white',
                                        padding: '1px 5px',
                                        borderRadius: '4px',
                                        marginLeft: '4px',
                                        fontWeight: 'bold'
                                    }}>Change</span>
                                </>
                            ) : (
                                <span style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <MapPin size={12} color="#DC2626" /> Set Location
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <nav className="desktop-only" style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
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

            <div className="desktop-only" style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <button onClick={() => router.push("/user/cart")} className="btn btn-secondary" style={{ borderRadius: "var(--radius-full)", padding: "8px 16px", display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold", whiteSpace: "nowrap", width: "auto" }}>
                    <ShoppingCart size={18} /> Cart ({totalCount})
                </button>
                {session ? (
                    <button className="btn btn-primary" onClick={() => performLogout({ role: "USER" })} style={{ display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap", width: "auto" }}>
                        <LogOut size={18} /> Sign Out
                    </button>
                ) : (
                    <button className="btn btn-primary" onClick={() => router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`)} style={{ display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap", width: "auto" }}>
                        <LogIn size={18} /> Sign In
                    </button>
                )}
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
                    <button onClick={() => { setIsMenuOpen(false); router.push("/user/cart"); }} className="btn btn-secondary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontWeight: "bold" }}>
                        <ShoppingCart size={18} /> Cart ({totalCount})
                    </button>
                    {session ? (
                        <button className="btn btn-primary" onClick={() => { setIsMenuOpen(false); performLogout({ role: "USER" }); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                            <LogOut size={18} /> Sign Out
                        </button>
                    ) : (
                        <button className="btn btn-primary" onClick={() => { setIsMenuOpen(false); router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                            <LogIn size={18} /> Sign In
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}

export default function UserLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    const isCheckout = pathname === "/dashboard/user/checkout";
    const isUserRole = session?.user?.role === "USER";

    useEffect(() => {
        if (status === "loading") return;
        if (!isCheckout) {
            if (!session) {
                router.push("/user");
            } else if (!isUserRole) {
                // If logged in as another role (SELLER/ADMIN/DELIVERY), redirect them out of user dashboard
                router.push("/user");
            }
        }
    }, [session, status, router, isCheckout, isUserRole]);

    if (status === "loading" || (!session && !isCheckout) || (session && !isUserRole && !isCheckout)) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--background)' }}>
                <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Checking authorization...</span>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "var(--background)" }}>
            <PopupBannerDisplay />
            {isCheckout ? <Navbar /> : <UserHeader />}
            <main style={{ flex: 1, padding: "var(--spacing-8) var(--spacing-6)", maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
                {children}
            </main>
            <Footer />
        </div>
    );
}
