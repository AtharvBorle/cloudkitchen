"use client";
import { fetchApi } from "@/lib/fetch-api";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Bike, ClipboardList, User, Menu, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Close mobile drawer on route change
    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (status === "loading") return;
        if (!session || session.user.role !== "DELIVERY") {
            router.push("/delivery");
        }
    }, [session, status, router]);

    if (status === "loading" || !session || session.user.role !== "DELIVERY") {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#F7FAFC' }}>
                <span style={{ fontSize: '1.2rem', color: '#4A5568' }}>Checking authorization...</span>
            </div>
        );
    }

    const toggleSidebar = () => {
        if (isMobile) {
            setIsMobileOpen((prev) => !prev);
        } else {
            setIsDesktopCollapsed((prev) => !prev);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#F7FAFC', position: 'relative' }}>
            {/* Mobile Backdrop Overlay */}
            {isMobile && isMobileOpen && (
                <div
                    onClick={() => setIsMobileOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 90,
                        backdropFilter: 'blur(2px)',
                        transition: 'opacity 0.2s ease',
                    }}
                    aria-label="Close sidebar backdrop"
                />
            )}

            {/* Sidebar */}
            <aside
                style={{
                    position: isMobile ? 'fixed' : 'relative',
                    top: 0,
                    left: 0,
                    height: '100vh',
                    zIndex: isMobile ? 100 : 'auto',
                    width: isMobile ? '280px' : isDesktopCollapsed ? '0px' : '280px',
                    transform: isMobile ? (isMobileOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
                    overflow: 'hidden',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    backgroundColor: '#1A1C23',
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: isMobile && isMobileOpen ? '4px 0 24px rgba(0,0,0,0.3)' : 'none',
                }}
            >
                <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ backgroundColor: '#F16F68', padding: '8px', borderRadius: '8px' }}>
                            <Bike size={24} color="white" />
                        </div>
                        <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Delivery Hub</span>
                    </div>
                    {isMobile && (
                        <button
                            type="button"
                            onClick={() => setIsMobileOpen(false)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#A0AEC0',
                                cursor: 'pointer',
                                padding: '4px',
                            }}
                            aria-label="Close menu"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                <nav style={{ flex: 1, padding: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <Link
                            href="/dashboard/delivery"
                            onClick={() => isMobile && setIsMobileOpen(false)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 15px',
                                borderRadius: '8px',
                                color: 'white',
                                textDecoration: 'none',
                                backgroundColor: pathname === '/dashboard/delivery' ? '#2D3748' : 'transparent',
                                fontWeight: pathname === '/dashboard/delivery' ? '600' : 'normal',
                            }}
                        >
                            <ClipboardList size={20} color={pathname === '/dashboard/delivery' ? '#F16F68' : '#A0AEC0'} /> My Orders
                        </Link>
                        <Link
                            href="/dashboard/delivery/profile"
                            onClick={() => isMobile && setIsMobileOpen(false)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 15px',
                                borderRadius: '8px',
                                color: pathname === '/dashboard/delivery/profile' ? 'white' : '#A0AEC0',
                                textDecoration: 'none',
                                backgroundColor: pathname === '/dashboard/delivery/profile' ? '#2D3748' : 'transparent',
                                fontWeight: pathname === '/dashboard/delivery/profile' ? '600' : 'normal',
                            }}
                        >
                            <User size={20} color={pathname === '/dashboard/delivery/profile' ? '#F16F68' : '#A0AEC0'} /> My Profile
                        </Link>
                    </div>
                </nav>

                <div style={{ padding: '20px', borderTop: '1px solid #2D3748' }}>
                    <button
                        onClick={() => signOut({ callbackUrl: window.location.origin + "/delivery" })}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', width: '100%', borderRadius: '8px', color: '#FC8181', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: '600' }}
                    >
                        <LogOut size={20} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', minWidth: 0 }}>
                <header style={{
                    height: "64px",
                    backgroundColor: "white",
                    borderBottom: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    padding: "0 16px",
                    gap: "14px",
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
                        aria-label="Toggle navigation menu"
                    >
                        <Menu size={20} color="#1A1C23" />
                    </button>
                    <span style={{ fontSize: '1.15rem', fontWeight: 'bold', color: '#1A1C23' }}>Delivery Dashboard</span>
                </header>
                <div style={{ padding: isMobile ? '16px' : '32px', flex: 1, overflowY: 'auto' }}>
                    {children}
                </div>
            </main>
        </div>
    );
}
