"use client";
import { fetchApi } from "@/lib/fetch-api";
import { useState, useEffect } from "react";
import Link from "next/link";
import { LogOut, Bike, ClipboardList, Settings, User } from "lucide-react";
import { signOut } from "next-auth/react";

export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#F7FAFC' }}>
            {/* Sidebar */}
            <aside style={{ width: '280px', backgroundColor: '#1A1C23', color: 'white', display: 'flex', flexDirection: 'column' }}>
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
            <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
                {children}
            </main>
        </div>
    );
}
