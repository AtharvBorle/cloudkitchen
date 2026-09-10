"use client";

import React, { useState } from "react";
import SellerSidebar from "../../sidebar/Sidebar";
import Topbar from "../../nav/Topbar";
import RiderSettlements, {
  RiderSettlementsProps,
  RiderProfileInfo,
  CashCollectionBalanceInfo,
  LedgerEntry,
} from "./RiderSettlements";

export interface RiderSettlementDasProps {
  topbarTitle?: string;
  searchPlaceholder?: string;
  ownerName?: string;
  partnerRole?: string;
  avatarInitials?: string;
  activeSidebarId?: string;
  riderProfile?: RiderProfileInfo;
  cashBalance?: CashCollectionBalanceInfo;
  ledgerHistory?: LedgerEntry[];
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
  onAddDeliveryAgent?: () => void;
  onRecordSettlement?: () => void;
}

export default function RiderSettlementDas({
  topbarTitle = "Owner Operations Console",
  searchPlaceholder = "Search order, room, dish...",
  ownerName = "John Doe",
  partnerRole = "Neo Cloud Partner",
  avatarInitials = "JD",
  activeSidebarId = "delivery",
  riderProfile,
  cashBalance,
  ledgerHistory,
  onSearch,
  onNotificationClick,
  onAddDeliveryAgent,
  onRecordSettlement,
}: RiderSettlementDasProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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
      className="rider-settlement-das-layout"
    >
      {/* 1. Left Sidebar Component (Width: 240px, Active Item: Delivery) */}
      <SellerSidebar
        activeItemId={activeSidebarId}
        isMobileOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
      />

      {/* 2. Right Main Area (Width: 1200px / Flex 1) */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          backgroundColor: "#F7F8FB",
        }}
        className="rider-settlement-main-wrapper"
      >
        {/* Topbar Component (Height: 64px) */}
        <Topbar
          title={topbarTitle}
          searchPlaceholder={searchPlaceholder}
          ownerName={ownerName}
          partnerRole={partnerRole}
          avatarInitials={avatarInitials}
          onSearch={onSearch}
          onNotificationClick={onNotificationClick}
          onMenuToggle={() => setIsMobileOpen((prev) => !prev)}
        />

        {/* Rider Settlements Canvas Component (1200px Canvas containing Header, Profiles & Ledger Table) */}
        <RiderSettlements
          riderProfile={riderProfile}
          cashBalance={cashBalance}
          ledgerHistory={ledgerHistory}
          onAddDeliveryAgent={onAddDeliveryAgent}
          onRecordSettlement={onRecordSettlement}
        />
      </div>
    </div>
  );
}
