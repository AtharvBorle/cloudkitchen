"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useState, useEffect } from "react";

export default function SellerSidebar({ isMobileOpen, onClose }: { isMobileOpen?: boolean; onClose?: () => void }) {
    const pathname = usePathname();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkScreen = () => setIsMobile(window.innerWidth <= 768);
        checkScreen();
        window.addEventListener("resize", checkScreen);
        return () => window.removeEventListener("resize", checkScreen);
    }, []);

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

                <Link href="/dashboard/seller/menu" style={getLinkStyle('/dashboard/seller/menu')} onClick={onClose}>
                    Manage Menu
                </Link>

                <Link href="/dashboard/seller/inventory" style={getLinkStyle('/dashboard/seller/inventory')} onClick={onClose}>
                    Inventory & Stock
                </Link>

                <Link href="/dashboard/seller/orders" style={getLinkStyle('/dashboard/seller/orders')} onClick={onClose}>
                    Orders
                </Link>

                <Link href="/dashboard/seller/delivery" style={getLinkStyle('/dashboard/seller/delivery')} onClick={onClose}>
                    Delivery Persons
                </Link>

                <Link href="/dashboard/seller/offers" style={getLinkStyle('/dashboard/seller/offers')} onClick={onClose}>
                    Offers & Coupons
                </Link>

                <Link href="/dashboard/seller/rooms" style={getLinkStyle('/dashboard/seller/rooms')} onClick={onClose}>
                    Rooms
                </Link>

                <Link href="/dashboard/seller/profile" style={getLinkStyle('/dashboard/seller/profile')} onClick={onClose}>
                    Profile & QR
                </Link>

                <Link href="/api/auth/signout" style={{ display: 'block', padding: '12px 20px', color: '#A0AEC0', marginTop: '10px' }}>
                    Logout
                </Link>
            </nav>
        </>
    );

    if (isMobile) {
        return (
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
        );
    }

    return (
        <aside style={{ width: '250px', backgroundColor: '#1A1C23', color: 'white', display: 'flex', flexDirection: 'column', minHeight: '100vh', flexShrink: 0 }}>
            {sidebarContent}
        </aside>
    );
}
