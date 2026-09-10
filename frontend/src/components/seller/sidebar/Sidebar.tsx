"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  ShoppingBag,
  BookOpen,
  Home,
  CalendarCheck,
  Truck,
  CreditCard,
  UserCircle,
  Headphones,
  Compass,
  BedDouble,
  LogOut,
  X,
  ChevronDown,
  Utensils,
  ChefHat,
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string; className?: string }>;
  href: string;
  badge?: string;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Home", icon: Home, href: "/explore-desktop" },
  { id: "explore", label: "Explore", icon: Compass, href: "/restaurant" },
  { id: "my-orders", label: "Orders", icon: ShoppingBag, href: "/orders-desktop" },
  { id: "rooms", label: "Rooms", icon: BedDouble, href: "/room-booking", badge: "NEW" },
];

export const SELLER_NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid, href: "/seller/dashboard" },
  { id: "orders", label: "Orders", icon: ShoppingBag, href: "/seller/orders" },
  { id: "menu", label: "Menu", icon: BookOpen, href: "/seller/menu" },
  { id: "rooms-seller", label: "Rooms", icon: Home, href: "/seller/rooms" },
  { id: "bookings", label: "Bookings", icon: CalendarCheck, href: "/dashboard/seller/bookings" },
  { id: "delivery", label: "Delivery", icon: Truck, href: "/seller/delivery" },
  { id: "subscription", label: "Subscription", icon: CreditCard, href: "/seller/create-subscription-plan" },
  { id: "support", label: "Support Tickets", icon: Headphones, href: "/seller/support" },
  { id: "profile", label: "Profile", icon: UserCircle, href: "/seller/profile" },
];

export interface SellerSidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
  activeItemId?: string;
  logoSrc?: string;
  roleTagText?: string;
  ownerName?: string;
  partnerRole?: string;
  avatarInitials?: string;
}

export default function SellerSidebar({
  isMobileOpen = false,
  onClose,
  activeItemId,
  logoSrc = "/images/seller-logo.png",
  roleTagText = "OWNER ROLE",
  ownerName = "John Doe",
  partnerRole = "Neo Cloud Partner",
  avatarInitials = "JD",
}: SellerSidebarProps) {
  const pathname = usePathname();
  const isRoomRoute = Boolean(pathname?.startsWith("/room-booking") || activeItemId === "rooms");
  const [isRoomsDropdownOpen, setIsRoomsDropdownOpen] = useState<boolean>(isRoomRoute);

  const roomSubOptions = [
    { id: "sub-rooms", label: "Rooms", href: "/room-booking", icon: BedDouble },
    { id: "sub-food", label: "Food", href: "/explore-desktop", icon: Utensils },
    { id: "sub-mess", label: "Mess/Tiffin", href: "/my-subscriptions-desktop", icon: ChefHat },
  ];

  // Helper to determine if a nav item is currently active
  const isItemActive = (item: NavItem) => {
    if (activeItemId) {
      return activeItemId === item.id;
    }
    if (item.id === "subscription") {
      return pathname?.startsWith("/seller/create-subscription-plan") || pathname?.startsWith("/dashboard/seller/create-subscription-plan");
    }
    if (item.id === "support") {
      return pathname?.startsWith("/dashboard/seller/support") || pathname?.startsWith("/seller/support");
    }
    if (item.id === "profile") {
      return pathname?.startsWith("/seller/profile") || pathname?.startsWith("/dashboard/seller/profile");
    }
    if (item.id === "delivery") {
      return pathname?.startsWith("/seller/delivery") || pathname?.startsWith("/dashboard/seller/delivery");
    }
    if (item.id === "rooms-seller") {
      return pathname?.startsWith("/seller/rooms") || pathname?.startsWith("/dashboard/seller/rooms");
    }
    if (item.id === "dashboard") {
      return pathname === "/seller/dashboard" || pathname === "/dashboard/seller";
    }
    return Boolean(pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href)));
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

      {/* Main Sidebar Container */}
      <aside
        style={{
          width: "250px",
          minWidth: "250px",
          maxWidth: "250px",
          height: "100vh",
          maxHeight: "100vh",
          overflowY: "auto",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          backgroundColor: "#FFFFFF",
          borderRight: "1px solid #F1F5F9",
          padding: "20px 16px 28px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          boxSizing: "border-box",
          fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
          zIndex: 50,
          transition: "transform 0.3s ease",
        }}
        className={`seller-sidebar ${isMobileOpen ? "open" : ""}`}
      >
        {/* Brand Header */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            width: "100%",
          }}
          className="brand-wrapper"
        >
          {/* Logo Row */}
          <div
            style={{
              width: "100%",
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
                height: "32px",
                width: "100%",
                textDecoration: "none",
              }}
            >
              <Image
                src={logoSrc}
                alt="Seller Brand Logo"
                width={180}
                height={32}
                style={{
                  height: "32px",
                  width: "auto",
                  maxWidth: "180px",
                  objectFit: "contain",
                  objectPosition: "left",
                }}
                priority
              />
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
        </div>

        {/* User Profile Card inside Sidebar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "10px 12px",
            backgroundColor: "#F8FAFC",
            borderRadius: "12px",
            border: "1px solid #E2E8F0",
            boxSizing: "border-box",
            width: "100%",
          }}
          className="sidebar-user-card"
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "#FF5500",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "14px",
              letterSpacing: "0.5px",
              flexShrink: 0,
              boxShadow: "0 2px 8px rgba(255, 85, 0, 0.25)",
            }}
          >
            {avatarInitials}
          </div>
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1, overflow: "hidden" }}>
            <span
              style={{
                fontSize: "13.5px",
                fontWeight: 700,
                color: "#0F172A",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                lineHeight: 1.2,
              }}
            >
              {ownerName}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#F97316",
                  backgroundColor: "#FFF1E8",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  letterSpacing: "0.4px",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                {roleTagText}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Nav Container */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            flex: 1,
            width: "100%",
          }}
        >
          {/* Section 1: Main Top Navigation Bar Links */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#94A3B8",
                letterSpacing: "0.6px",
                textTransform: "uppercase",
                padding: "0 12px",
                marginBottom: "4px",
              }}
            >
              MAIN NAVIGATION
            </span>

            {MAIN_NAV_ITEMS.map((item) => {
              if (item.id === "rooms") {
                const active = isItemActive(item);
                const IconComponent = item.icon;

                return (
                  <div key={item.id} style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                    <div
                      onClick={() => setIsRoomsDropdownOpen((prev) => !prev)}
                      style={{
                        width: "100%",
                        height: "40px",
                        borderRadius: "8px",
                        padding: "8px 12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        boxSizing: "border-box",
                        backgroundColor: active ? "#FFF1E8" : "transparent",
                        color: active ? "#F97316" : "#475569",
                        fontWeight: active ? 700 : 500,
                        fontSize: "13.5px",
                        cursor: "pointer",
                        transition: "all 0.18s ease",
                      }}
                      className={`nav-item ${active ? "active" : ""}`}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <IconComponent
                          size={18}
                          color={active ? "#F97316" : "#64748B"}
                        />
                        <span style={{ lineHeight: 1 }}>{item.label}</span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {item.badge && (
                          <span
                            style={{
                              fontSize: "9.5px",
                              fontWeight: 700,
                              backgroundColor: "#FF5500",
                              color: "#FFFFFF",
                              padding: "2px 6px",
                              borderRadius: "10px",
                              lineHeight: 1,
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                        <ChevronDown
                          size={15}
                          style={{
                            color: active ? "#F97316" : "#94A3B8",
                            transform: isRoomsDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.2s ease",
                          }}
                        />
                      </div>
                    </div>

                    {/* Submenu with Food, Mess/Tiffin, Rooms */}
                    {isRoomsDropdownOpen && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "2px",
                          paddingLeft: "16px",
                          marginLeft: "12px",
                          borderLeft: "2px solid #FED7AA",
                          marginTop: "3px",
                          marginBottom: "4px",
                        }}
                      >
                        {roomSubOptions.map((sub) => {
                          const SubIcon = sub.icon;
                          const isSubActive =
                            (sub.label === "Food" && pathname === "/explore-desktop") ||
                            (sub.label === "Mess/Tiffin" && pathname?.startsWith("/my-subscription")) ||
                            (sub.label === "Rooms" && pathname?.startsWith("/room-booking"));

                          return (
                            <Link
                              key={sub.id}
                              href={sub.href}
                              onClick={onClose}
                              style={{
                                width: "100%",
                                height: "34px",
                                borderRadius: "6px",
                                padding: "6px 10px",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                textDecoration: "none",
                                boxSizing: "border-box",
                                backgroundColor: isSubActive ? "#FFF7ED" : "transparent",
                                color: isSubActive ? "#F97316" : "#64748B",
                                fontWeight: isSubActive ? 700 : 500,
                                fontSize: "12.5px",
                                transition: "all 0.15s ease",
                              }}
                              className="subnav-link-item"
                            >
                              <SubIcon size={14} color={isSubActive ? "#F97316" : "#94A3B8"} />
                              <span>{sub.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const active = isItemActive(item);
              const IconComponent = item.icon;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={onClose}
                  style={{
                    width: "100%",
                    height: "40px",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    textDecoration: "none",
                    boxSizing: "border-box",
                    backgroundColor: active ? "#FFF1E8" : "transparent",
                    color: active ? "#F97316" : "#475569",
                    fontWeight: active ? 700 : 500,
                    fontSize: "13.5px",
                    transition: "all 0.18s ease",
                  }}
                  className={`nav-item ${active ? "active" : ""}`}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <IconComponent
                      size={18}
                      color={active ? "#F97316" : "#64748B"}
                    />
                    <span style={{ lineHeight: 1 }}>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      style={{
                        fontSize: "9.5px",
                        fontWeight: 700,
                        backgroundColor: "#FF5500",
                        color: "#FFFFFF",
                        padding: "2px 6px",
                        borderRadius: "10px",
                        lineHeight: 1,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Section 2: Seller Operations Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#94A3B8",
                letterSpacing: "0.6px",
                textTransform: "uppercase",
                padding: "0 12px",
                marginBottom: "4px",
              }}
            >
              SELLER OPERATIONS
            </span>

            {SELLER_NAV_ITEMS.map((item) => {
              const active = isItemActive(item);
              const IconComponent = item.icon;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={onClose}
                  style={{
                    width: "100%",
                    height: "40px",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    textDecoration: "none",
                    boxSizing: "border-box",
                    backgroundColor: active ? "#FFF1E8" : "transparent",
                    color: active ? "#F97316" : "#475569",
                    fontWeight: active ? 700 : 500,
                    fontSize: "13.5px",
                    transition: "all 0.18s ease",
                  }}
                  className={`nav-item ${active ? "active" : ""}`}
                >
                  <IconComponent
                    size={18}
                    color={active ? "#F97316" : "#64748B"}
                  />
                  <span style={{ lineHeight: 1, whiteSpace: "nowrap" }}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer with Logout Action */}
        <div style={{ marginTop: "auto", paddingTop: "12px", borderTop: "1px solid #F1F5F9" }}>
          <Link
            href="/login"
            onClick={onClose}
            style={{
              width: "100%",
              height: "40px",
              borderRadius: "8px",
              padding: "8px 12px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              textDecoration: "none",
              color: "#EF4444",
              fontWeight: 600,
              fontSize: "13.5px",
              boxSizing: "border-box",
              transition: "all 0.18s ease",
            }}
            className="nav-logout-btn"
          >
            <LogOut size={18} color="#EF4444" />
            <span>Log Out</span>
          </Link>
        </div>
      </aside>

      <style jsx>{`
        .nav-item:hover:not(.active) {
          background-color: #F8FAFC !important;
          color: #0F172A !important;
        }
        .nav-item:hover:not(.active) :global(svg) {
          color: #0F172A !important;
        }
        .nav-logout-btn:hover {
          background-color: #FEF2F2 !important;
        }
        @media (max-width: 900px) {
          .seller-sidebar {
            position: fixed !important;
            top: 0;
            left: 0;
            transform: translateX(-100%);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
            z-index: 1000 !important;
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
