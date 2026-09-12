"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SellerSidebar from "../../sidebar/Sidebar";
import Topbar from "../../nav/Topbar";
import RiderSettlements, {
  RiderSettlementsProps,
  RiderProfileInfo,
  CashCollectionBalanceInfo,
  LedgerEntry,
  RiderSummaryItem,
} from "./RiderSettlements";
import { useSellerProfile } from "@/hooks/useSellerProfile";
import { fetchApi } from "@/lib/fetch-api";

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

function RiderSettlementContent({
  topbarTitle = "Owner Operations Console",
  searchPlaceholder = "Search order, room, dish...",
  ownerName: initialOwnerName,
  partnerRole: initialPartnerRole,
  avatarInitials: initialAvatarInitials,
  activeSidebarId = "delivery",
  riderProfile: propRiderProfile,
  cashBalance: propCashBalance,
  ledgerHistory: propLedgerHistory,
  onSearch,
  onNotificationClick,
  onAddDeliveryAgent,
  onRecordSettlement,
}: RiderSettlementDasProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRiderId = searchParams.get("riderId");

  const seller = useSellerProfile();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const ownerName = initialOwnerName || seller.ownerName;
  const partnerRole = initialPartnerRole || seller.partnerRole;
  const avatarInitials = initialAvatarInitials || seller.avatarInitials;

  const [deliveryRiders, setDeliveryRiders] = useState<any[]>([]);
  const [selectedRider, setSelectedRider] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch all delivery persons for the seller
  useEffect(() => {
    async function loadDeliverySquad() {
      try {
        setLoading(true);
        const res = await fetchApi("/api/seller/delivery");
        if (res.ok) {
          const data = await res.json();
          const list = data.data?.deliveryPersons || data.deliveryPersons || data.data || [];
          if (Array.isArray(list) && list.length > 0) {
            setDeliveryRiders(list);
            const found = rawRiderId
              ? list.find((r: any) => r.id === rawRiderId) || list[0]
              : list[0];
            setSelectedRider(found);
          }
        }
      } catch (err) {
        console.error("Failed to load delivery squad in RiderSettlementDas:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDeliverySquad();
  }, [rawRiderId]);

  // 2. Fetch transactions for the selected rider
  useEffect(() => {
    if (!selectedRider?.id) return;

    async function loadTransactions() {
      try {
        const res = await fetchApi(`/api/seller/delivery/${selectedRider.id}/transactions`);
        if (res.ok) {
          const data = await res.json();
          const txList = data.data?.transactions || data.transactions || data.data || [];
          if (Array.isArray(txList)) {
            setTransactions(txList);
          }
        }
      } catch (err) {
        console.error("Failed to load rider transactions:", err);
      }
    }
    loadTransactions();
  }, [selectedRider?.id]);

  const handleSelectRider = (newRiderId: string) => {
    const found = deliveryRiders.find((r) => r.id === newRiderId);
    if (found) {
      setSelectedRider(found);
      router.push(`/seller/delivery/settlements?riderId=${encodeURIComponent(newRiderId)}`);
    }
  };

  // Map Rider Profile Info
  const effectiveRiderProfile: RiderProfileInfo = propRiderProfile || {
    id: selectedRider?.id || "r1",
    name: selectedRider?.name || "Rider",
    phone: selectedRider?.phone || "+91 98765 43210",
    email: selectedRider?.email || "",
    vehicleNumber: selectedRider ? `DL 3S ${selectedRider.phone ? selectedRider.phone.slice(-4) : "8912"}` : "DL 3S CQ 8912",
    status: selectedRider ? (selectedRider.isActive ? "On Duty" : "Off Duty") : "On Duty",
  };

  // Map Cash Balance Info
  const rawBalance = selectedRider?.outstandingBalance !== undefined ? selectedRider.outstandingBalance : 0;
  const effectiveCashBalance: CashCollectionBalanceInfo = propCashBalance || {
    balance: `₹${rawBalance.toLocaleString("en-IN")}`,
    rawBalance: rawBalance,
    riderName: selectedRider?.name?.split(" ")[0] || "Rider",
    limitAmount: "₹5,000",
    warningMessage: rawBalance > 0
      ? `Limit is ₹5,000. Collect cash soon to avoid automatic profile lock.`
      : `No outstanding cash currently held by this rider.`,
  };

  // Map Ledger History
  const effectiveLedgerHistory: LedgerEntry[] = propLedgerHistory || (transactions.length > 0
    ? transactions.map((tx: any) => {
        const amt = Math.abs(tx.amount || 0);
        const isSettlement = tx.type === "SETTLEMENT" || tx.amount < 0;
        const sign = isSettlement ? "-₹" : "+₹";
        const dateObj = new Date(tx.createdAt || Date.now());

        let typeLabel = "Collection";
        if (tx.type === "SETTLEMENT") typeLabel = "Settlement";
        else if (tx.type === "ADJUSTMENT") typeLabel = "Adjustment";

        return {
          id: tx.id,
          type: typeLabel,
          description: tx.description || (tx.orderId ? `Cash Collected from #${tx.order?.orderNumber || tx.orderId.slice(0, 8)}` : "Cash Transaction"),
          amount: `${sign}${amt.toLocaleString("en-IN")}`,
          isPositive: !isSettlement,
          dateTime: !isNaN(dateObj.getTime())
            ? `${dateObj.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}, ${dateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
            : "Recent",
          date: !isNaN(dateObj.getTime()) ? dateObj.toISOString().slice(0, 10) : "",
        };
      })
    : []);

  const allRidersSummary: RiderSummaryItem[] = deliveryRiders.map((r: any) => ({
    id: r.id,
    name: r.name,
    phone: r.phone || "",
    balance: r.outstandingBalance || 0,
    status: r.isActive ? "On Duty" : "Off Duty",
  }));

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
          onSearch={(q) => {
            setSearchQuery(q);
            if (onSearch) onSearch(q);
          }}
          onNotificationClick={onNotificationClick}
          onMenuToggle={() => setIsMobileOpen((prev) => !prev)}
        />

        {/* Rider Settlements Canvas Component (1200px Canvas containing Header, Profiles & Ledger Table) */}
        <RiderSettlements
          riderProfile={effectiveRiderProfile}
          cashBalance={effectiveCashBalance}
          ledgerHistory={effectiveLedgerHistory}
          allRiders={allRidersSummary}
          selectedRiderId={selectedRider?.id}
          onSelectRider={handleSelectRider}
          searchQuery={searchQuery}
          onAddDeliveryAgent={onAddDeliveryAgent}
          onRecordSettlement={onRecordSettlement}
          onSettlementRecorded={(amount, newBalance) => {
            setSelectedRider((prev: any) => (prev ? { ...prev, outstandingBalance: newBalance } : prev));
          }}
        />
      </div>
    </div>
  );
}

export default function RiderSettlementDas(props: RiderSettlementDasProps) {
  return (
    <Suspense
      fallback={
        <div style={{ padding: "40px", textAlign: "center", color: "#64748B", fontFamily: "sans-serif" }}>
          Loading Rider Settlements Console...
        </div>
      }
    >
      <RiderSettlementContent {...props} />
    </Suspense>
  );
}
