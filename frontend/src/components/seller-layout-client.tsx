"use client";

import { useState, useEffect } from "react";
import SellerSidebar from "@/components/seller-sidebar";
import { Menu, ChefHat } from "lucide-react";

export default function SellerLayoutClient({ children }: { children: React.ReactNode }) {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkScreen = () => setIsMobile(window.innerWidth <= 768);
        checkScreen();
        window.addEventListener("resize", checkScreen);
        return () => window.removeEventListener("resize", checkScreen);
    }, []);

    const toggleSidebar = () => {
        setIsCollapsed(prev => !prev);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#F0F2F5', fontFamily: "var(--font-sans)" }}>

            {/* Mobile Header - Simplified */}
            <header className="mobile-only mobile-header" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1A1C23' }}>Kitchen Dashboard</span>
                <button
                    onClick={() => setIsMobileOpen(true)}
                    style={{ color: '#1A1C23', backgroundColor: '#FFF', padding: '8px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                >
                    <Menu size={24} />
                </button>
            </header>

            {!isMobile && (
                <header style={{
                    height: "70px",
                    backgroundColor: "white",
                    borderBottom: "1px solid #E2E8F0",
                    display: "flex",
                    alignItems: "center",
                    padding: "0 30px",
                    gap: "16px",
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
                    <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1A1C23' }}>Seller Panel</span>
                </header>
            )}

            <div style={{ display: 'flex', flex: 1, height: isMobile ? 'auto' : 'calc(100vh - 70px)', overflow: 'hidden' }}>
                <SellerSidebar isMobileOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} isCollapsed={isCollapsed} />

                {/* Main Content Area */}
                <main className="dashboard-main" style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
                    {children}
                </main>
            </div>
        </div>
    );
}
