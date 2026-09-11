"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, ShoppingBag, BedDouble, Settings } from "lucide-react";

export default function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Explore", href: "/explore-desktop", icon: Compass },
    { label: "Orders", href: "/orders-desktop", icon: ShoppingBag },
    { label: "Rooms", href: "/room-booking", icon: BedDouble },
    { label: "Settings", href: "/settings-desktop", icon: Settings },
  ];

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 999,
        backgroundColor: "#FFFFFF",
        borderTop: "1px solid #E2E8F0",
        boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.05)",
        padding: "8px 16px 12px 16px",
        display: "none",
        justifyContent: "space-around",
        alignItems: "center",
        boxSizing: "border-box",
      }}
      className="mobile-bottom-nav"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.label}
            href={item.href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              textDecoration: "none",
              color: isActive ? "#FF5500" : "#94A3B8",
              transition: "color 0.2s ease, transform 0.15s ease",
              flex: 1,
            }}
            className="bottom-nav-item"
          >
            <Icon
              size={22}
              strokeWidth={isActive ? 2.4 : 1.8}
              color={isActive ? "#FF5500" : "#94A3B8"}
            />
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: isActive ? "700" : "500",
                letterSpacing: "-0.2px",
              }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}

      <style jsx>{`
        @media (max-width: 768px) {
          .mobile-bottom-nav {
            display: flex !important;
          }
        }
        .bottom-nav-item:active {
          transform: scale(0.92);
        }
      `}</style>
    </nav>
  );
}
