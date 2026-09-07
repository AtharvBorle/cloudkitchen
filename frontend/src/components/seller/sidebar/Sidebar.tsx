"use client";

import React, { useState } from "react";
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
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string; className?: string; style?: React.CSSProperties }>;
  href: string;
}

export const SELLER_NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid, href: "/seller/dashboard" },
  { id: "orders", label: "Orders", icon: ShoppingBag, href: "/seller/orders" },
  { id: "menu", label: "Menu", icon: BookOpen, href: "/seller/menu" },
  { id: "rooms", label: "Rooms", icon: Home, href: "/seller/rooms/config" },
  { id: "bookings", label: "Bookings", icon: CalendarCheck, href: "/seller/booking" },
  { id: "delivery", label: "Delivery", icon: Truck, href: "/seller/riderMng" },
  { id: "subscription", label: "Subscription", icon: CreditCard, href: "/seller/subscription" },
  { id: "profile", label: "Profile", icon: UserCircle, href: "/seller/profile" },
];

export interface SellerSidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
  activeItemId?: string;
  logoSrc?: string | StaticImageData;
  roleTagText?: string;
  isCollapsed?: boolean;
  defaultCollapsed?: boolean;
  onToggleCollapse?: () => void;
  showCollapseToggle?: boolean;
}

export default function SellerSidebar({
  isMobileOpen = false,
  onClose,
  activeItemId,
  logoSrc = navLogoImg,
  roleTagText = "OWNER ROLE",
  isCollapsed,
  defaultCollapsed = false,
  onToggleCollapse,
  showCollapseToggle = true,
}: SellerSidebarProps) {
  const pathname = usePathname();
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);

  // Controlled or uncontrolled collapse state
  const isEffectiveCollapsed = isCollapsed !== undefined ? isCollapsed : internalCollapsed;

  const handleToggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => !prev);
    }
  };

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
    if (item.id === "rooms") {
      return (
        pathname?.startsWith("/seller/rooms") ||
        pathname?.startsWith("/dashboard/seller/rooms")
      );
    }
    if (item.id === "bookings") {
      return (
        pathname?.startsWith("/seller/booking") ||
        pathname?.startsWith("/dashboard/seller/bookings")
      );
    }
    if (item.id === "delivery") {
      return (
        pathname?.startsWith("/seller/riderMng") ||
        pathname?.startsWith("/dashboard/seller/delivery")
      );
    }
    if (item.id === "subscription") {
      return (
        pathname?.startsWith("/seller/subscription") ||
        pathname?.startsWith("/dashboard/seller/payment")
      );
    }
    if (item.id === "profile") {
      return (
        pathname?.startsWith("/seller/profile") ||
        pathname?.startsWith("/dashboard/seller/profile")
      );
    }
    return Boolean(pathname?.startsWith(item.href));
  };

  const sidebarWidth = isEffectiveCollapsed ? "76px" : "240px";

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

      {/* Main Sidebar Container */}
      <aside
        style={{
          width: sidebarWidth,
          minWidth: sidebarWidth,
          maxWidth: sidebarWidth,
          height: "100%",
          minHeight: "100vh",
          backgroundColor: "#FFFFFF",
          borderRight: "1px solid #F1F5F9",
          padding: isEffectiveCollapsed ? "24px 10px" : "24px 16px",
          display: "flex",
          flexDirection: "column",
          gap: isEffectiveCollapsed ? "24px" : "28px",
          boxSizing: "border-box",
          fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
          zIndex: 999,
          transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.25s cubic-bezier(0.4, 0, 0.2, 1), max-width 0.25s cubic-bezier(0.4, 0, 0.2, 1), padding 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s ease",
          position: "relative",
        }}
        className={`seller-sidebar ${isMobileOpen ? "open" : ""} ${isEffectiveCollapsed ? "collapsed" : "expanded"}`}
      >
        {/* Brand Header Section */}
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            alignItems: isEffectiveCollapsed ? "center" : "stretch",
          }}
          className="brand-wrapper"
        >
          {/* Logo Row */}
          <div
            style={{
              width: "100%",
              height: "38px",
              display: "flex",
              alignItems: "center",
              justifyContent: isEffectiveCollapsed ? "center" : "space-between",
              gap: "8px",
            }}
            className="logo"
          >
            <Link
              href="/dashboard/seller"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "9px",
                textDecoration: "none",
                userSelect: "none",
                overflow: "hidden",
              }}
              title="Neo Cloud Bites Seller Dashboard"
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
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
                  width={36}
                  height={36}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                  priority
                />
              </div>

              {!isEffectiveCollapsed && (
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 800,
                    color: "#0F172A",
                    letterSpacing: "-0.01em",
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                    whiteSpace: "nowrap",
                    opacity: 1,
                    transition: "opacity 0.2s ease",
                  }}
                  className="brand-title"
                >
                  NEO CLOUD BITES
                </span>
              )}
            </Link>

            {/* Desktop Collapse / Expand Button in Header */}
            {!isEffectiveCollapsed && showCollapseToggle && (
              <button
                type="button"
                onClick={handleToggleCollapse}
                style={{
                  background: "transparent",
                  border: "1px solid #E2E8F0",
                  borderRadius: "6px",
                  cursor: "pointer",
                  color: "#64748B",
                  padding: "5px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.18s ease",
                  backgroundColor: "#F8FAFC",
                }}
                className="desktop-collapse-btn"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose size={17} />
              </button>
            )}

            {/* Mobile Close Button */}
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

          {/* Role Tag (Expanded mode) */}
          {!isEffectiveCollapsed && (
            <div
              style={{
                alignSelf: "flex-start",
                backgroundColor: "#FFF1E8",
                borderRadius: "6px",
                padding: "3px 8px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                boxSizing: "border-box",
                marginTop: "2px",
              }}
              className="role-tag"
            >
              <span
                style={{
                  fontSize: "10.5px",
                  fontWeight: 700,
                  color: "#F97316",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  lineHeight: 1.2,
                  fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                  whiteSpace: "nowrap",
                }}
              >
                {roleTagText}
              </span>
            </div>
          )}

          {/* Compact Toggle Button when Collapsed */}
          {isEffectiveCollapsed && showCollapseToggle && (
            <button
              type="button"
              onClick={handleToggleCollapse}
              style={{
                marginTop: "6px",
                width: "34px",
                height: "34px",
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                cursor: "pointer",
                color: "#64748B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.18s ease",
              }}
              className="desktop-expand-btn"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen size={17} />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            flex: 1,
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
                title={item.label}
                style={{
                  width: "100%",
                  height: "42px",
                  borderRadius: "8px",
                  padding: isEffectiveCollapsed ? "0" : "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: isEffectiveCollapsed ? "center" : "flex-start",
                  gap: isEffectiveCollapsed ? "0" : "12px",
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
                  overflow: "hidden",
                }}
                className={`nav-item ${active ? "active" : ""}`}
              >
                <IconComponent
                  size={isEffectiveCollapsed ? 20 : 19}
                  color={active ? "#F97316" : "#64748B"}
                  style={{ flexShrink: 0 }}
                />
                {!isEffectiveCollapsed && (
                  <span
                    style={{
                      lineHeight: 1,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    className="nav-label"
                  >
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Collapse / Expand Bar (Optional Quick Toggle) */}
        {showCollapseToggle && (
          <div
            style={{
              paddingTop: "12px",
              borderTop: "1px solid #F1F5F9",
              display: "flex",
              justifyContent: isEffectiveCollapsed ? "center" : "flex-end",
              alignItems: "center",
              width: "100%",
            }}
            className="sidebar-footer"
          >
            <button
              type="button"
              onClick={handleToggleCollapse}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#94A3B8",
                fontSize: "12px",
                fontWeight: 600,
                padding: "6px 8px",
                borderRadius: "6px",
                transition: "all 0.18s ease",
              }}
              className="footer-toggle-btn"
              title={isEffectiveCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isEffectiveCollapsed ? (
                <ChevronRight size={16} />
              ) : (
                <>
                  <ChevronLeft size={16} />
                  <span>Collapse</span>
                </>
              )}
            </button>
          </div>
        )}
      </aside>

      <style jsx>{`
        .desktop-collapse-btn:hover,
        .desktop-expand-btn:hover {
          background-color: #E2E8F0 !important;
          color: #0F172A !important;
          border-color: #CBD5E1 !important;
        }
        .footer-toggle-btn:hover {
          background-color: #F8FAFC !important;
          color: #0F172A !important;
        }
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
            width: 240px !important;
            min-width: 240px !important;
            max-width: 240px !important;
            padding: 24px 16px !important;
            transform: translateX(-100%);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
          }
          .seller-sidebar.open {
            transform: translateX(0);
          }
          .sidebar-close-btn {
            display: flex !important;
          }
          .desktop-collapse-btn,
          .desktop-expand-btn,
          .sidebar-footer {
            display: none !important;
          }
          .brand-title,
          .role-tag,
          .nav-label {
            display: inline-block !important;
            opacity: 1 !important;
          }
          .nav-item {
            justify-content: flex-start !important;
            padding: 10px 14px !important;
            gap: 12px !important;
          }
        }
      `}</style>
    </>
  );
}
