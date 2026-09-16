"use client";

import React, { useState, useEffect } from "react";
import SellerSidebar from "../sidebar/Sidebar";
import Topbar from "../nav/Topbar";
import { useSellerProfile } from "@/hooks/useSellerProfile";
import { fetchApi } from "@/lib/fetch-api";
import SellerOffersClient from "@/app/dashboard/seller/offers/client-page";
import { ResponsiveNavMenu } from "../nav/ResponsiveNavMenu";

export interface SellerOffersCanvasDasProps {
  topbarTitle?: string;
  searchPlaceholder?: string;
  activeSidebarId?: string;
}

export default function SellerOffersCanvasDas({
  topbarTitle = "Owner Operations Console",
  searchPlaceholder = "Search coupons, offers, discounts...",
  activeSidebarId = "offers",
}: SellerOffersCanvasDasProps) {
  const seller = useSellerProfile();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ sellerId: string; products: any[] } | null>(null);

  useEffect(() => {
    async function loadOffers() {
      try {
        const res = await fetchApi("/api/seller/dashboard/offers");
        if (res.ok) {
          const result = await res.json();
          const parsed = result.data || result;
          setData({
            sellerId: parsed.sellerId || seller.id || "seller",
            products: Array.isArray(parsed.products) ? parsed.products : [],
          });
        } else {
          setData({
            sellerId: seller.id || "seller",
            products: [],
          });
        }
      } catch (err) {
        console.error("Error loading offers:", err);
        setData({
          sellerId: seller.id || "seller",
          products: [],
        });
      } finally {
        setLoading(false);
      }
    }
    loadOffers();
  }, [seller.id]);

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        alignItems: "flex-start",
        backgroundColor: "#F7F8FB",
        fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
      }}
      className="offers-canvas-das-layout"
    >
      {/* 1. Left Side Menu Component */}
      <SellerSidebar
        activeItemId={activeSidebarId}
        isMobileOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        ownerName={seller.ownerName}
        partnerRole={seller.partnerRole}
        avatarInitials={seller.avatarInitials}
      />

      {/* 2. Responsive Mobile Drawer */}
      <ResponsiveNavMenu
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        activeItemId={activeSidebarId}
        ownerName={seller.ownerName}
        roleTagText={seller.partnerRole}
      />

      {/* 3. Main Workspace Area */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          backgroundColor: "#F7F8FB",
        }}
      >
        {/* Top Header Navigation */}
        <Topbar
          title={topbarTitle}
          searchPlaceholder={searchPlaceholder}
          onMenuClick={() => setIsMobileOpen(true)}
          ownerName={seller.ownerName}
          partnerRole={seller.partnerRole}
          avatarInitials={seller.avatarInitials}
        />

        {/* Offers & Coupons Content Body */}
        <main
          style={{
            flex: 1,
            padding: "24px",
            boxSizing: "border-box",
            maxWidth: "1400px",
            width: "100%",
            margin: "0 auto",
          }}
        >
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>
              Loading offers & coupons...
            </div>
          ) : data ? (
            <SellerOffersClient sellerId={data.sellerId} products={data.products} />
          ) : (
            <div style={{ padding: "40px", textAlign: "center", color: "#EF4444" }}>
              Failed to load offers.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
