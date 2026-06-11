"use client";

import { useState } from "react";
import SellerSidebar from "@/components/seller-sidebar";
import { Menu, ChefHat } from "lucide-react";

export default function SellerLayoutClient({ children }: { children: React.ReactNode }) {
    const [isMobileOpen, setIsMobileOpen] = useState(false);

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

            <div style={{ display: 'flex', flex: 1 }}>
                <SellerSidebar isMobileOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />

                {/* Main Content Area */}
                <main className="dashboard-main" style={{ flex: 1, padding: '30px', overflowX: 'hidden' }}>
                    {children}
                </main>
            </div>
        </div>
    );
}
