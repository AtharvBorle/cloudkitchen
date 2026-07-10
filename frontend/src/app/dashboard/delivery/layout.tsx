"use client";
import { fetchApi } from "@/lib/fetch-api";
import { useState, useEffect } from "react";
import Link from "next/link";
import { LogOut, Bike, ClipboardList, Settings, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const toggleSidebar = () => setIsCollapsed(prev => !prev);

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

    return (
        <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#F7FAFC' }}>
                        {/* Sidebar */}
            <aside style={{ 
                width: isCollapsed ? '0px' : '280px', 
                overflow: 'hidden',
                transition: 'width 0.2s ease-in-out',
                backgroundColor: '#1A1C23', 
                color: 'white', 
                display: 'flex', 
                flexDirection: 'column' 
            }}>
                <div style={{ padding: '30px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ backgroundColor: '#F16F68', padding: '8px', borderRadius: '8px' }}>
                        <Bike size={24} color="white" />
                    </div>
                    <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Delivery Hub</span>
                </div>

                <nav style={{ flex: 1, padding: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <Link href="/dashboard/delivery" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', borderRadius: '8px', color: 'white', textDecoration: 'none', backgroundColor: '#2D3748' }}>
                            <ClipboardList size={20} /> My Orders
                        </Link>
                        <Link href="/dashboard/delivery/profile" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', borderRadius: '8px', color: '#A0AEC0', textDecoration: 'none' }}>
                            <User size={20} /> My Profile
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
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
                <header style={{
                    height: "70px",
                    backgroundColor: "white",
                    borderBottom: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    padding: "0 2rem",
                    gap: "16px",
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
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </button>
                    <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1A1C23' }}>Delivery Dashboard</span>
                </header>
                <div style={{ padding: '40px', flex: 1, overflowY: 'auto' }}>
                    {children}
                </div>
            </main>
        </div>
    );
}
