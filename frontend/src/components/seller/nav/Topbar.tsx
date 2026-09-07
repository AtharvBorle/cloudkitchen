"use client";

import React, { useState } from "react";
import { Search, Bell, Menu } from "lucide-react";

export interface TopbarProps {
  title?: string;
  ownerName?: string;
  partnerRole?: string;
  avatarInitials?: string;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
  onMenuToggle?: () => void;
}

export default function Topbar({
  title = "Owner Operations Console",
  ownerName = "John Doe",
  partnerRole = "Neo Cloud Partner",
  avatarInitials = "JD",
  searchPlaceholder = "Search order, room, dish...",
  onSearch,
  onNotificationClick,
  onMenuToggle,
}: TopbarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  return (
    <header
      style={{
        width: "100%",
        height: "64px",
        minHeight: "64px",
        maxHeight: "64px",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid #E2E8F0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        boxSizing: "border-box",
        zIndex: 40,
        fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
      }}
      className="seller-topbar"
    >
      {/* Left: Title + Mobile Menu Trigger */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {onMenuToggle && (
          <button
            type="button"
            onClick={onMenuToggle}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "6px",
              color: "#0F172A",
              display: "none",
              alignItems: "center",
              justifyContent: "center",
            }}
            className="mobile-menu-trigger"
            aria-label="Open sidebar navigation"
          >
            <Menu size={22} />
          </button>
        )}
        <h2
          style={{
            fontSize: "17px",
            fontWeight: 700,
            color: "#0F172A",
            margin: 0,
            letterSpacing: "-0.2px",
          }}
        >
          {title}
        </h2>
      </div>

      {/* Right Controls: Search + Notification + User Pill */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        {/* Search Bar */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            width: "250px",
            height: "38px",
            backgroundColor: "#F1F5F9",
            borderRadius: "8px",
            padding: "0 12px",
            boxSizing: "border-box",
          }}
          className="topbar-search"
        >
          <Search
            size={16}
            color="#94A3B8"
            style={{ marginRight: "8px", flexShrink: 0 }}
          />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={handleSearchChange}
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              backgroundColor: "transparent",
              fontSize: "13px",
              color: "#0F172A",
              fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
            }}
          />
        </div>

        {/* Notification Button */}
        <button
          type="button"
          onClick={onNotificationClick}
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "50%",
            backgroundColor: "#F8FAFC",
            border: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#64748B",
            transition: "all 0.15s ease",
          }}
          className="notification-btn"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell size={17} />
        </button>

        {/* User Profile Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "#FF5500",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "13px",
              letterSpacing: "0.5px",
              boxShadow: "0 2px 8px rgba(255, 85, 0, 0.25)",
            }}
          >
            {avatarInitials}
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
            <span
              style={{
                fontSize: "13.5px",
                fontWeight: 700,
                color: "#0F172A",
              }}
            >
              {ownerName}
            </span>
            <span
              style={{
                fontSize: "11px",
                color: "#94A3B8",
                fontWeight: 400,
              }}
            >
              {partnerRole}
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .notification-btn:hover {
          background-color: #F1F5F9 !important;
          color: #0F172A !important;
        }
        @media (max-width: 900px) {
          .seller-topbar {
            padding: 0 20px !important;
          }
          .mobile-menu-trigger {
            display: flex !important;
          }
          .topbar-search {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}
