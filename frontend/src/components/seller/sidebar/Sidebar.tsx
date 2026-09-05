"use client";

import React from "react";
import Link from "next/link";
import Image, { StaticImageData } from "next/image";
import { usePathname } from "next/navigation";
import navLogoImg from "@/components/navbar/logo-nav.png";
import {
  LayoutGrid,
  ShoppingBag,
  BookOpen,
  Home,
  CalendarCheck,
  Truck,
  CreditCard,
  UserCircle,
  X,
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string; className?: string }>;
  href: string;
}

export const SELLER_NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid, href: "/seller/dashboard" },
  { id: "orders", label: "Orders", icon: ShoppingBag, href: "/seller/orders" },
  { id: "menu", label: "Menu", icon: BookOpen, href: "/seller/menu" },
  { id: "rooms", label: "Rooms", icon: Home, href: "/dashboard/seller/rooms" },
  { id: "bookings", label: "Bookings", icon: CalendarCheck, href: "/seller/booking" },
  { id: "delivery", label: "Delivery", icon: Truck, href: "/seller/riderMng" },
  { id: "subscription", label: "Subscription", icon: CreditCard, href: "/dashboard/seller/payment" },
  { id: "profile", label: "Profile", icon: UserCircle, href: "/seller/profile" },
];

export interface SellerSidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
  activeItemId?: string;
  logoSrc?: string | StaticImageData;
  roleTagText?: string;
}

export default function SellerSidebar({
  isMobileOpen = false,
  onClose,
  activeItemId,
  logoSrc = navLogoImg,
  roleTagText = "OWNER ROLE",
}: SellerSidebarProps) {
  const pathname = usePathname();

  // Helper to determine if a nav item is currently active
  const isItemActive = (item: NavItem) => {
    if (activeItemId) {
      return activeItemId === item.id;
    }
    if (item.id === "dashboard") {
      return (
        pathname?.startsWith("/seller/dashboard") ||
        pathname === "/dashboard/seller" ||
        pathname === "/dashboard/seller/"
      );
    }
    if (item.id === "orders") {
      return (
        pathname?.startsWith("/seller/orders") ||
        pathname?.startsWith("/seller/order-default") ||
        pathname?.startsWith("/dashboard/seller/orders")
      );
    }
    if (item.id === "menu") {
      return (
        pathname?.startsWith("/seller/menu") ||
        pathname?.startsWith("/seller/edit-menu") ||
        pathname?.startsWith("/dashboard/seller/menu") ||
        pathname?.startsWith("/dashboard/seller/edit-menu")
      );
    }
    if (item.id === "bookings") {
      return (
        pathname?.startsWith("/seller/booking") ||
        pathname?.startsWith("/dashboard/seller/bookings")
      );
    }
    if (item.id === "delivery") {
      return pathname?.startsWith("/seller/riderMng") || pathname?.startsWith("/dashboard/seller/delivery");
    }
    if (item.id === "profile") {
      return pathname?.startsWith("/seller/profile") || pathname?.startsWith("/dashboard/seller/profile");
    }
    return Boolean(pathname?.startsWith(item.href));
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.45)",
            backdropFilter: "blur(4px)",
            zIndex: 998,
          }}
          className="mobile-backdrop"
        />
      )}

      {/* Main Sidebar Container (Width: 240px, Height: 100% / 1024px, Padding: 24px, Gap: 32px, Background: #FFFFFF) */}
      <aside
        style={{
          width: "240px",
          minWidth: "240px",
          maxWidth: "240px",
          height: "100%",
          minHeight: "100vh",
          backgroundColor: "#FFFFFF",
          borderRight: "1px solid #F1F5F9",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "32px",
          boxSizing: "border-box",
          fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
          zIndex: 999,
          transition: "transform 0.3s ease",
        }}
        className={`seller-sidebar ${isMobileOpen ? "open" : ""}`}
      >
        {/* Brand Wrapper (Width: 192px, Height: 65px, Gap: 12px) */}
        <div
          style={{
            width: "192px",
            maxWidth: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
          className="brand-wrapper"
        >
          {/* Logo Row (Width: 192px, Height: 32px) */}
          <div
            style={{
              width: "192px",
              maxWidth: "100%",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
            }}
            className="logo"
          >
            <Link
              href="/dashboard/seller"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                textDecoration: "none",
                userSelect: "none",
              }}
            >
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#ffffff",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.08)",
                  flexShrink: 0,
                }}
              >
                <Image
                  src={logoSrc}
                  alt="Neo Cloud Bites Logo"
                  width={38}
                  height={38}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                  priority
                />
              </div>
              <span
                style={{
                  fontSize: "13.5px",
                  fontWeight: 800,
                  color: "#0F172A",
                  letterSpacing: "-0.01em",
                  fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                  whiteSpace: "nowrap",
                }}
              >
                NEO CLOUD
              </span>
            </Link>

            {/* Mobile close button */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748B",
                  padding: "4px",
                  display: "none",
                }}
                className="sidebar-close-btn"
                aria-label="Close sidebar"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Role Tag (Width: 89px, Height: 21px, Radius: 6px, Padding: 4px 8px, Background: #FFF1E8) */}
          <div
            style={{
              width: "89px",
              minWidth: "89px",
              maxWidth: "89px",
              height: "21px",
              backgroundColor: "#FFF1E8",
              borderRadius: "6px",
              padding: "4px 8px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              boxSizing: "border-box",
            }}
            className="role-tag"
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#F97316",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                lineHeight: 1,
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                whiteSpace: "nowrap",
              }}
            >
              {roleTagText}
            </span>
          </div>
        </div>

        {/* Navigation List (Width: 192px, Gap: 4px) */}
        <nav
          style={{
            width: "192px",
            maxWidth: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
          className="nav-list"
          aria-label="Seller Navigation"
        >
          {SELLER_NAV_ITEMS.map((item) => {
            const active = isItemActive(item);
            const IconComponent = item.icon;

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onClose}
                style={{
                  width: "192px",
                  maxWidth: "100%",
                  height: "42px",
                  borderRadius: "8px",
                  padding: "10px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  textDecoration: "none",
                  boxSizing: "border-box",
                  backgroundColor: active ? "#FFF1E8" : "transparent",
                  borderLeft: active ? "3px solid #F97316" : "3px solid transparent",
                  color: active ? "#F97316" : "#64748B",
                  fontWeight: active ? 600 : 500,
                  fontSize: "14px",
                  transition: "all 0.18s ease",
                  fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                  position: "relative",
                }}
                className={`nav-item ${active ? "active" : ""}`}
              >
                <IconComponent
                  size={19}
                  color={active ? "#F97316" : "#64748B"}
                />
                <span
                  style={{
                    lineHeight: 1,
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <style jsx>{`
        .nav-item:hover:not(.active) {
          background-color: #F8FAFC !important;
          color: #0F172A !important;
        }
        .nav-item:hover:not(.active) :global(svg) {
          color: #0F172A !important;
        }
        @media (max-width: 768px) {
          .seller-sidebar {
            position: fixed !important;
            top: 0;
            left: 0;
            transform: translateX(-100%);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
          }
          .seller-sidebar.open {
            transform: translateX(0);
          }
          .sidebar-close-btn {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
}
