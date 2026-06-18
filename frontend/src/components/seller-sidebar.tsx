"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

import { useState, useEffect } from "react";

export default function SellerSidebar({ isMobileOpen, onClose }: { isMobileOpen?: boolean; onClose?: () => void }) {
    const pathname = usePathname();
    const [isMobile, setIsMobile] = useState(false);
    const [statusData, setStatusData] = useState<any>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalCategory, setModalCategory] = useState<"FOOD" | "PROPERTY" | null>(null);
    const [categoryPlans, setCategoryPlans] = useState<any[]>([]);

    useEffect(() => {
        const checkScreen = () => setIsMobile(window.innerWidth <= 768);
        checkScreen();
        window.addEventListener("resize", checkScreen);
        return () => window.removeEventListener("resize", checkScreen);
    }, []);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch("/api/seller/dashboard/status");
                if (res.ok) {
                    const data = await res.json();
                    setStatusData(data.data || data);
                }
            } catch (err) {
                console.error("Failed to fetch dashboard status in sidebar:", err);
            }
        };
        fetchStatus();
    }, []);

    const isFoodActive = statusData ? statusData.isFoodActive : true;
    const isPropertyActive = statusData ? statusData.isPropertyActive : true;

    const handleCategoryClick = async (e: React.MouseEvent, category: "FOOD" | "PROPERTY", isActive: boolean) => {
        if (isActive) {
            if (onClose) onClose();
            return;
        }
        e.preventDefault();
        setModalCategory(category);
        setModalOpen(true);
        setCategoryPlans([]);

        try {
            const res = await fetch(`/api/seller/subscription/plans?category=${category}`);
            if (res.ok) {
                const data = await res.json();
                setCategoryPlans(data.data || data || []);
            }
        } catch (error) {
            console.error("Failed to load category plans:", error);
        }
    };

    const getLinkStyle = (path: string, exact = false) => {
        const isActive = exact ? pathname === path : pathname.startsWith(path);
        if (isActive) {
            return {
                display: 'block',
                padding: '12px 20px',
                borderRadius: '4px',
                marginBottom: '5px',
                backgroundColor: 'var(--coral, #F16F68)',
                color: 'white',
                fontWeight: '500'
            };
        }
        return {
            display: 'block',
            padding: '12px 20px',
            borderRadius: '4px',
            marginBottom: '5px',
            color: '#A0AEC0',
            borderBottom: '1px solid #2D303E'
        };
    };

    const sidebarContent = (
        <>
            <div style={{ padding: '20px', fontSize: '1.25rem', fontWeight: 'bold', borderBottom: '1px solid #2D303E', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Kitchen Dashboard
                {isMobile && <button onClick={onClose} style={{ color: 'white', fontSize: '1.5rem' }}>&times;</button>}
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', padding: '0 10px' }}>
                <Link href="/dashboard/seller" style={getLinkStyle('/dashboard/seller', true)} onClick={onClose}>
                    Overview
                </Link>

                <Link 
                    href="/dashboard/seller/menu" 
                    style={getLinkStyle('/dashboard/seller/menu')} 
                    onClick={(e) => handleCategoryClick(e, "FOOD", isFoodActive)}
                >
                    Manage Menu
                </Link>

                <Link 
                    href="/dashboard/seller/inventory" 
                    style={getLinkStyle('/dashboard/seller/inventory')} 
                    onClick={(e) => handleCategoryClick(e, "FOOD", isFoodActive)}
                >
                    Inventory & Stock
                </Link>

                <Link 
                    href="/dashboard/seller/orders" 
                    style={getLinkStyle('/dashboard/seller/orders')} 
                    onClick={(e) => handleCategoryClick(e, "FOOD", isFoodActive)}
                >
                    Orders
                </Link>

                <Link 
                    href="/dashboard/seller/delivery" 
                    style={getLinkStyle('/dashboard/seller/delivery')} 
                    onClick={(e) => handleCategoryClick(e, "FOOD", isFoodActive)}
                >
                    Delivery Persons
                </Link>

                <Link href="/dashboard/seller/offers" style={getLinkStyle('/dashboard/seller/offers')} onClick={onClose}>
                    Offers & Coupons
                </Link>

                <Link href="/dashboard/seller/reviews" style={getLinkStyle('/dashboard/seller/reviews')} onClick={onClose}>
                    Reviews & Feedback
                </Link>

                <Link 
                    href="/dashboard/seller/rooms" 
                    style={getLinkStyle('/dashboard/seller/rooms')} 
                    onClick={(e) => handleCategoryClick(e, "PROPERTY", isPropertyActive)}
                >
                    Rooms
                </Link>

                <Link href="/dashboard/seller/profile" style={getLinkStyle('/dashboard/seller/profile')} onClick={onClose}>
                    Profile & QR
                </Link>

                <Link href="/dashboard/seller/support" style={getLinkStyle('/dashboard/seller/support')} onClick={onClose}>
                    Support & Tickets
                </Link>

                <button
                    onClick={async (e) => {
                        e.preventDefault();
                        await signOut({ callbackUrl: window.location.origin + "/seller" });
                    }}
                    style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '12px 20px',
                        color: '#A0AEC0',
                        marginTop: '10px',
                        cursor: 'pointer',
                        background: 'none',
                        border: 'none',
                        fontFamily: 'inherit',
                        fontSize: 'inherit'
                    }}
                >
                    Logout
                </button>
            </nav>
        </>
    );

    return (
        <>
            {isMobile ? (
                <div style={{
                    position: 'fixed', top: 0, left: 0, height: '100vh', width: '250px',
                    backgroundColor: '#1A1C23', color: 'white', zIndex: 100,
                    transform: isMobileOpen ? 'translateX(0)' : 'translateX(-100%)',
                    transition: 'transform 0.3s ease-in-out',
                    display: 'flex', flexDirection: 'column',
                    boxShadow: isMobileOpen ? '5px 0 15px rgba(0,0,0,0.5)' : 'none'
                }}>
                    {sidebarContent}
                </div>
            ) : (
                <aside style={{ width: '250px', backgroundColor: '#1A1C23', color: 'white', display: 'flex', flexDirection: 'column', minHeight: '100vh', flexShrink: 0 }}>
                    {sidebarContent}
                </aside>
            )}

            {modalOpen && modalCategory && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100vw",
                    height: "100vh",
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    backdropFilter: "blur(4px)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 99999,
                    color: "#1e293b",
                    padding: "1rem"
                }}>
                    <div style={{
                        backgroundColor: "white",
                        borderRadius: "20px",
                        padding: "2rem",
                        maxWidth: "480px",
                        width: "100%",
                        boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                        textAlign: "center",
                        border: "1px solid #e2e8f0"
                    }}>
                        <div style={{
                            width: "60px",
                            height: "60px",
                            borderRadius: "50%",
                            backgroundColor: "#fee2e2",
                            color: "#ef4444",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.5rem",
                            fontWeight: "bold",
                            margin: "0 auto 1rem"
                        }}>
                            🔒
                        </div>
                        <h3 style={{ fontSize: "1.3rem", fontWeight: "800", marginBottom: "0.5rem" }}>
                            {modalCategory === "FOOD" ? "Activate Food Services" : "Activate Room Bookings"}
                        </h3>
                        <p style={{ color: "#64748b", fontSize: "0.95rem", lineHeight: "1.5", marginBottom: "1.5rem" }}>
                            You currently do not have an active subscription plan for this category. Upgrade now to enable these dashboard features and expand your business!
                        </p>

                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "1.5rem" }}>
                            {categoryPlans.length === 0 ? (
                                <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Loading available plans...</div>
                            ) : (
                                categoryPlans.map(plan => (
                                    <Link
                                        key={plan.id}
                                        href={`/dashboard/seller/payment?planId=${plan.id}&category=${modalCategory}`}
                                        onClick={() => setModalOpen(false)}
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            backgroundColor: "#f8fafc",
                                            padding: "12px 16px",
                                            borderRadius: "12px",
                                            border: "1px solid #e2e8f0",
                                            textDecoration: "none",
                                            color: "inherit",
                                            transition: "all 0.2s"
                                        }}
                                    >
                                        <div style={{ textAlign: "left" }}>
                                            <div style={{ fontWeight: "700", fontSize: "0.95rem" }}>{plan.name}</div>
                                            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{plan.durationMonths} Months</div>
                                        </div>
                                        <div style={{ fontWeight: "800", color: "var(--coral, #F16F68)" }}>
                                            ₹{plan.price} →
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>

                        <div style={{ display: "flex", gap: "10px" }}>
                            <button
                                onClick={() => setModalOpen(false)}
                                style={{
                                    flex: 1,
                                    padding: "10px",
                                    border: "1px solid #cbd5e1",
                                    borderRadius: "10px",
                                    backgroundColor: "white",
                                    cursor: "pointer",
                                    fontWeight: "600"
                                }}
                            >
                                Cancel
                            </button>
                            <Link
                                href={`/dashboard/seller/payment?category=${modalCategory}`}
                                onClick={() => setModalOpen(false)}
                                style={{
                                    flex: 1,
                                    padding: "10px",
                                    borderRadius: "10px",
                                    backgroundColor: "var(--coral, #F16F68)",
                                    color: "white",
                                    textAlign: "center",
                                    textDecoration: "none",
                                    fontWeight: "600",
                                    fontSize: "0.95rem"
                                }}
                            >
                                View All Plans
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
